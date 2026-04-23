import mongoose from "mongoose";

/**
 * CuriosityLog
 * One document per question asked by a student.
 * Frequency (how often a student asks about a concept) is computed via aggregation
 * ($group + $count) at query time — it is NOT stored as a counter on this document.
 * Only course-related questions are stored; off-topic answers are filtered upstream
 * and must never be passed to the service that creates these documents.
 */
const curiosityLogSchema = new mongoose.Schema(
    {
        // Using User._id — consistent with existing Progress.studentId convention in this codebase
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // null when the question is asked outside the context of a specific course
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: false,
            default: null,
        },

        // e.g. "closures", "async-await", "array-methods"
        // Must be lowercase alphanumeric with hyphens — enforced at the service layer.
        conceptTag: {
            type: String,
            required: true,
            match: [/^[a-z0-9-]+$/, "conceptTag must be lowercase alphanumeric with hyphens only"],
        },

        // The verbatim question text submitted by the student
        rawQuestion: {
            type: String,
            required: true,
            maxlength: 500,
        },

        // Explicitly stored so queries can sort/filter by ask time independently of createdAt
        askedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Compound index: supports frequency aggregation queries
// e.g. { $group: { _id: { studentId, conceptTag, courseId }, count: { $sum: 1 } } }
curiosityLogSchema.index({ studentId: 1, conceptTag: 1, courseId: 1 });

// Compound index: supports timeline queries sorted by most-recent question
curiosityLogSchema.index({ studentId: 1, askedAt: -1 });

export default mongoose.model("CuriosityLog", curiosityLogSchema);
