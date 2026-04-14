import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const answerSchema = new mongoose.Schema({
    questionId: { type: ObjectId },
    questionType: { type: String },
    studentAnswer: { type: String },
    isCorrect: { type: Boolean },
    aiScore: { type: Number },
    aiConfidence: { type: Number },
    aiFeedback: { type: String },
    responseTimeMs: { type: Number, default: null },
}, { _id: false });

const testResultSchema = new mongoose.Schema({
    testId: { type: ObjectId, ref: "Test", required: true },
    studentId: { type: ObjectId, ref: "User", required: true },
    courseId: { type: ObjectId, ref: "Course" },
    videoId: { type: ObjectId, ref: "Video" },

    answers: [answerSchema],

    totalScore: Number,           // weighted aggregate
    passed: Boolean,
    attemptNumber: { type: Number, default: 1 },
    evaluationStatus: {
        type: String,
        enum: ["pending", "processing", "complete", "failed"],
        default: "pending"
    },
    // createdAt removed — timestamps: true handles both createdAt and updatedAt automatically
}, { timestamps: true });

testResultSchema.index(
    { studentId: 1, courseId: 1, evaluationStatus: 1 },
    { background: true }
);

testResultSchema.index(
    { studentId: 1, courseId: 1, createdAt: -1 },
    { background: true }
);

const TestResult = mongoose.model("TestResult", testResultSchema);
export default TestResult;