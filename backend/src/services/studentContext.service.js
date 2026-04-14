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
import Video from "../models/video.model.js";

const ObjectId = mongoose.Types.ObjectId;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Builds and returns a full StudentContext for the given userId.
 * @param {string} userId - The User._id (string form)
 * @returns {Promise<StudentContext>}
 */
export async function buildStudentContext(userId) {
  process.stdout.write("[SCS] SYNC CHECK\n");
  console.log("[SCS] buildStudentContext ENTERED with:", userId, typeof userId);

  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    const uid = new ObjectId(userId);

    // Run all three aggregations concurrently
    const [testHistory, progressMap, fingerprintMap] = await Promise.all([
      aggregateTestHistory(uid),
      aggregateProgressData(uid),
      aggregateFingerprintData(uid),
    ]);

    console.log("[SCS] testHistory courseIds:", testHistory.map(r => r.courseId?.toString()));

    // Cast to ObjectId explicitly — Progress.studentId stores an ObjectId
    const watchedProgress = await Progress.find(
      { studentId: new ObjectId(userId), watched: true },
      { videoId: 1 }
    ).lean();


    console.log("[SCS] watchedProgress count:", watchedProgress.length);
    console.log("[SCS] watchedProgress sample:", JSON.stringify(watchedProgress[0]));

    const watchedVideoIds = watchedProgress.map(p => p.videoId);

    const watchedVideos = await Video.find(
      { _id: { $in: watchedVideoIds } },
      { courseId: 1 }
    ).lean();

    console.log("[SCS] watchedVideos count:", watchedVideos.length);
    console.log("[SCS] watchedVideos sample:", JSON.stringify(watchedVideos[0]));

    // Video.courseId is stored as a plain String — toString() both sides
    const progressCourseIds = watchedVideos
      .map(v => v.courseId?.toString())
      .filter(Boolean);

    // Merge with testHistory courseIds — deduplicate
    const allCourseIds = [
      ...new Set([
        ...testHistory.map((r) => r.courseId?.toString()),
        ...progressCourseIds,
      ])
    ].filter(Boolean);

    console.log("[SCS] allCourseIds:", allCourseIds);

    if (!allCourseIds.length) {
      return buildEmptyContext(userId);
    }

    const courses = await Course.find({
      _id: { 
        $in: allCourseIds
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new ObjectId(id)) 
      },
    })
      .select("_id title category videoCount")
      .lean();

    console.log("[SCS] courses found:", courses.map(c => ({ id: c._id.toString(), title: c.title })));

    const courseContexts = await Promise.all(courses.map(async (course) => {
      const cid = course._id.toString();
      const tests = testHistory.filter((t) => t.courseId?.toString() === cid);
      
      // Video.courseId is a plain String — compare against cid (already a string)
      const courseVideos = await Video.find({ courseId: cid }, { _id: 1 }).lean();
      const courseVideoIds = courseVideos.map(v => v._id.toString());

      console.log(`[SCS] course "${course.title}" — courseVideoIds count: ${courseVideoIds.length}`);

      const progress = progressMap["all"] || [];
      const fingerprints = fingerprintMap[cid] || [];

      const watchedCount = progress.filter(
        p => p.watched === true && courseVideoIds.includes(p.videoId?.toString())
      ).length;
      console.log(`[SCS] course "${course.title}" — watchedCount: ${watchedCount}, progress pool size: ${progress.length}`);

      return {
        courseId:       cid,
        courseTitle:    course.title,
        category:       course.category || "General",
        enrollment:     buildEnrollment(progress, course, courseVideoIds),
        testHistory:    tests,
        aggregateScore: computeScoreAggregate(tests),
        proficiency:    computeProficiency(tests),
        fingerprints,
      };
    }));


    return {
      studentId:   userId,
      generatedAt: new Date().toISOString(),
      courses:     courseContexts,
      summary:     buildSummaryStats(courseContexts),
    };
  } catch (err) {
    console.error("[SCS INTERNAL ERROR]:", err);
    throw err;
  }
}

/**
 * Lightweight refresh for a single course slice — called after a new TestResult
 * is committed (triggered by Socket.IO context:updated event on the client).
 * @param {string} userId
 * @param {string} courseId
 * @returns {Promise<CourseContext>}
 */
export async function refreshCourseContext(userId, courseId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) throw new Error(`Invalid userId: ${userId}`);
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) throw new Error(`Invalid courseId: ${courseId}`);
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
  const progress = progressMap["all"] || [];
  
  const courseVideos = await Video.find({ courseId: cid.toString() }, { _id: 1 }).lean();
  const courseVideoIds = courseVideos.map(v => v._id.toString());

  const formattedTests = tests.map(formatTestSnapshot);
  const formattedFingerprints = fingerprints.map(formatFingerprintSummary);

  return {
    courseId,
    courseTitle:    course.title,
    category:       course.category || "General",
    enrollment:     buildEnrollment(progress, course, courseVideoIds),
    testHistory:    formattedTests,
    aggregateScore: computeScoreAggregate(formattedTests),
    proficiency:    computeProficiency(formattedTests),
    fingerprints:   formattedFingerprints,
  };
}

// ─── Aggregation pipelines ────────────────────────────────────────────────────

async function aggregateTestHistory(uid) {
  try {
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
          preserveNullAndEmptyArrays: true,
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
  } catch (error) {
    console.error("aggregateTestHistory threw an error:", error);
    throw error;
  }
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

function buildEnrollment(rawProgress, course, courseVideoIds) {
  const progressRecords = rawProgress || [];

  const watched = progressRecords.filter(
    (p) => p.watched === true && courseVideoIds.includes(p.videoId?.toString())
  ).length;

  const courseComplete = progressRecords.some(
    (p) => p.courseComplete && courseVideoIds.includes(p.videoId?.toString())
  );

  const allTestsPassed = progressRecords.some(
    (p) => p.allTestsPassed && courseVideoIds.includes(p.videoId?.toString())
  );

  const total = course.videoCount || 0;

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