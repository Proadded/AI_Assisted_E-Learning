import Test from "../models/quiz.model.js";
import Progress from "../models/progress.model.js";
import TestResult from "../models/testResult.model.js";
import StudentFingerprint from "../models/fingerprint.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import { evaluateSubjectiveAnswer, calculateWeightedScore, generateAiAnalysis } from "../lib/aiEvaluator.js";
import { updateFingerprintsFromResult } from "../services/fingerprintEngine.service.js";

export const getTest = async (req, res) => {
    try {
        const test = await Test.findOne({ videoId: req.params.videoId });

        if (!test) {
            return res.status(404).json({ message: "No test found" });
        }

        // Don't send correct answers
        const testData = {
            ...test.toObject(),
            questions: test.questions.map(q => ({
                _id: q._id,
                question: q.question,
                type: q.type,
                options: q.options,
            }))
        };

        res.json({ test: testData });
    } catch (error) {
        console.log("Error in getTest controller:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};


export const submitTest = async (req, res) => {
    console.log("submitTest body:", JSON.stringify(req.body, null, 2));
    try {
        const test = await Test.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        const processedAnswers = [];
        let hasSubjective = false;

        for (const ans of req.body.answers) {
            const question = test.questions.id(ans.questionId);
            if (!question) continue;

            const entry = {
                questionId: question._id,
                questionType: question.type,
                studentAnswer: ans.answer,
            };

            if (question.type === "mcq") {
                entry.isCorrect = ans.answer === question.correctAnswer;
                entry.aiScore = entry.isCorrect ? question.maxScore : 0;
            } else {
                // short_answer or essay — leave for AI evaluation
                entry.aiScore = null;
                hasSubjective = true;
            }

            processedAnswers.push(entry);
        }

        const evaluationStatus = hasSubjective ? "processing" : "complete";

        const result = await TestResult.create({
            studentId: req.user._id,
            testId: test._id,
            courseId: test.courseId,
            videoId: test.videoId,
            answers: processedAnswers,
            evaluationStatus,
        });

        const io = req.app.get("io");

        if (hasSubjective) {
            // Fire-and-forget — AI evaluation runs in the background
            evaluateSubjectiveAnswersAsync(result, test, io);
        } else {
            await finalizeResult(result, test, io);
        }

        const message = hasSubjective
            ? "AI is evaluating your written answers."
            : "Test graded!";

        res.status(200).json({
            resultId: result._id,
            evaluationStatus: result.evaluationStatus,
            message,
        });
    } catch (error) {
        console.log("Error in submitTest controller:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};


// ─── Internal helpers (not exported) ────────────────────────────────────────

async function evaluateSubjectiveAnswersAsync(result, test, io) {
    try {
        for (const answer of result.answers) {
            if (answer.aiScore !== null) continue;

            const question = test.questions.id(answer.questionId);
            if (!question) continue;

            const evaluation = await evaluateSubjectiveAnswer({
                question: question.question,
                rubric: question.rubric,
                studentAnswer: answer.studentAnswer,
                maxScore: question.maxScore,
                difficulty: test.difficulty,
            });

            answer.aiScore = evaluation.score;
            answer.aiConfidence = evaluation.confidence;
            answer.aiFeedback = evaluation.feedback;
        }

        await result.save();
        await finalizeResult(result, test, io);
    } catch (error) {
        console.log("Error in evaluateSubjectiveAnswersAsync:", error.message);
        result.evaluationStatus = "failed";
        await result.save();
    }
}

async function finalizeResult(result, test, io) {
    const totalScore = calculateWeightedScore(result.answers, test.questions);

    result.totalScore = totalScore;
    result.passed = totalScore >= test.passingScore;
    result.evaluationStatus = "complete";
    await result.save();

    await Progress.findOneAndUpdate(
        { studentId: result.studentId, videoId: result.videoId },
        {
            testTaken: true,
            testScore: totalScore,
            testResultId: result._id,
        },
        { upsert: true }
    );

    // Populate all four aiAnalysis fields via Gemini — non-blocking, never affects HTTP response
    (async () => {
        try {
            // Fetch current fingerprint classifications for this student + course
            const fingerprints = await StudentFingerprint.find({
                studentId: result.studentId,
                courseId: result.courseId,
            }).select("conceptTag classification").lean();

            const conceptualGaps = fingerprints.filter(f => f.classification === "ConceptualGap").map(f => f.conceptTag);
            const uncertainConcepts = fingerprints.filter(f => f.classification === "Uncertain").map(f => f.conceptTag);

            // Fetch recent test history for context
            const recentResults = await TestResult.find({
                studentId: result.studentId,
                courseId: result.courseId,
                evaluationStatus: "complete",
            }).select("totalScore createdAt").sort({ createdAt: -1 }).limit(10).lean();

            // Fetch course title and student name for the prompt
            const [course, student] = await Promise.all([
                Course.findById(result.courseId).select("title").lean(),
                User.findById(result.studentId).select("fullName").lean(),
            ]);

            const aiAnalysis = await generateAiAnalysis({
                studentName: student?.fullName || "Student",
                courseTitle: course?.title || "this course",
                conceptualGaps,
                uncertainConcepts,
                testHistory: recentResults.reverse(), // chronological order
            });

            if (aiAnalysis) {
                await Progress.findOneAndUpdate(
                    { studentId: result.studentId, videoId: result.videoId },
                    {
                        $set: {
                            "aiAnalysis.weakAreas": aiAnalysis.weakAreas,
                            "aiAnalysis.strengths": aiAnalysis.strengths,
                            "aiAnalysis.personalizedFeedback": aiAnalysis.personalizedFeedback,
                            "aiAnalysis.recommendations": aiAnalysis.recommendations,
                        }
                    }
                );
                console.log(`aiAnalysis updated for student ${result.studentId}, course ${result.courseId}`);
            }
        } catch (err) {
            console.log("aiAnalysis population failed (non-critical):", err.message);
        }
    })();

    if (result.courseId) {
        await checkCourseCompletion(result.studentId, result.courseId, io);
    }

    // Fire-and-forget fingerprint update — must never break the submission response
    updateFingerprintsFromResult(result).catch(err =>
        console.log("Fingerprint update failed (non-critical):", err.message)
    );

    // Notify dashboard to refresh in real-time
    try {
        if (io) {
            io.emit("context:updated", {
                studentId: result.studentId.toString(),
                courseId: result.courseId.toString(),
            });
        }
    } catch (e) {
        console.log("Socket emit failed (non-critical):", e.message);
    }
}

async function checkCourseCompletion(studentId, courseId, io) {
    console.log("[CCC] fired", studentId, courseId);

    // fetch all course videos
    const courseVideos = await Video.find({ courseId }).select("_id").lean();
    const courseVideoIds = courseVideos.map(v => v._id.toString());

    // fetch watched progress
    const watchedDocs = await Progress.find({
        studentId,
        videoId: { $in: courseVideos.map(v => v._id) },
        watched: true
    });

    const allVideosWatched = watchedDocs.length >= courseVideoIds.length;

    const allTests = await Test.find({ courseId }).select("videoId").lean();
    const videoIds = allTests.map(t => t.videoId).filter(Boolean);

    const progressDocs = await Progress.find({ studentId, videoId: { $in: videoIds } }).lean();

    console.log("[CCC] videoIds:", videoIds.length, videoIds);
    console.log("[CCC] progressDocs:", progressDocs.length);
    console.log("[CCC] passed count:", progressDocs.filter(p => p.testScore >= 70).length);

    const allTestsPassed = progressDocs.filter(p => p.testScore >= 70).length >= videoIds.length;

    console.log("[CCC] flags", { allTestsPassed, allVideosWatched });

    if (allTestsPassed && allVideosWatched) {
        // Read pre-update state to detect the first-time unlock transition
        const existingProgress = await Progress.findOne({ studentId, videoId: { $in: videoIds } })
            .select("allTestsPassed")
            .lean();
        const wasAlreadyUnlocked = existingProgress?.allTestsPassed === true;

        await Progress.updateMany(
            { studentId, videoId: { $in: videoIds } },
            { $set: { allTestsPassed: true, courseComplete: true } }
        );

        // Only emit on the first transition (false → true), not on every passing submission
        if (!wasAlreadyUnlocked && io) {
            io.emit("capstone:unlocked", {
                courseId: courseId.toString(),
                studentId: studentId.toString(),
            });
        }
    }
}


export const getResult = async (req, res) => {
    try {
        const result = await TestResult.findById(req.params.resultId);

        if (!result) {
            return res.status(404).json({ message: "Result not found" });
        }

        const resultObj = result.toObject();

        // Strip AI feedback while evaluation is still in progress
        if (resultObj.evaluationStatus === "processing") {
            resultObj.answers = resultObj.answers.map(({ aiFeedback, ...rest }) => rest);
        }

        res.status(200).json({ result: resultObj });
    } catch (error) {
        console.log("Error in getResult controller:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};