import Test from "../models/quiz.model.js";
import Progress from "../models/progress.model.js";

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
        res.status(500).json({ message: "Server error" });
    }
};


export const submitTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { answers } = req.body; // [{ questionId, answer }]
        const studentId = req.user._id;

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: "Answers are required" });
        }

        // Grade test
        let correct = 0;
        answers.forEach(ans => {
            const question = test.questions.id(ans.questionId);
            if (question && question.correctAnswer === ans.answer) {
                correct++;
            }
        });

        const score = (correct / test.questions.length) * 100;
        const passed = score >= test.passingScore;

        // Update progress
        await Progress.findOneAndUpdate(
            { studentId, videoId: test.videoId },
            {
                testTaken: true,
                testScore: score,
            },
            { upsert: true }
        );

        res.json({
            score,
            passed,
            message: passed ? "Test passed!" : "Try again"
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};