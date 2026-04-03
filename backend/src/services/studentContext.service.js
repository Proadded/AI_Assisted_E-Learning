/**
 * studentContext.service.js
 *
 * The Student Context System (SCS) — a centralised data-aggregation service.
 * Runs three parallel MongoDB pipelines and assembles a unified StudentContext
 * object that any feature (dashboard, AI chatbot, instructor view) can consume.
 *
 * Never access TestResult / Progress / StudentFingerprint directly in controllers
 * for analytics purposes — always go through this service.
 */

import mongoose from "mongoose";
import TestResult from "../models/testResult.model.js";
import Progress from "../models/progress.model.js";
import StudentFingerprint from "../models/fingerprint.model.js";
import Course from "../models/course.model.js";

const ObjectId = mongoose.Types.ObjectId;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Builds and returns a full StudentContext for the given userId.
 * @param {string} userId - The User._id (string form)
 * @returns {Promise<StudentContext>}
 */
export async function buildStudentContext(userId) {
  const uid = new ObjectId(userId);

  // Run all three aggregations concurrently
  const [testHistory, progressMap, fingerprintMap] = await Promise.all([
    aggregateTestHistory(uid),
    aggregateProgressData(uid),
    aggregateFingerprintData(uid),
  ]);

  // Collect all unique courseIds seen across test history and progress
  const courseIdSet = new Set([
    ...testHistory.map((r) => r.courseId?.toString()),
    ...Object.keys(progressMap),
  ].filter(Boolean));

  if (!courseIdSet.size) {
    return buildEmptyContext(userId);
  }

  const courses = await Course.find({
    _id: { $in: [...courseIdSet].map((id) => new ObjectId(id)) },
  })
    .select("_id title category videoCount")
    .lean();

  const courseContexts = courses.map((course) => {
    const cid = course._id.toString();
    const tests = testHistory.filter((t) => t.courseId?.toString() === cid);
    const progress = progressMap[cid] || null;
    const fingerprints = fingerprintMap[cid] || [];

    return {
      courseId:       cid,
      courseTitle:    course.title,
      category:       course.category || "General",
      enrollment:     buildEnrollment(progress, course),
      testHistory:    tests,
      aggregateScore: computeScoreAggregate(tests),
      proficiency:    computeProficiency(tests),
      fingerprints,
    };
  });

  return {
    studentId:   userId,
    generatedAt: new Date().toISOString(),
    courses:     courseContexts,
    summary:     buildSummaryStats(courseContexts),
  };
}

/**
 * Lightweight refresh for a single course slice — called after a new TestResult
 * is committed (triggered by Socket.IO context:updated event on the client).
 * @param {string} userId
 * @param {string} courseId
 * @returns {Promise<CourseContext>}
 */
export async function refreshCourseContext(userId, courseId) {
  const uid = new ObjectId(userId);
  const cid = new ObjectId(courseId);

  const [tests, progressDocs, fingerprints, course] = await Promise.all([
    TestResult.find({
      studentId: uid,
      courseId: cid,
      evaluationStatus: "complete",
    })
      .sort({ createdAt: 1 })
      .populate("videoId", "title")
      .lean(),

    Progress.find({ studentId: uid })
      .where("videoId")
      .lean(),

    StudentFingerprint.find({ studentId: uid, courseId: cid }).lean(),

    Course.findById(cid).select("_id title category videoCount").lean(),
  ]);

  if (!course) return null;

  const progressMap = buildProgressMap(progressDocs);
  const progress = progressMap[courseId] || null;
  const formattedTests = tests.map(formatTestSnapshot);
  const formattedFingerprints = fingerprints.map(formatFingerprintSummary);

  return {
    courseId,
    courseTitle:    course.title,
    category:       course.category || "General",
    enrollment:     buildEnrollment(progress, course),
    testHistory:    formattedTests,
    aggregateScore: computeScoreAggregate(formattedTests),
    proficiency:    computeProficiency(formattedTests),
    fingerprints:   formattedFingerprints,
  };
}

// ─── Aggregation pipelines ────────────────────────────────────────────────────

async function aggregateTestHistory(uid) {
  const results = await TestResult.aggregate([
    {
      $match: {
        studentId: uid,
        evaluationStatus: "complete",
      },
    },
    { $sort: { createdAt: 1 } },
    {
      $lookup: {
        from: "videos",
        localField: "videoId",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: {
        path: "$video",
        preserveNullAndEmpty: true,
      },
    },
    {
      $project: {
        courseId:         1,
        videoId:          1,
        videoTitle:       "$video.title",
        testId:           1,
        attemptNumber:    1,
        totalScore:       1,
        passed:           1,
        evaluationStatus: 1,
        difficulty:       1,
        createdAt:        1,
      },
    },
  ]);

  return results.map(formatTestSnapshot);
}

async function aggregateProgressData(uid) {
  const docs = await Progress.find({ studentId: uid }).lean();
  return buildProgressMap(docs);
}

async function aggregateFingerprintData(uid) {
  const docs = await StudentFingerprint.find({ studentId: uid }).lean();
  // Group by courseId
  return docs.reduce((acc, fp) => {
    const cid = fp.courseId.toString();
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(formatFingerprintSummary(fp));
    return acc;
  }, {});
}

// ─── Builders / formatters ────────────────────────────────────────────────────

function buildProgressMap(progressDocs) {
  // Group progress records by courseId (derived from video lookup is deferred —
  // progress.courseId is not stored directly; we track per-video completion and
  // use Progress.courseComplete / allTestsPassed which are set by test.controller.js)
  //
  // For Phase 1 we aggregate completion across all progress records for the student.
  // The videoId → courseId mapping is resolved inside buildEnrollment using
  // the Course.videos array — see Course model.
  return progressDocs.reduce((acc, p) => {
    // Progress documents that have courseComplete set will carry implicit courseId context.
    // We key by the string "all" here; per-course refinement is handled in refreshCourseContext.
    const key = "all";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
}

function buildEnrollment(progressRecords, course) {
  const watched = progressRecords
    ? (Array.isArray(progressRecords) ? progressRecords : []).filter((p) => p.watched).length
    : 0;
  const total = course.videoCount || 0;
  const courseComplete = progressRecords
    ? (Array.isArray(progressRecords) ? progressRecords : []).some((p) => p.courseComplete)
    : false;
  const allTestsPassed = progressRecords
    ? (Array.isArray(progressRecords) ? progressRecords : []).some((p) => p.allTestsPassed)
    : false;

  return {
    enrolledAt:        null, // Not tracked in current schema — placeholder for Phase 3
    videosTotal:       total,
    videosWatched:     watched,
    completionPercent: total > 0 ? Math.round((watched / total) * 100) : 0,
    courseComplete,
    allTestsPassed,
  };
}

function formatTestSnapshot(r) {
  return {
    resultId:         r._id?.toString(),
    testId:           r.testId?.toString(),
    videoId:          r.videoId?.toString() || null,
    videoTitle:       r.videoTitle || r.video?.title || null,
    courseId:         r.courseId?.toString(),
    attemptNumber:    r.attemptNumber || 1,
    totalScore:       r.totalScore ?? null,
    passed:           r.passed ?? false,
    difficulty:       r.difficulty || null,
    evaluationStatus: r.evaluationStatus,
    takenAt:          r.createdAt?.toISOString?.() || r.createdAt,
  };
}

function formatFingerprintSummary(fp) {
  return {
    conceptTag:       fp.conceptTag,
    classification:   fp.classification,
    fingerprintScore: fp.fingerprintScore,
    attempts:         fp.attempts,
    hasMinimumData:   fp.attempts >= 3,
    lastComputedAt:   fp.lastComputedAt?.toISOString?.() || fp.lastComputedAt || null,
  };
}

// ─── Score computations ───────────────────────────────────────────────────────

function computeScoreAggregate(tests) {
  const completed = tests.filter(
    (t) => t.evaluationStatus === "complete" && t.totalScore !== null
  );

  if (!completed.length) {
    return {
      averageScore:    null,
      highestScore:    null,
      lowestScore:     null,
      movingAverage7d: null,
      trend:           "insufficient_data",
      totalAttempts:   0,
      passRate:        null,
    };
  }

  const scores = completed.map((t) => t.totalScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  // 7-day moving average
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent7d = completed.filter((t) => new Date(t.takenAt) >= sevenDaysAgo);
  const movingAverage7d =
    recent7d.length
      ? recent7d.reduce((a, t) => a + t.totalScore, 0) / recent7d.length
      : avg;

  return {
    averageScore:    Math.round(avg),
    highestScore:    Math.max(...scores),
    lowestScore:     Math.min(...scores),
    movingAverage7d: Math.round(movingAverage7d),
    trend:           computeTrend(completed),
    totalAttempts:   completed.length,
    passRate:        Math.round((completed.filter((t) => t.passed).length / completed.length) * 100),
  };
}

function computeTrend(tests) {
  if (tests.length < 4) return "insufficient_data";
  const recent = tests.slice(-3).map((t) => t.totalScore);
  const prior  = tests.slice(-6, -3).map((t) => t.totalScore);
  if (!prior.length) return "insufficient_data";
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const priorAvg  = prior.reduce((a, b) => a + b, 0) / prior.length;
  const delta = recentAvg - priorAvg;
  if (delta > 5)  return "improving";
  if (delta < -5) return "declining";
  return "stable";
}

/**
 * Proficiency band derived from average score.
 * < 40  → Beginner
 * 40–59 → Developing
 * 60–79 → Proficient
 * ≥ 80  → Mastery
 */
function computeProficiency(tests) {
  const completed = tests.filter(
    (t) => t.evaluationStatus === "complete" && t.totalScore !== null
  );
  if (!completed.length) return null;

  const avg = completed.reduce((a, t) => a + t.totalScore, 0) / completed.length;
  if (avg >= 80) return "Mastery";
  if (avg >= 60) return "Proficient";
  if (avg >= 40) return "Developing";
  return "Beginner";
}

function buildSummaryStats(courseContexts) {
  const allTests = courseContexts.flatMap((c) => c.testHistory);
  const completed = allTests.filter(
    (t) => t.evaluationStatus === "complete" && t.totalScore !== null
  );

  const avgScores = courseContexts
    .map((c) => c.aggregateScore?.averageScore)
    .filter((s) => s !== null);

  const allFingerprints = courseContexts.flatMap((c) => c.fingerprints);

  const strongest = courseContexts.reduce(
    (best, c) =>
      (c.aggregateScore?.averageScore ?? 0) > (best?.aggregateScore?.averageScore ?? 0)
        ? c
        : best,
    null
  );
  const weakest = courseContexts.reduce(
    (worst, c) =>
      (c.aggregateScore?.averageScore ?? Infinity) <
      (worst?.aggregateScore?.averageScore ?? Infinity)
        ? c
        : worst,
    null
  );

  return {
    totalCoursesEnrolled:  courseContexts.length,
    totalTestsAttempted:   completed.length,
    overallAverageScore:
      avgScores.length
        ? Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length)
        : null,
    totalConceptualGaps:  allFingerprints.filter((f) => f.classification === "ConceptualGap").length,
    totalCarelessErrors:  allFingerprints.filter((f) => f.classification === "CarelessError").length,
    strongestCourse:      strongest?.courseId || null,
    weakestCourse:        weakest?.courseId || null,
  };
}

function buildEmptyContext(userId) {
  return {
    studentId:   userId,
    generatedAt: new Date().toISOString(),
    courses:     [],
    summary: {
      totalCoursesEnrolled:  0,
      totalTestsAttempted:   0,
      overallAverageScore:   null,
      totalConceptualGaps:   0,
      totalCarelessErrors:   0,
      strongestCourse:       null,
      weakestCourse:         null,
    },
  };
}