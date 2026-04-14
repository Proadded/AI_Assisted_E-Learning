import CapstoneSession from "../models/capstoneSession.model.js";
import StudentFingerprint from "../models/fingerprint.model.js";
import Progress from "../models/progress.model.js";
import Test from "../models/quiz.model.js";
import Course from "../models/course.model.js";
import { generateCapstoneMCQ } from "../lib/aiEvaluator.js";

const CAPSTONE_TOTAL_QUESTIONS = 20;
const MIN_QUESTIONS_REQUIRED = 10;
const BUCKET_DISTRIBUTION = {
  ConceptualGap: 0.5,
  Uncertain: 0.3,
  CarelessError: 0.2,
};

const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const sanitizeSessionForClient = (sessionDoc) => {
  const data = sessionDoc.toObject ? sessionDoc.toObject() : sessionDoc;
  return {
    ...data,
    questions: (data.questions || []).map(({ correctIndex, ...rest }) => rest),
  };
};

const buildGroupedByConcept = (questions = []) => {
  return questions.reduce((acc, q) => {
    const key = q.conceptTag || "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});
};

const computeUnlockState = (progressDocs = []) => {
  if (!progressDocs.length) {
    return false;
  }

  // v1 rule: any attempted test below threshold keeps capstone locked.
  const hasFailingTakenTest = progressDocs.some(
    (p) => p.testTaken === true && typeof p.testScore === "number" && p.testScore < 70
  );
  if (hasFailingTakenTest) return false;

  // If explicit allTestsPassed is tracked, respect it.
  const hasAnyUnpassedFlag = progressDocs.some((p) => p.allTestsPassed === false);
  if (hasAnyUnpassedFlag) return false;

  return true;
};

const normaliseSeededQuestion = (question, questionId) => {
  const stem = typeof question?.question === "string" ? question.question.trim() : "";
  const options = Array.isArray(question?.options) ? question.options : [];
  const correctAnswer = question?.correctAnswer;
  const correctIndex = options.findIndex((opt) => opt === correctAnswer);
  const conceptTag = question?.conceptTag;

  if (!stem || options.length !== 4 || correctIndex < 0 || typeof conceptTag !== "string") {
    return null;
  }

  return {
    questionId: questionId || null,
    stem,
    options: [...options],
    correctIndex,
    conceptTag,
    questionSource: "seeded",
  };
};

const buildBucketTargets = () => {
  return {
    ConceptualGap: Math.round(CAPSTONE_TOTAL_QUESTIONS * BUCKET_DISTRIBUTION.ConceptualGap),
    Uncertain: Math.round(CAPSTONE_TOTAL_QUESTIONS * BUCKET_DISTRIBUTION.Uncertain),
    CarelessError: CAPSTONE_TOTAL_QUESTIONS
      - Math.round(CAPSTONE_TOTAL_QUESTIONS * BUCKET_DISTRIBUTION.ConceptualGap)
      - Math.round(CAPSTONE_TOTAL_QUESTIONS * BUCKET_DISTRIBUTION.Uncertain),
  };
};

export const getCapstoneStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?._id;

    const [latestSession, progressDocs] = await Promise.all([
      CapstoneSession.findOne({ studentId, courseId }).sort({ generatedAt: -1 }).lean(),
      Progress.find({ studentId, courseId }).select("testTaken testScore allTestsPassed").lean(),
    ]);

    const unlocked = computeUnlockState(progressDocs);

    return res.status(200).json({
      unlocked,
      passed: latestSession?.passed ?? false,
      lastScore: typeof latestSession?.score === "number" ? latestSession.score : null,
      cooldownUntil: latestSession?.cooldownUntil ?? null,
      attemptNumber: latestSession?.attemptNumber ?? 0,
    });
  } catch (error) {
    console.log("Error in getCapstoneStatus:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const generateCapstone = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?._id;

    const [course, progressDocs] = await Promise.all([
      Course.findById(courseId).select("title difficulty").lean(),
      Progress.find({ studentId, courseId }).select("testTaken testScore allTestsPassed").lean(),
    ]);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const unlocked = computeUnlockState(progressDocs);
    if (!unlocked) {
      return res.status(403).json({ message: "Capstone is locked until all course tests are passed." });
    }

    const activeCooldownSession = await CapstoneSession.findOne({
      studentId,
      courseId,
      status: "failed",
      cooldownUntil: { $gt: new Date() },
    })
      .sort({ generatedAt: -1 })
      .lean();

    if (activeCooldownSession) {
      return res.status(403).json({
        message: "Capstone cooldown is still active.",
        cooldownUntil: activeCooldownSession.cooldownUntil,
      });
    }

    const fingerprints = await StudentFingerprint.find({ studentId, courseId })
      .select("conceptTag classification fingerprintScore")
      .lean();

    const conceptTagsByBucket = {
      ConceptualGap: [],
      Uncertain: [],
      CarelessError: [],
    };

    for (const fp of fingerprints) {
      if (!conceptTagsByBucket[fp.classification]) continue;
      if (typeof fp.conceptTag !== "string" || !fp.conceptTag.trim()) continue;
      if (!conceptTagsByBucket[fp.classification].includes(fp.conceptTag)) {
        conceptTagsByBucket[fp.classification].push(fp.conceptTag);
      }
    }

    const allTaggedTests = await Test.find({ courseId, "questions.type": "mcq" })
      .select("questions")
      .lean();

    const allRequestedTags = new Set([
      ...conceptTagsByBucket.ConceptualGap,
      ...conceptTagsByBucket.Uncertain,
      ...conceptTagsByBucket.CarelessError,
    ]);

    const seedPoolByTag = {};
    for (const test of allTaggedTests) {
      for (let i = 0; i < (test.questions || []).length; i += 1) {
        const q = test.questions[i];
        if (q?.type !== "mcq") continue;
        if (!allRequestedTags.has(q?.conceptTag)) continue;
        const normalised = normaliseSeededQuestion(q, q?._id || null);
        if (!normalised) continue;
        if (!seedPoolByTag[normalised.conceptTag]) seedPoolByTag[normalised.conceptTag] = [];
        seedPoolByTag[normalised.conceptTag].push(normalised);
      }
    }

    Object.keys(seedPoolByTag).forEach((tag) => shuffleArray(seedPoolByTag[tag]));

    const usedSignatures = new Set();
    const selectedQuestions = [];
    const deficitsByTag = {};
    const bucketTargets = buildBucketTargets();

    const takeFromTag = (tag) => {
      const pool = seedPoolByTag[tag] || [];
      while (pool.length > 0) {
        const candidate = pool.pop();
        const signature = `${tag}::${candidate.stem}`;
        if (usedSignatures.has(signature)) continue;
        usedSignatures.add(signature);
        selectedQuestions.push(candidate);
        return true;
      }
      return false;
    };

    for (const bucket of Object.keys(bucketTargets)) {
      const tags = conceptTagsByBucket[bucket];
      const targetCount = bucketTargets[bucket];
      let pickedForBucket = 0;
      let madeProgress = true;
      let cursor = 0;

      if (!tags.length) {
        continue;
      }

      while (
        selectedQuestions.length < CAPSTONE_TOTAL_QUESTIONS &&
        pickedForBucket < targetCount &&
        madeProgress
      ) {
        madeProgress = false;
        for (let i = 0; i < tags.length; i += 1) {
          const tag = tags[(cursor + i) % tags.length];
          if (pickedForBucket >= targetCount || selectedQuestions.length >= CAPSTONE_TOTAL_QUESTIONS) break;
          if (takeFromTag(tag)) {
            pickedForBucket += 1;
            madeProgress = true;
          }
        }
        cursor += 1;
      }

      const shortfall = targetCount - pickedForBucket;
      for (let i = 0; i < shortfall; i += 1) {
        const tag = tags[i % tags.length];
        deficitsByTag[tag] = (deficitsByTag[tag] || 0) + 1;
      }
    }

    // Backfill from any remaining seeded pool before AI generation.
    const allTags = [...allRequestedTags];
    let keepBackfilling = true;
    while (selectedQuestions.length < CAPSTONE_TOTAL_QUESTIONS && keepBackfilling && allTags.length) {
      keepBackfilling = false;
      for (const tag of allTags) {
        if (selectedQuestions.length >= CAPSTONE_TOTAL_QUESTIONS) break;
        if (takeFromTag(tag)) keepBackfilling = true;
      }
    }

    // Request AI questions only where seeded supply is short.
    const difficulty = course?.difficulty || "intermediate";
    for (const [tag, missingCount] of Object.entries(deficitsByTag)) {
      if (selectedQuestions.length >= CAPSTONE_TOTAL_QUESTIONS) break;
      if (!missingCount || missingCount <= 0) continue;

      const aiCandidates = await generateCapstoneMCQ({
        conceptTag: tag,
        courseTitle: course.title,
        count: Math.min(missingCount, CAPSTONE_TOTAL_QUESTIONS - selectedQuestions.length),
        difficulty,
        existingQuestions: selectedQuestions,
      });

      for (const q of aiCandidates || []) {
        if (selectedQuestions.length >= CAPSTONE_TOTAL_QUESTIONS) break;
        const signature = `${q.conceptTag}::${q.stem}`;
        if (usedSignatures.has(signature)) continue;
        usedSignatures.add(signature);
        selectedQuestions.push({
          questionId: null,
          stem: q.stem,
          options: [...q.options],
          correctIndex: q.correctIndex,
          conceptTag: q.conceptTag,
          questionSource: "ai_generated",
        });
      }
    }

    if (selectedQuestions.length < MIN_QUESTIONS_REQUIRED) {
      return res.status(400).json({ message: "Not enough questions in this course bank." });
    }

    const finalQuestions = shuffleArray([...selectedQuestions]).slice(0, CAPSTONE_TOTAL_QUESTIONS).map((q) => {
      const optionIndexes = [0, 1, 2, 3];
      shuffleArray(optionIndexes);
      const remappedOptions = optionIndexes.map((idx) => q.options[idx]);
      const newCorrectIndex = optionIndexes.findIndex((idx) => idx === q.correctIndex);
      return {
        ...q,
        options: remappedOptions,
        correctIndex: newCorrectIndex,
      };
    });

    const previousAttempts = await CapstoneSession.countDocuments({ studentId, courseId });
    const attemptNumber = previousAttempts + 1;

    const fingerprintSnapshot = fingerprints.map((fp) => ({
      conceptTag: fp.conceptTag,
      classification: fp.classification,
      fingerprintScore: fp.fingerprintScore ?? null,
    }));

    const session = await CapstoneSession.create({
      studentId,
      courseId,
      status: "pending",
      questions: finalQuestions,
      fingerprintSnapshot,
      attemptNumber,
      passed: null,
      score: null,
      submittedAt: null,
      cooldownUntil: null,
    });

    return res.status(201).json({
      session: sanitizeSessionForClient(session),
    });
  } catch (error) {
    console.log("Error in generateCapstone:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const submitCapstone = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body || {};
    const studentId = req.user?._id;

    const session = await CapstoneSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Capstone session not found." });
    }

    if (session.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (session.status !== "pending") {
      return res.status(400).json({ message: "This capstone session has already been submitted." });
    }

    const safeAnswers = Array.isArray(answers) ? answers : [];
    let correctCount = 0;

    for (const answer of safeAnswers) {
      const questionIndex = answer?.questionIndex;
      const selectedIndex = answer?.selectedIndex;
      if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= session.questions.length) continue;
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) continue;

      const q = session.questions[questionIndex];
      const isCorrect = selectedIndex === q.correctIndex;
      q.studentAnswer = selectedIndex;
      q.isCorrect = isCorrect;
      if (isCorrect) correctCount += 1;
    }

    const totalQuestions = session.questions.length || 1;
    const score = Number(((correctCount / totalQuestions) * 100).toFixed(1));
    const passed = score >= (session.passingThreshold ?? 70);

    session.score = score;
    session.passed = passed;
    session.status = passed ? "passed" : "failed";
    session.submittedAt = new Date();
    if (!passed) {
      session.cooldownUntil = new Date(Date.now() + (session.cooldownDurationMs || 0));
    }

    await session.save();

    if (passed) {
      await Progress.updateMany(
        { studentId, courseId: session.courseId },
        {
          $set: {
            capstonePassed: true,
            capstoneSessionId: session._id,
            jscapstoneSessionId: session._id,
          },
        }
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("capstone:result", {
        sessionId: session._id,
        passed: session.passed,
        score: session.score,
        courseId: session.courseId,
      });
    }

    return res.status(200).json({
      passed: session.passed,
      score: session.score,
      sessionId: session._id,
    });
  } catch (error) {
    console.log("Error in submitCapstone:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCapstoneResult = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const studentId = req.user?._id;

    const session = await CapstoneSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Capstone session not found." });
    }

    if (session.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    const sanitized = sanitizeSessionForClient(session);
    const groupedByConceptTag = buildGroupedByConcept(sanitized.questions);

    return res.status(200).json({
      session: sanitized,
      groupedByConceptTag,
    });
  } catch (error) {
    console.log("Error in getCapstoneResult:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
