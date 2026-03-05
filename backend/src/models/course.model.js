import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            default: "",
        },
        category: {
            type: String,
            default: "General",
        },
        instructor: {
            type: String,
            default: "Instructor",
        },
        tutorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        videoCount: {
            type: Number,
            default: 0,
        },
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        // Mock user progress since there's no progress schema yet, used by frontend UI
        userProgress: {
            completedVideos: {
                type: Array,
                default: []
            }
        }
    },
    { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
