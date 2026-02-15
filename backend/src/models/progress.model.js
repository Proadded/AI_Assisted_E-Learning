import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    watched: { type: Boolean, default: false },
    testTaken: { type: Boolean, default: false },
    testScore: Number,

    // AI Analysis Results (This is your key feature!)
    aiAnalysis: {
        weakAreas: [String],
        strengths: [String],
        personalizedFeedback: String,
        recommendations: [String]
    }
}, { timestamps: true });

const Progress = mongoose.model("Progress", progressSchema);
export default Progress;