import TestResult from "../models/testResult.model.js";
import StudentFingerprint from "../models/fingerprint.model.js";
import Progress from "../models/progress.model.js";
import Course from "../models/course.model.js";
import mongoose from "mongoose";

// ─── 1. GET /api/dashboard/scores ───────────────────────────────────────────

export const getDashboardScores = async (req, res) => {
    try {
        const { courseId, dateFrom, dateTo, difficulty } = req.query;

        const match = {
            studentId: new mongoose.Types.ObjectId(req.user._id),
            evaluationStatus: "complete",
        };
        if (courseId) match.courseId = new mongoose.Types.ObjectId(courseId);
        if (dateFrom || dateTo) {
            match.createdAt = {};
            if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
            if (dateTo)   match.createdAt.$lte = new Date(dateTo);
        }

        const scores = await TestResult.aggregate([
            { $match: match },
            { $sort: { createdAt: 1 } },
            {
                $lookup: {
                    from: "tests", localField: "testId", foreignField: "_id", as: "test"
                }
            },
            { $unwind: { path: "$test", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "videos", localField: "videoId", foreignField: "_id", as: "video"
                }
            },
            { $unwind: { path: "$video", preserveNullAndEmptyArrays: true } },
            {
                $match: difficulty ? { "test.difficulty": difficulty } : {}
            },
            {
                $project: {
                    courseId: 1, videoId: 1, testId: 1,
                    totalScore: 1, passed: 1, attemptNumber: 1,
                    evaluationStatus: 1, createdAt: 1,
                    "video.title": 1,
                    "test.difficulty": 1,
                }
            }
        ]);

        res.json({ scores });
    } catch (error) {
        console.log("Error in getDashboardScores:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// ─── 2. GET /api/dashboard/trends ───────────────────────────────────────────

export const getDashboardTrends = async (req, res) => {
    try {
        const { courseId } = req.query;
        const windowParam = req.query.window || "30d";

        const windowMap = { "7d": 7, "30d": 30 };
        const days = windowMap[windowParam];
        const dateFrom = days
            ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            : null;

        const filter = {
            studentId: req.user._id,
            evaluationStatus: "complete",
        };
        if (courseId) filter.courseId = courseId;
        if (dateFrom) filter.createdAt = { $gte: dateFrom };

        const results = await TestResult.find(filter)
            .sort({ createdAt: 1 })
            .select("courseId totalScore passed createdAt")
            .lean();

        // For each result, compute movingAvg as mean of all results
        // in the 7 days preceding that result's createdAt
        const withMovingAvg = results.map((r, i) => {
            const windowStart = new Date(r.createdAt).getTime() - 7 * 24 * 60 * 60 * 1000;
            const windowResults = results.filter(x =>
                new Date(x.createdAt).getTime() >= windowStart &&
                new Date(x.createdAt).getTime() <= new Date(r.createdAt).getTime()
            );
            const movingAvg = windowResults.reduce((a, x) => a + x.totalScore, 0) / windowResults.length;
            return {
                date: r.createdAt,
                score: r.totalScore,
                passed: r.passed,
                courseId: r.courseId,
                movingAvg: parseFloat(movingAvg.toFixed(1)),
            };
        });

        res.json({ trends: withMovingAvg });
    } catch (error) {
        console.log("Error in getDashboardTrends:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// ─── 3. GET /api/dashboard/fingerprints ─────────────────────────────────────

export const getDashboardFingerprints = async (req, res) => {
    try {
        const { courseId, classification } = req.query;

        const filter = { studentId: req.user._id };
        if (courseId)       filter.courseId = courseId;
        if (classification) filter.classification = classification;

        const fingerprints = await StudentFingerprint.find(filter)
            .sort({ fingerprintScore: -1 })
            .select("-__v")
            .lean();

        const grouped = {};
        fingerprints.forEach(f => {
            const key = f.courseId.toString();
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(f);
        });

        res.json({ fingerprints: grouped });
    } catch (error) {
        console.log("Error in getDashboardFingerprints:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// ─── 4. GET /api/dashboard/summary ──────────────────────────────────────────

export const getDashboardSummary = async (req, res) => {
    try {
        const [results, fingerprints, progressDocs] = await Promise.all([
            TestResult.find({
                studentId: req.user._id,
                evaluationStatus: "complete"
            }).select("totalScore passed courseId").lean(),

            StudentFingerprint.find({
                studentId: req.user._id
            }).select("classification courseId").lean(),

            Progress.find({
                studentId: req.user._id
            }).select("courseId courseComplete allTestsPassed").lean(),
        ]);

        const totalTestsAttempted  = results.length;
        const overallAverageScore  = results.length
            ? Math.round(results.reduce((a, r) => a + r.totalScore, 0) / results.length)
            : 0;
        const totalConceptualGaps  = fingerprints.filter(f => f.classification === "ConceptualGap").length;
        const totalCarelessErrors  = fingerprints.filter(f => f.classification === "CarelessError").length;

        // Courses enrolled = unique courseIds across Progress docs
        const totalCoursesEnrolled = new Set(progressDocs.map(p => p.courseId?.toString())).size;

        // Strongest/weakest course by average score
        const courseScores = {};
        results.forEach(r => {
            const key = r.courseId?.toString();
            if (!key) return;
            if (!courseScores[key]) courseScores[key] = [];
            courseScores[key].push(r.totalScore);
        });
        const courseAvgs = Object.entries(courseScores).map(([id, scores]) => ({
            courseId: id,
            avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        }));
        const strongestCourse = courseAvgs.length
            ? courseAvgs.reduce((a, b) => a.avg > b.avg ? a : b).courseId
            : null;
        const weakestCourse = courseAvgs.length
            ? courseAvgs.reduce((a, b) => a.avg < b.avg ? a : b).courseId
            : null;

        res.json({
            summary: {
                totalCoursesEnrolled,
                totalTestsAttempted,
                overallAverageScore,
                totalConceptualGaps,
                totalCarelessErrors,
                strongestCourse,
                weakestCourse,
            }
        });
    } catch (error) {
        console.log("Error in getDashboardSummary:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
