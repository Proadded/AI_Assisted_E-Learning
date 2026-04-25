import mongoose from "mongoose";
import CuriosityLog from "../models/curiosityLog.model.js";
import Video from "../models/video.model.js";
import { classifyAndTag, generateChatReply } from "../lib/aiEvaluator.js";
import { buildStudentContext } from "../services/studentContext.service.js";

export const sendMessage = async (req, res) => {
    try {
        const { message, courseId, history } = req.body;
        const studentId = new mongoose.Types.ObjectId(req.user._id);

        const studentUser = await mongoose.model("User")
            .findById(studentId)
            .select("fullName")
            .lean();
        const studentName = studentUser?.fullName || null;

        // Step 1 — validate
        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        // Step 2 — classify and tag
        const { isCourseRelated, conceptTag } = await classifyAndTag(message, courseId);

        // Step 3 — build student context if course-related
        let studentContext = null;
        let fullContext = null;
        if (isCourseRelated) {
            try {
                fullContext = await buildStudentContext(studentId.toString());

                // If courseId provided, find that specific course context
                if (courseId && fullContext?.courses?.length) {
                    const courseCtx = fullContext.courses.find(
                        (c) => c.courseId === courseId.toString()
                    );
                    if (courseCtx) {
                        studentContext = {
                            ...extractContext(courseCtx),
                            courseTitle: courseCtx.courseTitle || "their course",
                        };
                    }
                }

                // If no courseId or course not found, aggregate across ALL courses
                if (!studentContext && fullContext?.courses?.length) {
                    const allFingerprints = fullContext.courses.flatMap(c => c.fingerprints || []);
                    const allVideoTitles = fullContext.courses.flatMap(c =>
                        c.testHistory?.filter(t => t.videoTitle).map(t => t.videoTitle) || []
                    );
                    const allScores = fullContext.courses
                        .map(c => c.aggregateScore?.averageScore)
                        .filter(Boolean);

                    studentContext = {
                        conceptualGaps: allFingerprints
                            .filter(f => f.classification === "ConceptualGap")
                            .map(f => f.conceptTag),
                        carelessErrors: allFingerprints
                            .filter(f => f.classification === "CarelessError")
                            .map(f => f.conceptTag),
                        watchedVideoTitles: [...new Set(allVideoTitles)],
                        avgScore: allScores.length
                            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
                            : 0,
                        proficiency: fullContext.courses[0]?.proficiency || "beginner",
                        courseTitle: fullContext.courses.map(c => c.courseTitle).filter(Boolean).join(", ") || "their course",
                    };
                }
            } catch (err) {
                console.log("buildStudentContext failed (graceful degradation):", err.message);
                studentContext = null;
            }
        }

        if (studentContext) {
            studentContext.studentName = studentName;
        }

        // Fetch course videos for reference linking
        let courseVideos = [];
        try {
            if (isCourseRelated && courseId) {
                courseVideos = await Video.find(
                    { courseId: courseId },
                    { _id: 1, title: 1, topic: 1, order: 1 }
                ).sort({ order: 1 }).lean();
            }

            // If no courseId but course-related, fetch from first enrolled course
            if (isCourseRelated && !courseId && fullContext?.courses?.length) {
                const firstCourse = fullContext.courses[0];
                courseVideos = await Video.find(
                    { courseId: firstCourse.courseId },
                    { _id: 1, title: 1, topic: 1, order: 1, courseId: 1 }
                ).sort({ order: 1 }).lean();
            }
        } catch (err) {
            courseVideos = [];
        }

        // Step 4 — generate reply
        const { reply, videoId } = await generateChatReply({
            message,
            history: history || [],
            studentContext,
            isCourseRelated,
            courseVideos,
        });
        
        console.log("[Chat] videoId from Gemini:", videoId);
        console.log("[Chat] courseVideos count:", courseVideos.length);

        let videoRef = null;
        if (videoId) {
            const matched = courseVideos.find(v => v._id.toString() === videoId);
            if (matched) {
                videoRef = {
                    videoId: matched._id.toString(),
                    title: matched.title,
                    topic: matched.topic || null,
                    courseId: courseId || fullContext?.courses?.[0]?.courseId || null,
                };
            }
        }
        
        console.log("[Chat] videoRef built:", videoRef);

        // Step 5 — log curiosity if course-related and tagged
        let stored = false;
        if (isCourseRelated && conceptTag) {
            await CuriosityLog.create({
                studentId,
                courseId: courseId ? new mongoose.Types.ObjectId(courseId) : null,
                conceptTag,
                rawQuestion: message.slice(0, 500),
                askedAt: new Date(),
            });
            stored = true;
        }

        // Step 6 — respond
        return res.status(200).json({ reply, conceptTag, stored, videoRef });
    } catch (error) {
        console.log("Error in sendMessage controller:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getCuriositySummary = async (req, res) => {
    try {
        const studentId = new mongoose.Types.ObjectId(req.user._id);
        const { courseId } = req.query;

        const matchStage = { studentId };
        if (courseId) {
            matchStage.courseId = new mongoose.Types.ObjectId(courseId);
        }

        const curiosity = await CuriosityLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$conceptTag",
                    askCount: { $sum: 1 },
                },
            },
            { $sort: { askCount: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    conceptTag: "$_id",
                    askCount: 1,
                },
            },
        ]);

        res.status(200).json({ curiosity });
    } catch (error) {
        console.log("Error in getCuriositySummary controller:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper — extract context from a single course
function extractContext(courseCtx) {
    const fingerprints = courseCtx.fingerprints || [];
    return {
        conceptualGaps: fingerprints
            .filter((f) => f.classification === "ConceptualGap")
            .map((f) => f.conceptTag),
        carelessErrors: fingerprints
            .filter((f) => f.classification === "CarelessError")
            .map((f) => f.conceptTag),
        watchedVideoTitles: courseCtx.testHistory
            ?.filter((t) => t.videoTitle)
            .map((t) => t.videoTitle) || [],
        avgScore: courseCtx.aggregateScore?.averageScore || 0,
        proficiency: courseCtx.proficiency || "beginner",
    };
}
