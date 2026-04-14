import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    subject: String,
    topic: String,
    questions: [{
        question: String,
        type: { type: String, enum: ["mcq", "short_answer", "essay"] },
        options: [String],       // MCQ only
        correctAnswer: String,   // MCQ only
        conceptTag: { type: String, default: null },
        phrasingSeed: { type: String, default: null },
        rubric: String,          // Subjective: grading criteria sent to AI
        maxScore: { type: Number, default: 100 },
        weight: { type: Number, default: 1 }, // relative weight in final score
    }],
    passingScore: { type: Number, default: 70 },
    placement: {
        type: String,
        enum: ["after_video", "end_of_course", "both"],
        default: "after_video"
    },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
    isReusable: { type: Boolean, default: false },
    tags: [String], // for filtering/reuse across courses
}, { timestamps: true });

const Test = mongoose.model("Test", testSchema);
export default Test;