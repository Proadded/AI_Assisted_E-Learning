import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        courseSubscribed: String,
        educationLevel: String,

        progress:{
            currentSubject: String,
            currentTopic: String,
            completedTopics: [String],
        },

        performance: {
            averageScore: Number,
            strongTopics: [String],
            weakTopics: [String],
        },
    },
    { timestamps: true

    }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;  