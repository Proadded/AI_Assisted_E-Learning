import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCapstoneStore from "../store/useCapstoneStore.js";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .csc-card {
    border-radius: 14px;
    padding: 18px;
    border: 1px solid var(--border, #e5e2da);
    background: var(--ivory, #faf9f6);
    font-family: 'DM Sans', sans-serif;
  }

  .csc-title {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 700;
    color: var(--charcoal, #1c1917);
  }

  .csc-subtitle {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--text-muted, #7a756d);
  }

  .csc-body {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-body, #4a4540);
  }

  .csc-locked {
    background: var(--ivory-dark, #ede9e1);
    border-color: var(--border, #e5e2da);
  }

  .csc-cooldown {
    background: var(--amber-pale, #fdf3e1);
    border-color: var(--amber, #d4860a);
  }

  .csc-available {
    background: var(--ivory, #faf9f6);
    border: 1.5px solid var(--amber, #d4860a);
  }

  .csc-passed {
    background: var(--amber-pale, #fdf3e1);
    border-color: var(--amber, #d4860a);
  }

  .csc-timer {
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    font-weight: 500;
    color: var(--charcoal, #1c1917);
    letter-spacing: 0.03em;
    margin: 2px 0 8px;
  }

  .csc-btn {
    margin-top: 12px;
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    background: var(--amber, #d4860a);
    color: var(--ivory, #faf9f6);
    transition: opacity 0.15s ease;
  }

  .csc-btn:hover {
    opacity: 0.9;
  }

  .csc-last-score {
    margin-top: 8px;
    font-size: 13px;
    color: var(--text-muted, #7a756d);
  }

  .csc-complete {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--charcoal, #1c1917);
  }
`;

const toHms = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const CapstoneStatusCard = ({ courseId, courseName }) => {
  const navigate = useNavigate();
  const { status, isLoading, fetchStatus } = useCapstoneStore();
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!courseId) return;
    fetchStatus(courseId);
  }, [courseId, fetchStatus]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const mode = useMemo(() => {
    if (!status) return "locked";
    if (status.passed) return "passed";
    const cooldownUntilMs = status.cooldownUntil ? new Date(status.cooldownUntil).getTime() : null;
    if (cooldownUntilMs && cooldownUntilMs > nowMs) return "cooldown";
    if (status.unlocked) return "available";
    return "locked";
  }, [status, nowMs]);

  const cooldownText = useMemo(() => {
    if (!status?.cooldownUntil) return "00:00:00";
    const left = new Date(status.cooldownUntil).getTime() - nowMs;
    return toHms(left);
  }, [status?.cooldownUntil, nowMs]);

  return (
    <div className={`csc-card csc-${mode}`}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <p className="csc-title">Final Exam {courseName ? `- ${courseName}` : ""}</p>

      {isLoading ? (
        <p className="csc-body">Loading capstone status...</p>
      ) : null}

      {!isLoading && mode === "locked" ? (
        <p className="csc-body">Complete all lessons and tests to unlock the final exam.</p>
      ) : null}

      {!isLoading && mode === "cooldown" ? (
        <>
          <p className="csc-subtitle">Retake available in</p>
          <div className="csc-timer">{cooldownText}</div>
        </>
      ) : null}

      {!isLoading && mode === "available" ? (
        <>
          <p className="csc-body">You are eligible to attempt the final exam.</p>
          <button className="csc-btn" onClick={() => navigate(`/capstone/${courseId}`)}>
            Start Final Exam
          </button>
          {typeof status?.lastScore === "number" ? (
            <p className="csc-last-score">Last attempt: {status.lastScore}%</p>
          ) : null}
        </>
      ) : null}

      {!isLoading && mode === "passed" ? (
        <p className="csc-complete">Course Complete ✓</p>
      ) : null}
    </div>
  );
};

export default CapstoneStatusCard;
