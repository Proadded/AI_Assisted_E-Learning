import mongoose from "mongoose";

/**
 * StudentFingerprint
 * One document per student × concept × course.
 * Counters updated incrementally on each test submission via fingerprintEngine.service.js.
 * fingerprintScore + classification are ALWAYS recomputed by the engine — never set manually.
 */
const fingerprintSchema = new mongoose.Schema(
    {
        // Using User._id — consistent with existing Progress.studentId convention in this codebase
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // e.g. "closures", "async-await", "array-methods"
        // Must match quiz.model.js question.conceptTag exactly — enforced at seed/generation layer.
        conceptTag: {
            type: String,
            required: true,
            match: [/^[a-z0-9-]+$/, "conceptTag must be lowercase alphanumeric with hyphens only"],
        },

        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        // ─── Raw counters (incremented by updateFingerprintsFromResult) ──────────
        attempts: { type: Number, default: 0, min: 0 },
        wrongCount: { type: Number, default: 0, min: 0 },
        phrasingsTotal: { type: Number, default: 0, min: 0 }, // unique phrasingSeeds encountered
        phrasingsFailed: { type: Number, default: 0, min: 0 }, // unique phrasingSeeds with a wrong answer
        fastWrongCount: { type: Number, default: 0, min: 0 }, // wrong answers under 8 000 ms threshold
        conceptsRecovered: { type: Number, default: 0, min: 0 }, // correct after prior failure + feedback
        conceptsFailed: { type: Number, default: 0, min: 0 }, // failures that preceded a feedback window

        // ─── Computed fields (set by computeFingerprint() in fingerprintEngine.service.js) ─
        fingerprintScore: {
            type: Number,
            default: null,
            min: 0,
            max: 1,
            // null = insufficient data (attempts < MINIMUM_ATTEMPTS = 3)
        },
        classification: {
            type: String,
            enum: ["ConceptualGap", "Uncertain", "CarelessError"],
            default: "Uncertain",
        },

        // Increment algorithmVersion in fingerprintEngine.service.js whenever weights/thresholds change.
        // A background job can query { algorithmVersion: { $ne: CURRENT_VERSION } } to re-run stale records.
        algorithmVersion: {
            type: String,
            default: "1.0",
        },

        // ─── Audit ───────────────────────────────────────────────────────────────
        lastUpdatedFromResultId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestResult",
            default: null,
        },
        lastComputedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Compound unique index: one fingerprint per student × concept × course
fingerprintSchema.index({ studentId: 1, conceptTag: 1, courseId: 1 }, { unique: true });

// Fast lookup: all ConceptualGap records for a student (used by AI context injection)
fingerprintSchema.index({ studentId: 1, classification: 1 });

export default mongoose.model("StudentFingerprint", fingerprintSchema);