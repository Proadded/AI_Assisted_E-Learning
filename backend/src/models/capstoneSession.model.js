import mongoose from "mongoose";

export const CapstoneQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      default: null,
    },
    stem: String,
    options: [String],
    correctIndex: Number,
    conceptTag: String,
    questionSource: {
      type: String,
      enum: ["seeded", "ai_generated"],
    },
    studentAnswer: {
      type: Number,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
  },
  { _id: false }
);

const capstoneSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "passed", "failed"],
      default: "pending",
    },
    questions: [CapstoneQuestionSchema],
    fingerprintSnapshot: {
      type: Object,
      default: {},
    },
    score: {
      type: Number,
      default: null,
    },
    passed: {
      type: Boolean,
      default: null,
    },
    passingThreshold: {
      type: Number,
      default: 70,
    },
    cooldownUntil: {
      type: Date,
      default: null,
    },
    cooldownDurationMs: {
      type: Number,
      default: 86400000,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

capstoneSessionSchema.index({ studentId: 1, courseId: 1 });

const CapstoneSession = mongoose.model("CapstoneSession", capstoneSessionSchema);

export default CapstoneSession;
