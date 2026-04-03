import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;


const progressSchema = new mongoose.Schema({
    studentId: {
        type: ObjectId,
        ref: "Student"
    },
    videoId: {
        type: ObjectId,
        ref: "Video"
    },
    watched: { type: Boolean, default: false },
    watchedAt: { type: Date },
    testTaken: { type: Boolean, default: false },
    testScore: Number,

    // AI Analysis Results
    aiAnalysis: {
        weakAreas: [String],
        strengths: [String],
        personalizedFeedback: String,
        recommendations: [String]
    },

    testResultId: { type: ObjectId, ref: "TestResult" },
    courseComplete: { type: Boolean, default: false },
    allTestsPassed: { type: Boolean, default: false },
}, { timestamps: true });

progressSchema.index({ studentId: 1, videoId: 1 }, { unique: true });



const Progress = mongoose.model("Progress", progressSchema);
export default Progress;