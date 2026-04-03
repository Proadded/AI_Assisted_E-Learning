import Test from "../models/quiz.model.js";
import Progress from "../models/progress.model.js";
import TestResult from "../models/testResult.model.js";
import { evaluateSubjectiveAnswer, calculateWeightedScore } from "../lib/aiEvaluator.js";

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

        if (hasSubjective) {
            // Fire-and-forget — AI evaluation runs in the background
            evaluateSubjectiveAnswersAsync(result, test);
        } else {
            await finalizeResult(result, test);
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

async function evaluateSubjectiveAnswersAsync(result, test) {
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
        await finalizeResult(result, test);
    } catch (error) {
        console.log("Error in evaluateSubjectiveAnswersAsync:", error.message);
        result.evaluationStatus = "failed";
        await result.save();
    }
}

async function finalizeResult(result, test) {
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

    if (result.courseId) {
        await checkCourseCompletion(result.studentId, result.courseId);
    }
}

async function checkCourseCompletion(studentId, courseId) {
    const allTests = await Test.find({ courseId });
    const allResults = await TestResult.find({ studentId, courseId });

    const everyTestPassed = allTests.every((test) =>
        allResults.some(
            (r) => r.testId.toString() === test._id.toString() && r.passed === true
        )
    );

    if (everyTestPassed) {
        await Progress.updateMany(
            { studentId, courseId },
            { allTestsPassed: true, courseComplete: true }
        );
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