import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import useCourseStore from "../store/useCourseStore.js";
import { extractYouTubeId } from "../lib/utils.js";
import toast from "react-hot-toast";
import TestPanel from "../components/TestPanel.jsx";

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .cdp-root {
    --ivory:        #F7F5F0;
    --ivory-dark:   #EDE9E1;
    --ivory-mid:    #F2EFE8;
    --charcoal:     #2A2723;
    --ink:          #1A1815;
    --text-body:    #4A4540;
    --text-muted:   #7A756D;
    --warm-grey:    #C8C2B8;

    --amber:        #D4860A;
    --amber-light:  #F0A830;
    --amber-pale:   #FDF3E1;
    --amber-border: rgba(212,134,10,0.2);

    --border:       rgba(42,39,35,0.09);
    --border-focus: rgba(212,134,10,0.45);

    --radius:    16px;
    --radius-sm: 8px;

    --shadow-sm: 0 1px 3px rgba(26,24,21,0.06), 0 1px 2px rgba(26,24,21,0.04);
    --shadow-md: 0 4px 16px rgba(26,24,21,0.08), 0 2px 6px rgba(26,24,21,0.05);
    --shadow-lg: 0 24px 64px rgba(26,24,21,0.1), 0 8px 24px rgba(26,24,21,0.06);

    font-family: 'DM Sans', sans-serif;
    background: var(--ivory);
    color: var(--text-body);
    min-height: 100vh;
  }

  /* ── Page shell ── */
  .cdp-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 48px 40px 80px;
  }

  /* ── Header ── */
  .cdp-header {
    margin-bottom: 32px;
  }
  .cdp-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 10px;
  }
  .cdp-title {
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    font-weight: 400;
    color: var(--ink);
    line-height: 1.15;
    letter-spacing: -0.6px;
    margin: 0 0 20px;
  }

  /* ── Progress bar ── */
  .cdp-progress-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .cdp-progress-track {
    flex: 1;
    height: 5px;
    background: var(--ivory-dark);
    border-radius: 3px;
    overflow: hidden;
  }
  .cdp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--amber) 0%, var(--amber-light) 100%);
    border-radius: 3px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cdp-progress-text {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    letter-spacing: 0.5px;
  }

  /* ── Main layout ── */
  .cdp-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 28px;
    margin-top: 32px;
    align-items: start;
  }

  /* ── Player panel ── */
  .cdp-player-panel {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .cdp-player-video-wrap {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    background: var(--charcoal);
  }
  .cdp-player-video-wrap > div {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .cdp-player-video-wrap iframe {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
  }
  .cdp-player-placeholder {
    aspect-ratio: 16/9;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: var(--ivory-mid);
    color: var(--text-muted);
  }
  .cdp-player-placeholder-icon {
    width: 48px;
    height: 48px;
    background: var(--ivory-dark);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cdp-player-placeholder-text {
    font-size: 13px;
    color: var(--text-muted);
    letter-spacing: -0.1px;
  }
  .cdp-lesson-meta {
    padding: 18px 22px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .cdp-lesson-meta-index {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 1.5px;
    color: var(--amber);
    margin-top: 3px;
    flex-shrink: 0;
  }
  .cdp-lesson-meta-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.4;
    letter-spacing: -0.2px;
  }
  .cdp-lesson-meta-duration {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 3px;
    font-family: 'DM Mono', monospace;
  }

  /* ── Lesson sidebar ── */
  .cdp-lesson-panel {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .cdp-lesson-panel-header {
    padding: 16px 18px 14px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cdp-lesson-panel-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .cdp-lesson-panel-count {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--warm-grey);
    letter-spacing: 0.5px;
  }
  .cdp-lesson-list {
    overflow-y: auto;
    max-height: 520px;
    padding: 8px 0;
  }
  .cdp-lesson-list::-webkit-scrollbar { width: 4px; }
  .cdp-lesson-list::-webkit-scrollbar-track { background: transparent; }
  .cdp-lesson-list::-webkit-scrollbar-thumb {
    background: var(--warm-grey);
    border-radius: 2px;
  }

  .cdp-lesson-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    cursor: pointer;
    border-left: 2.5px solid transparent;
    transition: background 0.15s ease, border-color 0.15s ease;
    position: relative;
  }
  .cdp-lesson-item:hover {
    background: var(--ivory);
  }
  .cdp-lesson-item.cdp-active {
    border-left-color: var(--amber);
    background: var(--amber-pale);
  }
  .cdp-lesson-icon {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.15s;
  }
  .cdp-lesson-icon-pending {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1.5px solid var(--warm-grey);
    background: transparent;
    flex-shrink: 0;
    transition: border-color 0.15s;
  }
  .cdp-lesson-item:hover .cdp-lesson-icon-pending {
    border-color: var(--amber);
  }
  .cdp-lesson-icon-done {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--amber) 0%, var(--amber-light) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(212,134,10,0.3);
  }
  .cdp-lesson-info { flex: 1; min-width: 0; }
  .cdp-lesson-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.1px;
    line-height: 1.4;
  }
  .cdp-lesson-item.cdp-active .cdp-lesson-title {
    color: var(--charcoal);
    font-weight: 600;
  }
  .cdp-lesson-duration {
    font-family: 'DM Mono', monospace;
    font-size: 10.5px;
    color: var(--text-muted);
    margin-top: 2px;
    letter-spacing: 0.3px;
  }

  /* ── Utility ── */
  .cdp-empty {
    padding: 32px 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }
  .cdp-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .cdp-loading-dot {
    display: inline-block;
    animation: cdp-blink 1.2s infinite;
  }
  .cdp-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .cdp-loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes cdp-blink {
    0%, 80%, 100% { opacity: 0.2; }
    40%           { opacity: 1; }
  }

  /* ── Responsive ── */
  @media (max-width: 860px) {
    .cdp-layout {
      grid-template-columns: 1fr;
    }
    .cdp-lesson-list {
      max-height: 340px;
    }
  }
  @media (max-width: 600px) {
    .cdp-page { padding: 24px 16px 60px; }
    .cdp-title { font-size: 26px; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// ─── YouTube Player ───────────────────────────────────────────────────────────
const VideoPlayer = ({ videoId, onProgress }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const hasFiredRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    hasFiredRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                try {
                  const current = playerRef.current.getCurrentTime();
                  const duration = playerRef.current.getDuration();
                  if (duration > 0 && current / duration >= 0.9 && !hasFiredRef.current) {
                    hasFiredRef.current = true;
                    clearInterval(intervalRef.current);
                    onProgress(videoId);
                  }
                } catch (e) {
                  clearInterval(intervalRef.current);
                }
              }, 2000);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  return (
    <div className="cdp-player-video-wrap">
      <div ref={containerRef} />
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const CourseProgressBar = ({ completedCount, totalCount }) => {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return (
    <div className="cdp-progress-wrap">
      <div className="cdp-progress-track">
        <div className="cdp-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="cdp-progress-text">
        {completedCount}/{totalCount} &nbsp;·&nbsp; {percent}%
      </div>
    </div>
  );
};

// ─── Lesson List ──────────────────────────────────────────────────────────────
const LessonList = ({ lessons = [], activeLessonIndex, completedVideoIds, onSelect }) => (
  <div className="cdp-lesson-list">
    {lessons.length === 0 && (
      <div className="cdp-empty">No lessons available yet.</div>
    )}
    {lessons.map((lesson, i) => {
      const done = completedVideoIds.has(lesson._id);
      const active = i === activeLessonIndex;
      return (
        <div
          key={lesson._id}
          className={`cdp-lesson-item${active ? " cdp-active" : ""}`}
          onClick={() => onSelect(i)}
        >
          {done ? (
            <div className="cdp-lesson-icon-done">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2.5 5.5l2.2 2.2 3.8-3.8"
                  stroke="#fff" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className="cdp-lesson-icon-pending" />
          )}
          <div className="cdp-lesson-info">
            <div className="cdp-lesson-title">{lesson.title}</div>
            <div className="cdp-lesson-duration">{formatDuration(lesson.duration)}</div>
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const CourseDetailPage = () => {
  const { courseId } = useParams();
  const {
    courseMetadata, lessons, isLoading,
    completedVideoIds, activeLessonIndex,
    progressSummary,
    fetchCourse, resetCourse, setActiveLesson,
    markLessonComplete
  } = useCourseStore();

  useEffect(() => {
    fetchCourse(courseId);
    return () => resetCourse();
  }, [courseId, fetchCourse, resetCourse]);

  if (isLoading) return (
    <div className="cdp-root">
      <style>{CSS}</style>
      <div className="cdp-loading">
        Loading
        <span className="cdp-loading-dot">.</span>
        <span className="cdp-loading-dot">.</span>
        <span className="cdp-loading-dot">.</span>
      </div>
    </div>
  );

  const activeLesson = lessons[activeLessonIndex];
  const activeVideoId = activeLesson ? extractYouTubeId(activeLesson.youtubeUrl) : null;

  return (
    <div className="cdp-root">
      <style>{CSS}</style>
      <div className="cdp-page">

        {/* Header */}
        <div className="cdp-header">
          <div className="cdp-eyebrow">Course</div>
          <h1 className="cdp-title">{courseMetadata?.title || "Untitled Course"}</h1>
          <CourseProgressBar
            completedCount={progressSummary.completedCount}
            totalCount={progressSummary.totalCount}
          />
        </div>

        {/* Body */}
        <div className="cdp-layout">

          {/* Player */}
          <div className="cdp-player-panel">
            {activeVideoId ? (
              <VideoPlayer
                videoId={activeVideoId}
                onProgress={() => markLessonComplete(activeLesson._id)}
              />
            ) : (
              <div className="cdp-player-placeholder">
                <div className="cdp-player-placeholder-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 5.5l8 4.5-8 4.5V5.5z"
                      fill="#C8C2B8" />
                  </svg>
                </div>
                <span className="cdp-player-placeholder-text">
                  Select a lesson to begin
                </span>
              </div>
            )}
            {activeLesson && (
              <TestPanel
                videoId={activeLesson._id}
                onTestPassed={() => {
                  toast.success("Test passed! You can continue to the next lesson.");
                }}
              />
            )}
            {activeLesson && (
              <div className="cdp-lesson-meta">
                <div className="cdp-lesson-meta-index">
                  {String(activeLessonIndex + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="cdp-lesson-meta-title">{activeLesson.title}</div>
                  <div className="cdp-lesson-meta-duration">
                    {formatDuration(activeLesson.duration)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lesson sidebar */}
          <div className="cdp-lesson-panel">
            <div className="cdp-lesson-panel-header">
              <span className="cdp-lesson-panel-label">Lessons</span>
              <span className="cdp-lesson-panel-count">
                {progressSummary.completedCount} / {progressSummary.totalCount} done
              </span>
            </div>
            <LessonList
              lessons={lessons}
              activeLessonIndex={activeLessonIndex}
              completedVideoIds={completedVideoIds}
              onSelect={setActiveLesson}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;