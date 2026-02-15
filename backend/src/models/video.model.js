import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: String,
    description: String,
    youtubeUrl: String, // Just store the YouTube URL
    subject: String,
    topic: String,
    duration: String, // e.g., "15:30"
    order: Number, // Position in playlist
    courseId: String,
}, { timestamps: true });

const Video = mongoose.model("Video", videoSchema);
export default Video;