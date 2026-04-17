import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useCapstoneStore from "../store/useCapstoneStore.js";

// ─── Design system token fallbacks ────────────────────────────────────────────
// All colours reference CSS variables; hard-coded values are fallbacks only.

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  /* ── Skeleton (matches DashboardPage db-skeleton pattern) ── */
  @keyframes csc-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .csc-skeleton {
    background: linear-gradient(
      90deg,
      var(--ivory-dark, #ede9e1) 25%,
      var(--border,      rgba(42,39,35,0.1)) 50%,
      var(--ivory-dark, #ede9e1) 75%
    );
    background-size: 800px 100%;
    animation: csc-shimmer 1.4s infinite;
    border-radius: 8px;
  }
  .csc-skeleton-wrap {
    border-radius: 14px;
    padding: 18px;
    border: 1px solid var(--border, #e5e2da);
    background: var(--ivory, #faf9f6);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Shared card base ── */
  .csc-card {
    border-radius: 14px;
    padding: 20px 22px;
    border: 1.5px solid var(--border, #e5e2da);
    background: var(--ivory, #faf9f6);
    font-family: 'DM Sans', sans-serif;
    transition: box-shadow 0.2s ease;
  }

  /* ── State modifiers ── */
  .csc-card--passed {
    background: var(--amber-pale, #fdf3e1);
    border-color: var(--amber, #d4860a);
  }
  .csc-card--cooldown {
    background: var(--amber-pale, #fdf3e1);
    border-color: var(--amber, #d4860a);
  }
  .csc-card--available {
    background: var(--ivory, #faf9f6);
    border-color: var(--amber, #d4860a);
  }
  .csc-card--locked {
    background: var(--ivory-dark, #ede9e1);
    border-color: var(--warm-grey, #c8c2b8);
  }

  /* ── Label above title ── */
  .csc-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted, #7a756d);
    margin: 0 0 6px;
  }

  /* ── Title / headline ── */
  .csc-title {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: var(--charcoal, #1c1917);
    line-height: 1.3;
  }

  /* ── Sub-body text ── */
  .csc-body {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-body, #4a4540);
  }

  /* ── "Course Complete ✓" badge (passed state) ── */
  .csc-complete-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 5px 14px;
    border-radius: 999px;
    background: var(--amber, #d4860a);
    color: var(--ivory, #faf9f6);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  /* ── Countdown timer (DM Mono) ── */
  .csc-timer-label {
    margin: 10px 0 4px;
    font-size: 12px;
    color: var(--text-muted, #7a756d);
    font-weight: 500;
  }
  .csc-timer {
    font-family: 'DM Mono', monospace;
    font-size: 22px;
    font-weight: 500;
    color: var(--charcoal, #1c1917);
    letter-spacing: 0.04em;
    margin: 0 0 8px;
    line-height: 1.2;
  }

  /* ── "Last score" line ── */
  .csc-last-score {
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-muted, #7a756d);
  }

  /* ── CTA button / link ── */
  .csc-cta {
    display: inline-block;
    margin-top: 14px;
    padding: 10px 18px;
    border-radius: 10px;
    background: var(--amber, #d4860a);
    color: var(--ivory, #faf9f6);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    cursor: pointer;
  }
  .csc-cta:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  /* ── Locked icon ── */
  .csc-lock-icon {
    font-size: 18px;
    margin-bottom: 6px;
    display: block;
    color: var(--warm-grey, #c8c2b8);
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toHms = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const CapstoneStatusCard = ({ courseId, courseName, refreshKey }) => {
  const { fetchStatus, status, isLoading } = useCapstoneStore();
  // Separate local tick so we don't re-render the whole store on every second
  const [nowMs, setNowMs] = useState(Date.now());

  // 1. Fetch status on mount
  useEffect(() => {
    if (!courseId) return;
    fetchStatus(courseId);
  }, [courseId, fetchStatus, refreshKey]);

  // 2. Countdown tick — always active, only rendered in cooldown state
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Derive display state ────────────────────────────────────────────────────
  const inCooldown =
    status?.cooldownUntil && Date.now() < new Date(status.cooldownUntil).getTime();

  // State resolution (priority order matches spec)
  let displayState = "locked"; // default
  if (!status) {
    displayState = isLoading ? "loading" : "locked";
  } else if (isLoading) {
    displayState = "loading";
  } else if (status.capstonePassed === true) {
    displayState = "passed";
  } else if (inCooldown) {
    displayState = "cooldown";
  } else if (status.unlocked === true) {
    displayState = "available";
  } else {
    displayState = "locked";
  }

  // Cooldown remaining (recomputed every tick via nowMs)
  const cooldownRemaining =
    status?.cooldownUntil
      ? new Date(status.cooldownUntil).getTime() - nowMs
      : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  // State 1 — skeleton
  if (displayState === "loading") {
    return (
      <div className="csc-skeleton-wrap">
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className="csc-skeleton" style={{ height: 12, width: "40%" }} />
        <div className="csc-skeleton" style={{ height: 18, width: "65%" }} />
        <div className="csc-skeleton" style={{ height: 12, width: "55%", marginTop: 4 }} />
        <div className="csc-skeleton" style={{ height: 36, width: "45%", borderRadius: 10, marginTop: 8 }} />
      </div>
    );
  }

  return (
    <div className={`csc-card csc-card--${displayState}`}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* State 2 — passed */}
      {displayState === "passed" && (
        <>
          <p className="csc-eyebrow">Final Exam{courseName ? ` · ${courseName}` : ""}</p>
          <p className="csc-title">You've completed this course</p>
          <span className="csc-complete-badge">Course Complete ✓</span>
        </>
      )}

      {/* State 3 — cooldown */}
      {displayState === "cooldown" && (
        <>
          <p className="csc-eyebrow">Final Exam{courseName ? ` · ${courseName}` : ""}</p>
          <p className="csc-title">Retake on cooldown</p>
          <p className="csc-timer-label">Retake available in</p>
          <div className="csc-timer">{toHms(cooldownRemaining)}</div>
          {status?.lastAttempt && (
            <p className="csc-last-score">
              Last score: <strong>{status.lastAttempt.score}%</strong>
            </p>
          )}
        </>
      )}

      {/* State 4 — available */}
      {displayState === "available" && (
        <>
          <p className="csc-eyebrow">Final Exam{courseName ? ` · ${courseName}` : ""}</p>
          <p className="csc-title">Final Exam Ready</p>
          <p className="csc-body">You've unlocked the capstone. Good luck!</p>
          {status?.lastAttempt && (
            <p className="csc-last-score">
              Last score: <strong>{status.lastAttempt.score}%</strong>
            </p>
          )}
          <Link className="csc-cta" to={`/capstone/${courseId}`}>
            Start Final Exam →
          </Link>
        </>
      )}

      {/* State 5 — locked (default) */}
      {displayState === "locked" && (
        <>
          <p className="csc-eyebrow">Final Exam{courseName ? ` · ${courseName}` : ""}</p>
          <span className="csc-lock-icon" aria-hidden="true">🔒</span>
          <p className="csc-title">Exam Locked</p>
          <p className="csc-body">
            Complete all lessons and tests to unlock the final exam.
          </p>
        </>
      )}
    </div>
  );
};

export default CapstoneStatusCard;
