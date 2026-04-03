import Progress from "../models/progress.model.js";
import Video from "../models/video.model.js";

export const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const videos = await Video.find({ courseId }).select("_id");
        const videoIds = videos.map(v => v._id);

        const completed = await Progress.find({
            studentId: userId,
            videoId: { $in: videoIds },
            watched: true
        }).select("videoId");

        const completedVideoIds = completed.map(p => p.videoId.toString());
        const totalCount = videoIds.length;
        const completedCount = completedVideoIds.length;
        const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        res.json({ completedVideoIds, completedCount, totalCount, percentComplete });
    } catch (error) {
        console.error("getCourseProgress error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
