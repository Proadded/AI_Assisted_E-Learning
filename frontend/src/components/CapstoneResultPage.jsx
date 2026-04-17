import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useCapstoneStore from "../store/useCapstoneStore.js";

// ─── Injected styles ─────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  /* ── Root ── */
  .cap-result-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--ivory, #faf9f6);
    min-height: 100vh;
    color: var(--text-body, #4a4540);
    padding-bottom: 80px;
  }
  .cap-result-root * { box-sizing: border-box; }

  /* ── Spinner page ── */
  .cap-result-spinner-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
    background: var(--ivory, #faf9f6);
    font-family: 'DM Sans', sans-serif;
  }
  .cap-result-spinner {
    width: 44px;
    height: 44px;
    border: 3px solid var(--border, rgba(42,39,35,0.1));
    border-top-color: var(--amber, #d4860a);
    border-radius: 50%;
    animation: cap-result-spin 0.8s linear infinite;
  }
  @keyframes cap-result-spin { to { transform: rotate(360deg); } }
  .cap-result-spinner-text {
    font-size: 14px;
    color: var(--text-muted, #7a756d);
    font-weight: 500;
  }

  /* ── Error / not found ── */
  .cap-result-error-page {
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
  .cap-result-error-icon { font-size: 36px; }
  .cap-result-error-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    color: var(--charcoal, #1c1917);
    margin: 0;
    font-weight: 400;
  }
  .cap-result-error-body {
    font-size: 14px;
    color: var(--text-muted, #7a756d);
    max-width: 380px;
    line-height: 1.6;
    margin: 0;
  }
  .cap-result-back-btn {
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
  .cap-result-back-btn:hover { border-color: var(--charcoal, #1c1917); }

  /* ── Content wrapper ── */
  .cap-result-content {
    max-width: 860px;
    margin: 0 auto;
    padding: 40px 24px 0;
  }

  /* ── Score hero ── */
  .cap-result-hero {
    border-radius: 20px;
    padding: 36px 32px;
    margin-bottom: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }
  .cap-result-hero--passed {
    background: var(--amber-pale, #fdf3e1);
    border: 1.5px solid var(--amber, #d4860a);
  }
  .cap-result-hero--failed {
    background: var(--ivory-dark, #ede9e1);
    border: 1.5px solid var(--warm-grey, #c8c2b8);
  }
  .cap-result-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted, #7a756d);
    margin: 0;
  }
  .cap-result-score {
    font-family: 'DM Mono', monospace;
    font-size: 72px;
    font-weight: 500;
    line-height: 1;
    color: var(--charcoal, #1c1917);
    letter-spacing: -0.02em;
  }
  .cap-result-score-pct {
    font-family: 'DM Mono', monospace;
    font-size: 32px;
    color: var(--text-muted, #7a756d);
  }
  .cap-result-verdict-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 20px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .cap-result-verdict-badge--passed {
    background: var(--amber, #d4860a);
    color: var(--ivory, #faf9f6);
  }
  .cap-result-verdict-badge--failed {
    background: var(--warm-grey, #c8c2b8);
    color: var(--charcoal, #1c1917);
  }
  .cap-result-hero-msg {
    font-size: 15px;
    color: var(--text-body, #4a4540);
    line-height: 1.55;
    margin: 0;
    max-width: 420px;
  }

  /* ── Cooldown row in hero ── */
  .cap-result-cooldown-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }
  .cap-result-cooldown-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted, #7a756d);
  }
  .cap-result-cooldown-timer {
    font-family: 'DM Mono', monospace;
    font-size: 24px;
    font-weight: 500;
    color: var(--charcoal, #1c1917);
    letter-spacing: 0.04em;
  }

  /* ── Breakdown section ── */
  .cap-result-section-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: var(--charcoal, #1c1917);
    margin: 0 0 20px;
  }
  .cap-result-concept-group {
    margin-bottom: 32px;
  }
  .cap-result-concept-heading {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--amber, #d4860a);
    margin: 0 0 10px;
    padding-left: 4px;
    border-left: 3px solid var(--amber, #d4860a);
    padding-left: 10px;
  }

  /* ── Breakdown table ── */
  .cap-result-table {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--border, rgba(42,39,35,0.1));
    overflow: hidden;
    border-collapse: collapse;
    font-size: 13px;
  }
  .cap-result-table thead {
    background: var(--ivory-dark, #ede9e1);
  }
  .cap-result-table th {
    padding: 10px 14px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted, #7a756d);
    border-bottom: 1px solid var(--border, rgba(42,39,35,0.1));
  }
  .cap-result-table td {
    padding: 12px 14px;
    vertical-align: top;
    line-height: 1.5;
    border-bottom: 1px solid var(--border, rgba(42,39,35,0.1));
  }
  .cap-result-table tr:last-child td {
    border-bottom: none;
  }
  .cap-result-row--even { background: var(--ivory, #faf9f6); }
  .cap-result-row--odd  { background: var(--ivory-dark, #ede9e1); }

  .cap-result-stem {
    color: var(--charcoal, #1c1917);
    font-weight: 500;
    max-width: 340px;
  }
  .cap-result-answer-text {
    color: var(--text-body, #4a4540);
    font-size: 12px;
  }
  .cap-result-answer-text--none {
    color: var(--text-muted, #7a756d);
    font-style: italic;
    font-size: 12px;
  }
  .cap-result-verdict-cell {
    font-size: 16px;
    text-align: center;
    min-width: 36px;
  }
  .cap-result-verdict-correct { color: #27ae60; }
  .cap-result-verdict-wrong   { color: #c0392b; }

  /* ── Actions footer ── */
  .cap-result-actions {
    margin-top: 40px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .cap-result-btn-primary {
    padding: 12px 28px;
    border: none;
    border-radius: 12px;
    background: var(--amber, #d4860a);
    color: var(--ivory, #faf9f6);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.15s ease;
    letter-spacing: 0.02em;
  }
  .cap-result-btn-primary:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }
  .cap-result-btn-primary:disabled {
    background: var(--warm-grey, #c8c2b8);
    cursor: not-allowed;
    transform: none;
  }
  .cap-result-btn-secondary {
    padding: 12px 28px;
    border: 1.5px solid var(--border, rgba(42,39,35,0.1));
    border-radius: 12px;
    background: transparent;
    color: var(--charcoal, #1c1917);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .cap-result-btn-secondary:hover { border-color: var(--charcoal, #1c1917); }
  .cap-result-actions-cooldown-note {
    font-size: 12px;
    color: var(--text-muted, #7a756d);
  }

  @media (max-width: 640px) {
    .cap-result-score { font-size: 52px; }
    .cap-result-hero  { padding: 28px 20px; }
    .cap-result-content { padding: 28px 16px 0; }
    .cap-result-table th,
    .cap-result-table td { padding: 10px; }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toHms = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const CapstoneResultPage = () => {
  const { courseId, sessionId } = useParams();
  const navigate = useNavigate();

  const { fetchResult, result, isLoading, error, clearSession } =
    useCapstoneStore();

  // Countdown tick (for failed + cooldown state)
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!sessionId) return;
    fetchResult(sessionId);
  }, [sessionId, fetchResult]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Render: loading ───────────────────────────────────────────────────────
  if (isLoading && !result) {
    return (
      <div className="cap-result-spinner-page">
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className="cap-result-spinner" />
        <p className="cap-result-spinner-text">Loading your results…</p>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (error && !result) {
    return (
      <div className="cap-result-error-page">
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <span className="cap-result-error-icon">⚠️</span>
        <h1 className="cap-result-error-title">Result Unavailable</h1>
        <p className="cap-result-error-body">{error}</p>
        <button className="cap-result-back-btn" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Unpack result data ────────────────────────────────────────────────────
  const session = result?.result;

  if (!session) {
    return (
      <div className="cap-result-error-page">
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <span className="cap-result-error-icon">📋</span>
        <h1 className="cap-result-error-title">Result Not Found</h1>
        <p className="cap-result-error-body">
          We couldn't find this capstone result. It may have expired.
        </p>
        <button className="cap-result-back-btn" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const passed = session.passed === true;
  const score = session.score ?? 0;
  const cooldownUntil = session.cooldownUntil ?? null;
  const cooldownUntilMs = cooldownUntil ? new Date(cooldownUntil).getTime() : null;
  const inCooldown = cooldownUntilMs && nowMs < cooldownUntilMs;
  const cooldownRemaining = inCooldown ? cooldownUntilMs - nowMs : 0;

  // groupedByConceptTag was removed from the backend response in the explicit schema update
  const grouped = {};
  const conceptTags = Object.keys(grouped);

  // Fallback: if groupedByConceptTag is empty, derive from session.questions
  const allQuestions = session.questions ?? [];
  const renderGroups =
    conceptTags.length > 0
      ? grouped
      : allQuestions.reduce((acc, q) => {
          const tag = q.conceptTag || "General";
          if (!acc[tag]) acc[tag] = [];
          acc[tag].push(q);
          return acc;
        }, {});

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRetake = () => {
    clearSession();
    navigate(`/capstone/${courseId}`);
  };

  const handleDashboard = () => navigate("/dashboard");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="cap-result-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cap-result-content">

        {/* ── Score Hero ── */}
        <div className={`cap-result-hero cap-result-hero--${passed ? "passed" : "failed"}`}>
          <p className="cap-result-eyebrow">Final Exam · Result</p>

          <div>
            <span className="cap-result-score">{score}</span>
            <span className="cap-result-score-pct">%</span>
          </div>

          <span
            className={`cap-result-verdict-badge cap-result-verdict-badge--${
              passed ? "passed" : "failed"
            }`}
          >
            {passed ? "✓ Passed" : "✗ Failed"}
          </span>

          <p className="cap-result-hero-msg">
            {passed
              ? "🎉 Course Complete! You've successfully passed the final exam."
              : "Keep going — review the breakdown below and retake when ready."}
          </p>

          {/* Cooldown timer (only shown if failed and cooldown active) */}
          {!passed && inCooldown && (
            <div className="cap-result-cooldown-row">
              <span className="cap-result-cooldown-label">Retake available in</span>
              <span className="cap-result-cooldown-timer">{toHms(cooldownRemaining)}</span>
            </div>
          )}
        </div>

        {/* ── Per-question breakdown ── */}
        <h2 className="cap-result-section-title">Question Breakdown</h2>

        {Object.entries(renderGroups).map(([tag, questions]) => (
          <div key={tag} className="cap-result-concept-group">
            <p className="cap-result-concept-heading">{tag}</p>
            <table className="cap-result-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Your Answer</th>
                  <th>Correct Answer</th>
                  <th style={{ textAlign: "center" }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => {
                  const isEven = idx % 2 === 0;
                  // Student's selected option text
                  const studentAnswerText =
                    typeof q.studentAnswer === "number" && q.options?.[q.studentAnswer]
                      ? q.options[q.studentAnswer]
                      : null;

                  // Correct answer text — only available if q.isCorrect (student selected it)
                  // or if options contain a marked "correct" field.
                  // Backend strips correctIndex, so we can only confirm which was right
                  // when the student got it correct (their answer IS the correct option).
                  const correctAnswerText = q.isCorrect
                    ? studentAnswerText   // their answer was correct
                    : q.correctAnswer     // backend may optionally include this
                    ?? "—";              // stripped — not available

                  return (
                    <tr
                      key={`${tag}-${idx}`}
                      className={`cap-result-row--${isEven ? "even" : "odd"}`}
                    >
                      <td className="cap-result-stem">{q.stem}</td>
                      <td>
                        {studentAnswerText ? (
                          <span className="cap-result-answer-text">{studentAnswerText}</span>
                        ) : (
                          <span className="cap-result-answer-text--none">Not answered</span>
                        )}
                      </td>
                      <td>
                        <span className="cap-result-answer-text">{correctAnswerText}</span>
                      </td>
                      <td className="cap-result-verdict-cell">
                        {q.isCorrect ? (
                          <span className="cap-result-verdict-correct">✓</span>
                        ) : (
                          <span className="cap-result-verdict-wrong">✗</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* ── Action buttons ── */}
        <div className="cap-result-actions">
          {passed ? (
            <button className="cap-result-btn-primary" onClick={handleDashboard}>
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button className="cap-result-btn-secondary" onClick={handleDashboard}>
                Dashboard
              </button>

              {inCooldown ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <button className="cap-result-btn-primary" disabled>
                    Retake Exam
                  </button>
                  <span className="cap-result-actions-cooldown-note">
                    Retake unlocks in {toHms(cooldownRemaining)}
                  </span>
                </div>
              ) : (
                <button className="cap-result-btn-primary" onClick={handleRetake}>
                  Retake Exam →
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CapstoneResultPage;
