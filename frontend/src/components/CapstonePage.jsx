import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import useCapstoneStore from "../store/useCapstoneStore.js";

// ─── Injected styles ─────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');

  .cap-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--ivory, #faf9f6);
    min-height: 100vh;
    color: var(--text-body, #4a4540);
    box-sizing: border-box;
  }
  .cap-root *, .cap-root *::before, .cap-root *::after {
    box-sizing: border-box;
  }

  /* ── Top bar ── */
  .cap-topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(250, 249, 246, 0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border, rgba(42,39,35,0.1));
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .cap-topbar-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cap-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted, #7a756d);
  }
  .cap-course-name {
    font-family: 'DM Serif Display', serif;
    font-size: 18px;
    color: var(--charcoal, #1c1917);
    font-weight: 400;
    line-height: 1.2;
  }
  .cap-progress-badge {
    font-size: 12px;
    font-weight: 600;
    color: var(--charcoal, #1c1917);
    background: var(--ivory-dark, #ede9e1);
    border: 1px solid var(--border, rgba(42,39,35,0.1));
    border-radius: 999px;
    padding: 4px 14px;
    white-space: nowrap;
  }
  .cap-progress-answered {
    color: var(--amber, #d4860a);
  }

  /* ── Content area ── */
  .cap-content {
    max-width: 780px;
    margin: 0 auto;
    padding: 32px 24px 120px;
  }

  /* ── Question card ── */
  .cap-questions {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .cap-q-card {
    background: #fff;
    border: 1px solid var(--border, rgba(42,39,35,0.1));
    border-radius: 16px;
    padding: 24px;
    transition: box-shadow 0.15s ease;
  }
  .cap-q-card:has(.cap-option-selected) {
    border-color: var(--amber, #d4860a);
    box-shadow: 0 0 0 2px rgba(212, 134, 10, 0.08);
  }
  .cap-q-number {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted, #7a756d);
    margin: 0 0 10px;
  }
  .cap-q-stem {
    font-size: 15px;
    font-weight: 600;
    color: var(--charcoal, #1c1917);
    line-height: 1.55;
    margin: 0 0 18px;
  }

  /* ── Options ── */
  .cap-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cap-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border: 1.5px solid var(--border, rgba(42,39,35,0.1));
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    color: var(--charcoal, #1c1917);
    background: var(--ivory, #faf9f6);
    transition: border-color 0.12s, background 0.12s;
    user-select: none;
    text-align: left;
    font-family: 'DM Sans', sans-serif;
    line-height: 1.4;
  }
  .cap-option:hover {
    border-color: var(--amber-light, #f0a830);
    background: var(--amber-pale, #fdf3e1);
  }
  .cap-option-selected {
    border-color: var(--amber, #d4860a);
    background: var(--amber-pale, #fdf3e1);
    font-weight: 600;
  }
  .cap-option-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--warm-grey, #c8c2b8);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color 0.12s, background 0.12s;
  }
  .cap-option-selected .cap-option-dot {
    border-color: var(--amber, #d4860a);
    background: var(--amber, #d4860a);
  }
  .cap-option-dot-fill {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
  }
  .cap-option-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted, #7a756d);
    min-width: 16px;
    flex-shrink: 0;
  }
  .cap-option-selected .cap-option-label {
    color: var(--amber, #d4860a);
  }

  /* ── Submit footer ── */
  .cap-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(250, 249, 246, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid var(--border, rgba(42,39,35,0.1));
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    z-index: 20;
  }
  .cap-footer-hint {
    font-size: 13px;
    color: var(--text-muted, #7a756d);
  }
  .cap-footer-hint strong {
    color: var(--charcoal, #1c1917);
  }
  .cap-submit-btn {
    padding: 12px 28px;
    border: none;
    border-radius: 12px;
    background: var(--charcoal, #1c1917);
    color: var(--ivory, #faf9f6);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.15s ease;
    letter-spacing: 0.02em;
  }
  .cap-submit-btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }
  .cap-submit-btn:disabled {
    background: var(--warm-grey, #c8c2b8);
    cursor: not-allowed;
    transform: none;
  }

  /* ── Full-page spinner ── */
  .cap-spinner-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
    font-family: 'DM Sans', sans-serif;
    background: var(--ivory, #faf9f6);
  }
  .cap-spinner {
    width: 44px;
    height: 44px;
    border: 3px solid var(--border, rgba(42,39,35,0.1));
    border-top-color: var(--amber, #d4860a);
    border-radius: 50%;
    animation: cap-spin 0.8s linear infinite;
  }
  @keyframes cap-spin { to { transform: rotate(360deg); } }
  .cap-spinner-text {
    font-size: 14px;
    color: var(--text-muted, #7a756d);
    font-weight: 500;
  }

  /* ── Submitting overlay ── */
  .cap-submitting-overlay {
    position: fixed;
    inset: 0;
    background: rgba(250, 249, 246, 0.88);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 50;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Error / blocked page ── */
  .cap-error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 14px;
    font-family: 'DM Sans', sans-serif;
    background: var(--ivory, #faf9f6);
    padding: 32px;
    text-align: center;
  }
  .cap-error-icon {
    font-size: 36px;
  }
  .cap-error-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: var(--charcoal, #1c1917);
    margin: 0;
    font-weight: 400;
  }
  .cap-error-body {
    font-size: 14px;
    color: var(--text-muted, #7a756d);
    max-width: 380px;
    line-height: 1.6;
    margin: 0;
  }
  .cap-back-btn {
    margin-top: 8px;
    padding: 10px 22px;
    border: 1.5px solid var(--warm-grey, #c8c2b8);
    border-radius: 10px;
    background: transparent;
    color: var(--charcoal, #1c1917);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .cap-back-btn:hover {
    border-color: var(--charcoal, #1c1917);
  }

  /* ── Option letter labels (A/B/C/D) ── */
  .cap-option-letter {
    font-size: 11px;
    font-weight: 700;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--ivory-dark, #ede9e1);
    color: var(--text-muted, #7a756d);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.12s, color 0.12s;
  }
  .cap-option-selected .cap-option-letter {
    background: var(--amber, #d4860a);
    color: #fff;
  }
`;

const OPTION_LETTERS = ["A", "B", "C", "D"];

// ─── Component ────────────────────────────────────────────────────────────────
const CapstonePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Course name from Link state (passed by CapstoneStatusCard or CoursePage), fallback to "Final Exam"
  const courseName = location.state?.courseName ?? "Final Exam";

  const session = useCapstoneStore((state) => state.session);
  const answers = useCapstoneStore((state) => state.answers);
  const isLoading = useCapstoneStore((state) => state.isLoading);
  const error = useCapstoneStore((state) => state.error);
  const generateSession = useCapstoneStore((state) => state.generateSession);
  const setAnswer = useCapstoneStore((state) => state.setAnswer);
  const submitCapstone = useCapstoneStore((state) => state.submitCapstone);
  const clearSession = useCapstoneStore((state) => state.clearSession);

  // The API now returns { capstoneSessionId, questions, totalQuestions } directly inside res.data
  // store sets session = res.data
  const sessionId = session?.capstoneSessionId ?? null;
  console.log("[DEBUG] session:", session, "sessionId:", sessionId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 1. Generate session on mount ─────────────────────────────────────────
  useEffect(() => {
    clearSession();
    generateSession(courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // ── 2. Restore answers from sessionStorage once session is available ─────
  useEffect(() => {
    if (!sessionId) return;
    const key = `capstone_answers_${sessionId}`;
    try {
      const saved = sessionStorage.getItem(key);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (typeof parsed === "object" && parsed !== null) {
        Object.entries(parsed).forEach(([qi, si]) => {
          setAnswer(Number(qi), si);
        });
      }
    } catch {
      // Ignore malformed storage
    }
  }, [sessionId, setAnswer]);

  // ── 3. Persist answers to sessionStorage on every change ─────────────────
  useEffect(() => {
    if (!sessionId) return;
    const key = `capstone_answers_${sessionId}`;
    try {
      sessionStorage.setItem(key, JSON.stringify(answers));
    } catch {
      // Ignore storage errors (e.g., private mode quota)
    }
  }, [answers, sessionId]);

  // ── 4. Socket.IO fallback navigation ─────────────────────────────────────
  useEffect(() => {
    const socket = io("http://localhost:3001", { withCredentials: true });

    socket.on("capstone:result", ({ sessionId: resultSessionId, passed, score }) => {
      if (sessionId && String(resultSessionId) === String(sessionId)) {
        navigate(`/capstone/${courseId}/result/${resultSessionId}`);
      }
    });

    return () => {
      socket.off("capstone:result");
      socket.disconnect();
    };
  }, [courseId, navigate, sessionId]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const questions = session?.questions ?? [];
  const totalQuestions = questions.length;

  const answeredCount = useMemo(() => {
    return questions.reduce((count, _, idx) => {
      return answers[idx] !== undefined && answers[idx] !== null ? count + 1 : count;
    }, 0);
  }, [answers, questions]);

  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOptionClick = (questionIdx, optionIdx) => {
    setAnswer(questionIdx, optionIdx);
  };

  const handleSubmit = async () => {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitCapstone(sessionId);
      if (result?.sessionId) {
        // Clean up storage after successful submit
        sessionStorage.removeItem(`capstone_answers_${sessionId}`);
        navigate(`/capstone/${courseId}/result/${result.sessionId}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  // ── Render: full-page loading ─────────────────────────────────────────────
  console.log("[GUARD] isLoading:", isLoading, "session:", !!session, "error:", error);
  if (isLoading && !session) {
    return (
      <div className="cap-spinner-page">
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className="cap-spinner" />
        <p className="cap-spinner-text">Generating your final exam…</p>
      </div>
    );
  }

  // ── Render: error / locked / cooldown ─────────────────────────────────────
  if (error && !session) {
    return (
      <div className="cap-error-page">
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <span className="cap-error-icon">🔒</span>
        <h1 className="cap-error-title">Exam Unavailable</h1>
        <p className="cap-error-body">{error}</p>
        <button className="cap-back-btn" onClick={handleBack}>
          ← Go Back
        </button>
      </div>
    );
  }

  // ── Render: no session yet (shouldn't normally reach here) ────────────────
  if (!session) {
    return (
      <div className="cap-error-page">
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <span className="cap-error-icon">📋</span>
        <h1 className="cap-error-title">No Exam Session</h1>
        <p className="cap-error-body">
          Could not load a capstone session. Please try again from your dashboard.
        </p>
        <button className="cap-back-btn" onClick={handleBack}>
          ← Go Back
        </button>
      </div>
    );
  }

  // ── Render: exam UI ──────────────────────────────────────────────────────
  console.log("[RENDER] reaching exam UI, questions:", session?.questions?.length);
  return (
    <div className="cap-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Submitting overlay */}
      {isSubmitting && (
        <div className="cap-submitting-overlay">
          <div className="cap-spinner" />
          <p className="cap-spinner-text">Submitting your exam…</p>
        </div>
      )}

      {/* Top bar */}
      <div className="cap-topbar">
        <div className="cap-topbar-left">
          <span className="cap-eyebrow">Final Exam</span>
          <span className="cap-course-name">{courseName}</span>
        </div>
        <div className="cap-progress-badge">
          <span className="cap-progress-answered">{answeredCount}</span>
          &nbsp;/&nbsp;{totalQuestions} answered
        </div>
      </div>

      {/* Questions */}
      <div className="cap-content">
        <div className="cap-questions">
          {questions.map((q, qIdx) => {
            console.log("[Q]", qIdx, q?.stem, q?.options?.length);
            console.log("[Q-FULL]", qIdx, JSON.stringify(q));
            const selectedOption = answers[qIdx] ?? null;

            return (
              <div key={`${sessionId}-q-${qIdx}`} className="cap-q-card">
                <p className="cap-q-number">
                  Question {qIdx + 1} of {totalQuestions}
                </p>
                <p className="cap-q-stem">{q.stem}</p>

                <div className="cap-options">
                  {(q.options ?? []).map((optText, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    return (
                      <button
                        key={`q${qIdx}-o${oIdx}`}
                        type="button"
                        className={`cap-option${isSelected ? " cap-option-selected" : ""}`}
                        onClick={() => handleOptionClick(qIdx, oIdx)}
                      >
                        <span className="cap-option-letter">{OPTION_LETTERS[oIdx]}</span>
                        <span>{optText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed submit footer */}
      <div className="cap-footer">
        <p className="cap-footer-hint">
          <strong>{answeredCount}</strong> of {totalQuestions} questions answered
          {!allAnswered && (
            <span> — answer all questions to submit</span>
          )}
        </p>
        <button
          className="cap-submit-btn"
          disabled={!allAnswered || isSubmitting}
          onClick={handleSubmit}
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
};

export default CapstonePage;
