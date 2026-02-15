import Video from "../models/video.model.js";
import Progress from "../models/progress.model.js";

export const getCourseVideos = async (req, res) => {
    try {
        const videos = await Video.find({ courseId: req.params.courseId })
            .sort({ order: 1 });
        res.json({ videos });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.videoId);
        res.json({ video });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const markWatched = async (req, res) => {
    try {
        const { videoId } = req.params;
        const studentId = req.user._id;

        let progress = await Progress.findOne({ studentId, videoId });

        if (!progress) {
            progress = new Progress({ studentId, videoId });
        }

        progress.watched = true;
        await progress.save();

        res.json({ message: "Marked as watched" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};