import { useEffect, useRef, useState } from "react";
import useTestStore from "../store/useTestStore.js";

// ─── Injected styles ──────────────────────────────────────────────────────────
const STYLES = `
  .tp-wrap {
    margin-top: 2rem;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Idle card ── */
  .tp-card {
    background: var(--ivory, #faf9f6);
    border: 1px solid var(--border, #e5e2da);
    border-radius: 16px;
    padding: 1.5rem;
  }
  .tp-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted, #9e9b93);
    margin-bottom: 0.35rem;
  }
  .tp-topic {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--charcoal, #1c1917);
    margin: 0 0 1rem 0;
  }
  .tp-meta {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.25rem;
  }
  .tp-meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tp-meta-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--charcoal, #1c1917);
  }
  .tp-meta-label {
    font-size: 0.72rem;
    color: var(--text-muted, #9e9b93);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Buttons ── */
  .tp-btn-primary {
    display: inline-block;
    background: var(--amber, #f59e0b);
    color: #1c1917;
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.65rem 1.4rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .tp-btn-primary:hover { background: #d97706; }
  .tp-btn-primary:disabled {
    background: var(--border, #e5e2da);
    color: var(--text-muted, #9e9b93);
    cursor: not-allowed;
  }
  .tp-btn-secondary {
    display: inline-block;
    background: transparent;
    color: var(--charcoal, #1c1917);
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.65rem 1.4rem;
    border: 1px solid var(--border, #e5e2da);
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .tp-btn-secondary:hover { border-color: #a39e95; }

  /* ── Question card ── */
  .tp-questions { display: flex; flex-direction: column; gap: 1.25rem; }
  .tp-q-card {
    background: var(--ivory, #faf9f6);
    border: 1px solid var(--border, #e5e2da);
    border-radius: 14px;
    padding: 1.25rem;
  }
  .tp-q-number {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted, #9e9b93);
    margin-bottom: 0.4rem;
  }
  .tp-q-text {
    font-size: 0.975rem;
    font-weight: 600;
    color: var(--charcoal, #1c1917);
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  /* MCQ options */
  .tp-options { display: flex; flex-direction: column; gap: 0.5rem; }
  .tp-option {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.6rem 0.9rem;
    border: 1px solid var(--border, #e5e2da);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
    color: var(--charcoal, #1c1917);
    font-size: 0.9rem;
    background: #fff;
  }
  .tp-option:hover { border-color: var(--amber, #f59e0b); background: var(--amber-pale, #fffbeb); }
  .tp-option-selected {
    border-color: var(--amber, #f59e0b);
    background: var(--amber-pale, #fffbeb);
    font-weight: 600;
  }
  .tp-option input[type="radio"] { accent-color: var(--amber, #f59e0b); }

  /* Textarea */
  .tp-textarea {
    width: 100%;
    min-height: 100px;
    background: #fff;
    border: 1px solid var(--border, #e5e2da);
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.9rem;
    color: var(--charcoal, #1c1917);
    font-family: inherit;
    resize: vertical;
    outline: none;
    transition: border-color 0.12s;
    box-sizing: border-box;
  }
  .tp-textarea:focus { border-color: var(--amber, #f59e0b); }
  .tp-textarea-essay { min-height: 160px; }
  .tp-word-count {
    font-size: 0.72rem;
    color: var(--text-muted, #9e9b93);
    margin-top: 0.3rem;
    text-align: right;
  }
  .tp-word-limit { color: #ef4444; font-weight: 600; }

  /* ── Submit row ── */
  .tp-submit-row {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.5rem;
  }

  /* ── Spinner ── */
  .tp-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2.5rem 0;
  }
  .tp-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border, #e5e2da);
    border-top-color: var(--amber, #f59e0b);
    border-radius: 50%;
    animation: tp-spin 0.8s linear infinite;
  }
  @keyframes tp-spin { to { transform: rotate(360deg); } }
  .tp-spinner-text {
    font-size: 0.925rem;
    color: var(--text-muted, #9e9b93);
    font-weight: 500;
  }

  /* ── Results ── */
  .tp-results-header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .tp-score-circle {
    width: 80px;
    height: 80px;
    background: var(--amber-pale, #fffbeb);
    border: 3px solid var(--amber, #f59e0b);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .tp-score-num {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--charcoal, #1c1917);
    line-height: 1;
  }
  .tp-score-pct {
    font-size: 0.65rem;
    color: var(--text-muted, #9e9b93);
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  .tp-badge {
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
  .tp-badge-pass { background: #dcfce7; color: #15803d; }
  .tp-badge-fail { background: #fee2e2; color: #b91c1c; }

  .tp-result-cards { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
  .tp-result-q-card {
    background: var(--ivory, #faf9f6);
    border: 1px solid var(--border, #e5e2da);
    border-radius: 12px;
    padding: 1.1rem;
  }
  .tp-result-q-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--charcoal, #1c1917);
    margin-bottom: 0.4rem;
  }
  .tp-student-answer {
    font-size: 0.85rem;
    color: var(--text-muted, #9e9b93);
    margin-bottom: 0.6rem;
    line-height: 1.5;
  }
  .tp-ai-feedback-box {
    background: var(--amber-pale, #fffbeb);
    border: 1px solid var(--amber, #f59e0b);
    border-radius: 8px;
    padding: 0.75rem 1rem;
  }
  .tp-ai-feedback-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .tp-ai-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #92400e;
  }
  .tp-ai-scores {
    display: flex;
    gap: 0.75rem;
  }
  .tp-ai-score-chip {
    font-size: 0.72rem;
    font-weight: 600;
    background: var(--amber, #f59e0b);
    color: #1c1917;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
  }
  .tp-ai-feedback-text {
    font-size: 0.85rem;
    color: #78350f;
    line-height: 1.5;
  }
  .tp-mcq-correct { color: #15803d; font-weight: 600; font-size: 0.8rem; margin-top: 0.3rem; }
  .tp-mcq-wrong   { color: #b91c1c; font-weight: 600; font-size: 0.8rem; margin-top: 0.3rem; }

  .tp-retake-row {
    display: flex;
    justify-content: flex-end;
  }
`;

// ─── Helper ───────────────────────────────────────────────────────────────────
function countWords(str) {
    return str.trim() === "" ? 0 : str.trim().split(/\s+/).length;
}

// ─── Component ────────────────────────────────────────────────────────────────
const TestPanel = ({ videoId, onTestPassed }) => {
    const { test, result, isLoading, fetchTest, submitAnswers, pollResult, clearTest } =
        useTestStore();

    const [phase, setPhase] = useState("idle");
    const [answers, setAnswers] = useState({});
    const pollInterval = useRef(null);
    const questionStartTimeRef = useRef({});

    // Fetch test on mount / videoId change
    useEffect(() => {
        clearTest();
        setPhase("idle");
        setAnswers({});
        fetchTest(videoId);
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [videoId]);

    // ── Polling logic ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== "polling") return;
        if (!result?.resultId) return;

        pollInterval.current = setInterval(async () => {
            const latest = await pollResult(result.resultId);
            if (
                latest?.evaluationStatus === "complete" ||
                latest?.evaluationStatus === "failed"
            ) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
                setPhase("results");
            }
        }, 3000);

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [phase, result]);

    // Call onTestPassed when landing on results and test was passed
    useEffect(() => {
        if (phase !== "results") return;
        const r = useTestStore.getState().result;
        if (r?.passed) onTestPassed?.();
    }, [phase]);

    // Track when questions are rendered
    useEffect(() => {
        if (phase === "taking") {
            test?.questions?.forEach(q => {
                if (!questionStartTimeRef.current[q._id]) {
                    questionStartTimeRef.current[q._id] = Date.now();
                }
            });
        }
    }, [phase, test]);

    // ── Submit handler ─────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setPhase("submitting");
        const answersArray = Object.entries(answers).map(([questionId, data]) => ({
            questionId,
            answer: data.answer,
            responseTimeMs: data.responseTimeMs,
        }));
        const data = await submitAnswers(test._id, answersArray);
        if (!data) {
            // Network error — go back to taking phase
            setPhase("taking");
            return;
        }
        if (data.evaluationStatus === "processing") {
            setPhase("polling");
        } else {
            setPhase("results");
        }
    };

    // ── Render guards ──────────────────────────────────────────────────────────
    if (isLoading) return null; // Let the parent handle overall load states
    if (!test && phase === "idle") return null;

    // All questions must have a non-empty answer to enable submit
    const allAnswered =
        test?.questions?.every((q) => {
            const a = answers[q._id]?.answer;
            return a && a.trim() !== "";
        }) ?? false;

    // ── Result data ────────────────────────────────────────────────────────────
    const storeResult = useTestStore.getState().result;

    // ── Phase: idle ────────────────────────────────────────────────────────────
    if (phase === "idle") {
        return (
            <div className="tp-wrap">
                <style dangerouslySetInnerHTML={{ __html: STYLES }} />
                <div className="tp-card">
                    <p className="tp-label">📝 Test Available</p>
                    <p className="tp-topic">{test.topic || test.subject || "Knowledge Check"}</p>
                    <div className="tp-meta">
                        <div className="tp-meta-item">
                            <span className="tp-meta-value">{test.questions.length}</span>
                            <span className="tp-meta-label">Questions</span>
                        </div>
                        <div className="tp-meta-item">
                            <span className="tp-meta-value">{test.passingScore}%</span>
                            <span className="tp-meta-label">To Pass</span>
                        </div>
                        <div className="tp-meta-item">
                            <span className="tp-meta-value" style={{ textTransform: "capitalize" }}>
                                {test.difficulty}
                            </span>
                            <span className="tp-meta-label">Difficulty</span>
                        </div>
                    </div>
                    <button className="tp-btn-primary" onClick={() => setPhase("taking")}>
                        Start Test →
                    </button>
                </div>
            </div>
        );
    }

    // ── Phase: taking ──────────────────────────────────────────────────────────
    if (phase === "taking") {
        return (
            <div className="tp-wrap">
                <style dangerouslySetInnerHTML={{ __html: STYLES }} />
                <div className="tp-questions">
                    {test.questions.map((q, idx) => {
                        const isEssay = q.type === "essay";
                        const isShort = q.type === "short_answer";
                        const isSubjective = isEssay || isShort;
                        const wordLimit = isEssay ? 500 : 200;
                        const currentAnswer = answers[q._id]?.answer ?? "";
                        const words = isSubjective ? countWords(currentAnswer) : 0;
                        const overLimit = isSubjective && words > wordLimit;

                        return (
                            <div key={q._id} className="tp-q-card">
                                <p className="tp-q-number">Question {idx + 1} of {test.questions.length}</p>
                                <p className="tp-q-text">{q.question}</p>

                                {q.type === "mcq" && (
                                    <div className="tp-options">
                                        {q.options.map((opt) => {
                                            const selected = currentAnswer === opt;
                                            return (
                                                <label
                                                    key={opt}
                                                    className={`tp-option${selected ? " tp-option-selected" : ""}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`q-${q._id}`}
                                                        value={opt}
                                                        checked={selected}
                                                        onChange={() => {
                                                            const start = questionStartTimeRef.current[q._id] || Date.now();
                                                            setAnswers((prev) => ({ 
                                                                ...prev, 
                                                                [q._id]: { answer: opt, responseTimeMs: Date.now() - start } 
                                                            }));
                                                        }}
                                                    />
                                                    {opt}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {isSubjective && (
                                    <>
                                        <textarea
                                            className={`tp-textarea${isEssay ? " tp-textarea-essay" : ""}`}
                                            placeholder={
                                                isEssay
                                                    ? "Write your essay here… (up to 500 words)"
                                                    : "Write your answer here… (up to 200 words)"
                                            }
                                            value={currentAnswer}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAnswers((prev) => {
                                                    const existing = prev[q._id];
                                                    const start = questionStartTimeRef.current[q._id] || Date.now();
                                                    // Measure time on first keystroke, or update continuously. Let's capture the final time
                                                    const timeMs = existing?.responseTimeMs || (Date.now() - start);
                                                    return { ...prev, [q._id]: { answer: val, responseTimeMs: timeMs } };
                                                });
                                            }}
                                        />
                                        <p className={`tp-word-count${overLimit ? " tp-word-limit" : ""}`}>
                                            {words} / {wordLimit} words
                                        </p>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="tp-submit-row" style={{ marginTop: "1rem" }}>
                    <button
                        className="tp-btn-primary"
                        disabled={!allAnswered}
                        onClick={handleSubmit}
                    >
                        Submit Test
                    </button>
                </div>
            </div>
        );
    }

    // ── Phase: submitting ──────────────────────────────────────────────────────
    if (phase === "submitting") {
        return (
            <div className="tp-wrap">
                <style dangerouslySetInnerHTML={{ __html: STYLES }} />
                <div className="tp-center">
                    <div className="tp-spinner" />
                    <p className="tp-spinner-text">Grading your answers…</p>
                </div>
            </div>
        );
    }

    // ── Phase: polling ─────────────────────────────────────────────────────────
    if (phase === "polling") {
        return (
            <div className="tp-wrap">
                <style dangerouslySetInnerHTML={{ __html: STYLES }} />
                <div className="tp-center">
                    <div className="tp-spinner" />
                    <p className="tp-spinner-text">AI is reviewing your written answers…</p>
                </div>
            </div>
        );
    }

    // ── Phase: results ─────────────────────────────────────────────────────────
    if (phase === "results") {
        const r = storeResult ?? result;
        if (!r) return null;

        const passed = r.passed;
        const score = r.totalScore ?? 0;

        return (
            <div className="tp-wrap">
                <style dangerouslySetInnerHTML={{ __html: STYLES }} />

                <div className="tp-results-header">
                    <div className="tp-score-circle">
                        <span className="tp-score-num">{score}</span>
                        <span className="tp-score-pct">SCORE</span>
                    </div>
                    <div>
                        <span className={`tp-badge ${passed ? "tp-badge-pass" : "tp-badge-fail"}`}>
                            {passed ? "✓ Passed" : "✗ Not passed"}
                        </span>
                        <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "var(--text-muted, #9e9b93)" }}>
                            {passed
                                ? "Great work! You passed this test."
                                : `You needed ${test.passingScore}% to pass. Keep it up!`}
                        </p>
                    </div>
                </div>

                <div className="tp-result-cards">
                    {(r.answers ?? []).map((ans, idx) => {
                        const question = test.questions.find(
                            (q) => q._id.toString() === ans.questionId?.toString()
                        );
                        if (!question) return null;

                        return (
                            <div key={idx} className="tp-result-q-card">
                                <p className="tp-result-q-text">{question.question}</p>
                                <p className="tp-student-answer">
                                    <strong>Your answer:</strong> {ans.studentAnswer || "—"}
                                </p>

                                {ans.type === "mcq" && (
                                    <p className={ans.isCorrect ? "tp-mcq-correct" : "tp-mcq-wrong"}>
                                        {ans.isCorrect ? "✓ Correct" : `✗ Incorrect — correct answer: ${question.correctAnswer}`}
                                    </p>
                                )}

                                {ans.aiFeedback && (
                                    <div className="tp-ai-feedback-box">
                                        <div className="tp-ai-feedback-header">
                                            <span className="tp-ai-label">✦ AI Feedback</span>
                                            <div className="tp-ai-scores">
                                                {ans.aiScore != null && (
                                                    <span className="tp-ai-score-chip">
                                                        Score: {ans.aiScore}/{question.maxScore}
                                                    </span>
                                                )}
                                                {ans.aiConfidence != null && (
                                                    <span className="tp-ai-score-chip">
                                                        Confidence: {Math.round(ans.aiConfidence * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="tp-ai-feedback-text">{ans.aiFeedback}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="tp-retake-row">
                    <button
                        className="tp-btn-secondary"
                        onClick={() => {
                            clearTest();
                            setAnswers({});
                            setPhase("idle");
                            fetchTest(videoId);
                        }}
                    >
                        Retake Test
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default TestPanel;
