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
        type: { type: String, enum: ["mcq", "short", "essay"] },
        options: [String], // for MCQ
        correctAnswer: String, // for MCQ
    }],
    passingScore: { type: Number, default: 70 }
}, { timestamps: true });

const Test = mongoose.model("Test", testSchema);
export default Test;