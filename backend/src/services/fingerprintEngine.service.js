import StudentFingerprint from "../models/fingerprint.model.js";
import Test from "../models/quiz.model.js";
import mongoose from "mongoose";

const CONCEPTUAL_GAP_THRESHOLD = 0.60;
const CARELESS_ERROR_THRESHOLD = 0.30;
const MINIMUM_ATTEMPTS         = 3;
const FAST_ANSWER_MS_THRESHOLD = 8000;
const W_RECURRENCE = 0.35;
const W_PHRASING   = 0.30;
const W_RECOVERY   = 0.25;
const W_TIMING     = 0.10;

export function computeFingerprint(counters) {
    const {
        attempts,
        wrongCount,
        phrasingsTotal,
        phrasingsFailed,
        fastWrongCount,
        conceptsRecovered,
        conceptsFailed
    } = counters;

    if (attempts < MINIMUM_ATTEMPTS) {
        return { fingerprintScore: null, classification: "Uncertain" };
    }

    const recurrenceRate = wrongCount / attempts;
    const phrasingsFailedRatio = phrasingsTotal > 0 ? phrasingsFailed / phrasingsTotal : 0;
    const recoveryRate = conceptsFailed > 0 ? conceptsRecovered / conceptsFailed : 1;
    const fastWrongRatio = wrongCount > 0 ? fastWrongCount / wrongCount : 0;

    const score = (W_RECURRENCE * recurrenceRate) +
                  (W_PHRASING * phrasingsFailedRatio) +
                  (W_RECOVERY * (1 - recoveryRate)) -
                  (W_TIMING * fastWrongRatio);

    const fingerprintScore = Math.max(0, Math.min(1, score));

    let classification;
    if (fingerprintScore >= CONCEPTUAL_GAP_THRESHOLD) {
        classification = "ConceptualGap";
    } else if (fingerprintScore < CARELESS_ERROR_THRESHOLD) {
        classification = "CarelessError";
    } else {
        classification = "Uncertain";
    }

    return {
        fingerprintScore: parseFloat(fingerprintScore.toFixed(4)),
        classification
    };
}

export async function updateFingerprintsFromResult(testResult) {
    try {
        const test = await Test.findById(testResult.testId);
        if (!test) {
            console.warn(`[fingerprintEngine] Test not found for testId: ${testResult.testId}`);
            return;
        }

        const questionMap = new Map();
        for (const q of test.questions) {
            if (q.conceptTag) {
                questionMap.set(q._id.toString(), {
                    conceptTag: q.conceptTag,
                    phrasingSeed: q.phrasingSeed
                });
            }
        }

        const accumulator = {};

        for (const ans of testResult.answers) {
            const qIdStr = ans.questionId ? ans.questionId.toString() : null;
            if (!qIdStr || !questionMap.has(qIdStr)) continue;

            const { conceptTag, phrasingSeed } = questionMap.get(qIdStr);

            if (!accumulator[conceptTag]) {
                accumulator[conceptTag] = {
                    attempts: 0,
                    wrongCount: 0,
                    fastWrongCount: 0,
                    phrasingsSeen: new Set(),
                    phrasingsFailedSet: new Set()
                };
            }

            const acc = accumulator[conceptTag];

            acc.attempts += 1;
            
            if (ans.isCorrect === false) {
                acc.wrongCount += 1;
                // Using hardcoded 8000 per prompt or the constant. Both are 8000.
                if (ans.responseTimeMs != null && ans.responseTimeMs < 8000) {
                    acc.fastWrongCount += 1;
                }
            }

            if (phrasingSeed) {
                acc.phrasingsSeen.add(phrasingSeed);
                if (ans.isCorrect === false) {
                    acc.phrasingsFailedSet.add(phrasingSeed);
                }
            }
        }

        for (const [conceptTag, acc] of Object.entries(accumulator)) {
            const updated = await StudentFingerprint.findOneAndUpdate(
                { studentId: testResult.studentId, conceptTag, courseId: testResult.courseId },
                {
                    $inc: {
                        attempts:       acc.attempts,
                        wrongCount:     acc.wrongCount,
                        fastWrongCount: acc.fastWrongCount,
                        phrasingsTotal: acc.phrasingsSeen.size,
                        phrasingsFailed: acc.phrasingsFailedSet.size,
                    },
                    $set: { lastUpdatedFromResultId: testResult._id }
                },
                { upsert: true, new: true }
            );

            if (updated) {
                const { fingerprintScore, classification } = computeFingerprint(updated);
                await StudentFingerprint.findOneAndUpdate(
                    { _id: updated._id },
                    { $set: { fingerprintScore, classification, lastComputedAt: new Date() } }
                );
            }
        }

    } catch (error) {
        console.error("[fingerprintEngine] Error updating fingerprints:", error);
    }
}
