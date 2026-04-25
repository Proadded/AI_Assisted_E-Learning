/**
 * DashboardPage.jsx
 *
 * Student Performance Dashboard — Phase 1 implementation.
 * Replaces the current stub: <div>DashboardPage</div>
 *
 * Architecture:
 *  - Reads auth from useAuthStore (existing pattern)
 *  - Reads/fetches student context from useStudentContextStore (new)
 *  - Charts rendered via Recharts (install: npm install recharts)
 *  - Socket.IO listener for real-time updates wired up in useEffect
 *  - Matches LearnMind design system CSS variables (--ivory, --amber, --charcoal, etc.)
 *
 * Phase 2 will add: FingerprintInsightPanel, Socket.IO live refresh
 * Phase 3 will add: date filters, difficulty filter, CourseProgressCard
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { io } from "socket.io-client";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ReferenceLine,
  AreaChart, Area, ResponsiveContainer,
} from "recharts";
import useAuthStore from "../store/useAuthStore.js";
import useStudentContextStore from "../store/useStudentContextStore.js";
import useCapstoneStore from "../store/useCapstoneStore.js";
import FingerprintInsightPanel from "./FingerprintInsightPanel.jsx";
import CapstoneStatusCard from "./CapstoneStatusCard.jsx";
import axiosInstance from "../lib/axios.js";

// ─── Design tokens (match PROJECT_STATE.md CSS variables) ─────────────────
const T = {
  ivory:      "#F7F5F0",
  ivoryDark:  "#EDE9E1",
  charcoal:   "#2A2723",
  ink:        "#1A1815",
  amber:      "#D4860A",
  amberLight: "#F0A830",
  amberPale:  "#FDF3E1",
  warmGrey:   "#C8C2B8",
  textMuted:  "#7A756D",
  textBody:   "#4A4540",
  border:     "rgba(42,39,35,0.1)",
  passGreen:  "#27AE60",
  failGrey:   "#7A756D",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .db-root {
    font-family: 'DM Sans', sans-serif;
    color: ${T.textBody};
    background: ${T.ivory};
    min-height: 100vh;
    padding: var(--navbar-height, 72px) 24px 80px;
  }

  /* ── Scores two-column grid ── */
  .dp-scores-grid {
    display: grid;
    grid-template-columns: 70fr 30fr;
    gap: 24px;
    align-items: stretch;
    margin-bottom: 20px;
  }
  .dp-scores-left {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .dp-chart-wrapper {
    flex: 1;
    min-height: 240px;
    width: 100%;
  }
  .dp-scores-grid > .db-panel { margin-bottom: 0; }
  .dp-scores-stat-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (max-width: 768px) {
    .dp-scores-grid {
      grid-template-columns: 1fr;
    }
  }
  .db-root * { box-sizing: border-box; }

  /* ── Header ── */
  .db-header { margin-bottom: 36px; }
  .db-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    color: ${T.charcoal};
    margin-bottom: 4px;
  }
  .db-subtitle { font-size: 14px; color: ${T.textMuted}; }

  /* ── KPI row ── */
  .db-kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 36px;
  }
  .db-kpi {
    background: ${T.ivoryDark};
    border-radius: 12px;
    padding: 18px 20px;
    border: 1px solid ${T.border};
  }
  .db-kpi-label { font-size: 11px; font-weight: 500; color: ${T.textMuted}; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  .db-kpi-value { font-size: 28px; font-weight: 600; color: ${T.charcoal}; line-height: 1; }
  .db-kpi-sub   { font-size: 12px; color: ${T.textMuted}; margin-top: 4px; }
  .db-kpi-value.amber { color: ${T.amber}; }
  .db-kpi-value.green { color: ${T.passGreen}; }

  /* ── Course selector ── */
  .db-course-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }
  .db-course-tab {
    padding: 6px 16px;
    border-radius: 999px;
    border: 1.5px solid ${T.border};
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: ${T.textMuted};
    cursor: pointer;
    transition: all .15s;
  }
  .db-course-tab:hover { border-color: ${T.amber}; color: ${T.amber}; }
  .db-course-tab.active {
    background: ${T.amber};
    border-color: ${T.amber};
    color: #fff;
    font-weight: 500;
  }

  /* ── Panel cards ── */
  .db-panel {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    border: 1px solid ${T.border};
    margin-bottom: 20px;
  }
  .db-panel-title {
    font-size: 14px;
    font-weight: 600;
    color: ${T.charcoal};
    margin-bottom: 4px;
  }
  .db-panel-desc { font-size: 12px; color: ${T.textMuted}; margin-bottom: 20px; }

  /* ── Chart helpers ── */
  .db-chart-wrap { width: 100%; height: 240px; }

  /* ── Trend badge ── */
  .db-trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
  }
  .db-trend.improving { background: #E8F8EF; color: ${T.passGreen}; }
  .db-trend.declining { background: #FDF0ED; color: #C0392B; }
  .db-trend.stable    { background: ${T.amberPale}; color: ${T.amber}; }
  .db-trend.na        { background: ${T.ivoryDark}; color: ${T.textMuted}; }

  /* ── Proficiency badge ── */
  .db-prof {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
  }
  .db-prof.Mastery    { background: #E8F8EF; color: ${T.passGreen}; }
  .db-prof.Proficient { background: ${T.amberPale}; color: ${T.amber}; }
  .db-prof.Developing { background: #FDF0ED; color: #C0392B; }
  .db-prof.Beginner   { background: ${T.ivoryDark}; color: ${T.textMuted}; }

  /* ── Empty state ── */
  .db-empty {
    text-align: center;
    padding: 60px 20px;
    color: ${T.textMuted};
  }
  .db-empty-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: ${T.charcoal}; margin-bottom: 8px; }
  .db-empty-sub { font-size: 14px; }

  /* ── Skeleton ── */
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .db-skeleton {
    background: linear-gradient(90deg, ${T.ivoryDark} 25%, ${T.border} 50%, ${T.ivoryDark} 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }

  /* ── Custom tooltip ── */
  .db-tooltip {
    background: ${T.charcoal};
    color: ${T.ivory};
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-family: 'DM Sans', sans-serif;
  }
  .db-tooltip-label { font-size: 11px; color: ${T.warmGrey}; margin-bottom: 2px; }

  /* DP course pills + chart empty */
  .dp-course-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .dp-course-pill { padding: 6px 16px; border-radius: 999px; border: 1.5px solid var(--border); background: transparent; color: var(--text-body); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
  .dp-course-pill:hover { border-color: var(--amber); color: var(--charcoal); }
  .dp-course-pill.active { background: var(--amber); border-color: var(--amber); color: var(--ivory); font-weight: 500; }
  .dp-chart-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 14px; font-family: 'DM Sans', sans-serif; }

  /* dp-filter-bar UI controls */
  .dp-filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .dp-filter-label {
    font-size: 12px;
    color: var(--text-muted);
    font-family: DM Sans, sans-serif;
    white-space: nowrap;
  }
  .dp-filter-input {
    font-size: 13px;
    font-family: DM Sans, sans-serif;
    color: var(--text-body);
    background: var(--ivory);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 10px;
    outline: none;
    cursor: pointer;
  }
  .dp-filter-input:focus {
    border-color: var(--amber);
  }
  .dp-filter-reset {
    font-size: 12px;
    color: var(--amber);
    background: none;
    border: none;
    cursor: pointer;
    font-family: DM Sans, sans-serif;
    padding: 0;
    text-decoration: underline;
  }

  /* dp-progress-section */
  .dp-progress-section {
    margin-bottom: 32px;
  }
  .dp-progress-section-title {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: var(--ink);
    margin-bottom: 16px;
    font-weight: 400;
  }
  .dp-progress-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .dp-progress-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .dp-progress-card-title {
    font-family: DM Sans, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-body);
    text-align: center;
    line-height: 1.4;
  }
  .dp-progress-ring-wrap {
    position: relative;
    width: 88px;
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dp-progress-ring-label {
    position: absolute;
    font-family: DM Mono, monospace;
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
    text-align: center;
    line-height: 1;
  }
  .dp-progress-meta {
    font-family: DM Sans, sans-serif;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
  }
  .dp-progress-tests-passed {
    font-family: DM Sans, sans-serif;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
  }
`;

// ─── Sub-components ────────────────────────────────────────────────────────

const TrendBadge = ({ trend }) => {
  const labels = {
    improving:        "↑ Improving",
    declining:        "↓ Declining",
    stable:           "→ Stable",
    insufficient_data: "—  Not enough data",
  };
  return (
    <span className={`db-trend ${trend === "insufficient_data" ? "na" : trend}`}>
      {labels[trend] || "—"}
    </span>
  );
};

const ProficiencyBadge = ({ level }) => {
  if (!level) return null;
  return <span className={`db-prof ${level}`}>{level}</span>;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isPass = d.score >= 70;
  return (
    <div className="db-tooltip">
      <div className="db-tooltip-label">{d.label}</div>
      <div style={{ fontWeight: 500, fontSize: 14 }}>{d.score}%</div>
      <div style={{ color: isPass ? "#6DD49E" : T.warmGrey, fontSize: 11 }}>
        {isPass ? "Passed" : "Failed"}{d.difficulty ? ` · ${d.difficulty}` : ""}
      </div>
    </div>
  );
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <div className="db-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ fontWeight: p.dataKey === "score" ? 500 : 400, fontSize: 13 }}>
          {p.dataKey === "score" ? "Score" : "7-day avg"}: {Math.round(p.value)}%
        </div>
      ))}
    </div>
  );
};

function CourseProgressCard({ courseContext }) {
  const {
    courseId,
    courseTitle,
    enrollment,
    aggregateScore,
  } = courseContext;

  const [realProgress, setRealProgress] = useState(null);

  useEffect(() => {
    axiosInstance.get(`/progress/course/${courseId}`)
      .then(res => setRealProgress(res.data))
      .catch(() => {}); // silent fail — fall back to SCS data
  }, [courseId]);

  const percent = realProgress?.percentComplete ?? enrollment?.completionPercent ?? 0;
  const videosWatched = realProgress?.completedCount ?? enrollment?.videosWatched ?? 0;
  const videosTotal   = realProgress?.totalCount     ?? enrollment?.videosTotal ?? 0;
  const allTestsPassed = enrollment?.allTestsPassed ?? false;

  // SVG circle ring parameters
  const size   = 88;
  const stroke = 7;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className="dp-progress-card">
      <div className="dp-progress-ring-wrap">
        <svg width={size} height={size}>
          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="var(--ivory-dark)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="var(--amber)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className="dp-progress-ring-label">{Math.round(percent)}%</span>
      </div>

      <div className="dp-progress-card-title">
        {courseTitle.length > 28 ? courseTitle.slice(0, 26) + "…" : courseTitle}
      </div>

      <div className="dp-progress-meta">
        {videosWatched} / {videosTotal} videos
      </div>

      <div className="dp-progress-tests-passed">
        {allTestsPassed
          ? "✓ All tests passed"
          : aggregateScore?.totalAttempts > 0
            ? `${aggregateScore.totalAttempts} test${aggregateScore.totalAttempts !== 1 ? "s" : ""} attempted`
            : "No tests yet"
        }
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { authUser } = useAuthStore();
  const fetchCapstoneStatus = useCapstoneStore((state) => state.fetchStatus);
  const {
    context,
    isLoading,
    error,
    activeFilters,
    fetchContext,
    setFilter,
    getFilteredTestHistory,
    getActiveAggregateScore,
  } = useStudentContextStore();

  const handleResetFilters = () => {
    setFilter("dateFrom", null);
    setFilter("dateTo", null);
    setFilter("difficulty", "all");
  };

  const [capstoneRefreshKey, setCapstoneRefreshKey] = useState(0);

  // Fetch on mount
  useEffect(() => {
    if (authUser?._id) {
      fetchContext(authUser._id);
    }
  }, [authUser?._id]);

  // Sync navbar height to CSS custom property so .db-root padding doesn't overlap
  useEffect(() => {
    const navbar = document.querySelector("nav") || document.querySelector("[class*='nb-']");
    if (navbar) {
      document.documentElement.style.setProperty(
        "--navbar-height",
        navbar.offsetHeight + "px"
      );
    }
  }, []);

  // Real-time context refresh via Socket.IO
  useEffect(() => {
    if (!authUser?._id) return;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:3001", { withCredentials: true });

    socket.on("context:updated", ({ studentId }) => {
      if (studentId === authUser._id.toString()) {
        fetchContext(authUser._id);
      }
    });

    socket.on("capstone:unlocked", ({ studentId, courseId }) => {
      if (studentId === authUser._id.toString()) {
        setCapstoneRefreshKey(k => k + 1);
      }
    });

    return () => {
      socket.off("capstone:unlocked");
      socket.disconnect();
    };
  }, [authUser?._id, context?.courses, fetchContext, fetchCapstoneStatus]);

  // ── Derived data for charts ──
  const filteredTests  = getFilteredTestHistory();
  const aggregateScore = getActiveAggregateScore();

  // Local UI state: selected course for Test Scores section
  const [selectedCourseId, setSelectedCourseId] = useState("all");

  // Filter tests for the local chart based on selectedCourseId
  const selectedFilteredTests = useMemo(() => {
    if (!filteredTests) return [];
    if (selectedCourseId === "all") return filteredTests;
    return filteredTests.filter((t) => String(t.courseId) === String(selectedCourseId));
  }, [filteredTests, selectedCourseId]);

  // Note: Known limitation if history entries do not have difficulty tracking natively yet
  const filtered = selectedFilteredTests.filter(entry => {
    if (activeFilters.dateFrom && new Date(entry.takenAt) < new Date(activeFilters.dateFrom)) return false;
    if (activeFilters.dateTo   && new Date(entry.takenAt) > new Date(activeFilters.dateTo))   return false;
    if (activeFilters.difficulty && activeFilters.difficulty !== "all" && entry.difficulty !== activeFilters.difficulty) return false;
    return true;
  });

  // Bar chart data: one entry per test attempt (filtered by local selection)
  const barData = filtered.map((t, i) => {
    const previousAttempts = filtered.slice(0, i).filter((prev) => prev.videoId === t.videoId).length;
    const attemptSuffix = previousAttempts > 0 ? ` (Att ${previousAttempts + 1})` : "";
    
    return {
      label:      t.videoTitle ? `${t.videoTitle}${attemptSuffix}` : `Test ${i + 1}`,
      score:      t.totalScore ?? 0,
      passed:     t.passed,
      difficulty: t.difficulty,
      takenAt:    t.takenAt,
    };
  });

  // Area chart data: date-grouped with 7-day moving average overlay (filtered by local selection)
  const areaData = buildAreaChartData(filtered);

  // Courses for tab selector
  const courses = context?.courses || [];
  const activeCourse =
    activeFilters.courseId !== "all"
      ? courses.find((c) => c.courseId === activeFilters.courseId)
      : null;

  const selectedFingerprints = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    if (activeFilters.courseId !== "all") {
      const course = courses.find((c) => c.courseId === activeFilters.courseId);
      return course?.fingerprints || [];
    }
    const fpMap = new Map();
    courses.forEach((c) => {
      (c.fingerprints || []).forEach((fp) => {
        const existing = fpMap.get(fp.conceptTag);
        if (!existing) {
          fpMap.set(fp.conceptTag, fp);
        } else {
          const scoreA = fp.fingerprintScore !== null ? fp.fingerprintScore : -1;
          const scoreB = existing.fingerprintScore !== null ? existing.fingerprintScore : -1;
          if (scoreA > scoreB) {
            fpMap.set(fp.conceptTag, fp);
          }
        }
      });
    });
    return Array.from(fpMap.values());
  }, [courses, activeFilters.courseId]);

  // ── Render states ──
  if (isLoading) return <DashboardSkeleton />;
  if (error)     return <DashboardError message={error} />;

  const hasData = filteredTests.length > 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="db-root">

        {/* ── Header ── */}
        <div className="db-header">
          <h1 className="db-title">
            {authUser?.fullName ? `${authUser.fullName.split(" ")[0]}'s Dashboard` : "Dashboard"}
          </h1>
          <p className="db-subtitle">
            {context?.generatedAt
              ? `Last updated ${formatRelativeTime(context.generatedAt)}`
              : "Your learning analytics"}
          </p>
        </div>

        {/* ── KPI cards ── */}
        {context?.summary && (
          <div className="db-kpi-row">
            <KpiCard
              label="Overall Avg"
              value={
                context.summary.overallAverageScore !== null
                  ? `${context.summary.overallAverageScore}%`
                  : "—"
              }
              sub="across all courses"
              highlight={context.summary.overallAverageScore >= 70 ? "amber" : undefined}
            />
            <KpiCard
              label="Tests Taken"
              value={context.summary.totalTestsAttempted}
              sub="completed attempts"
            />
            <KpiCard
              label="Courses"
              value={context.summary.totalCoursesEnrolled}
              sub="enrolled"
            />
            <KpiCard
              label="Concept Gaps"
              value={context.summary.totalConceptualGaps}
              sub="need attention"
            />
          </div>
        )}

        {/* ── Course Progress Overview ── */}
        {context?.courses?.length > 0 && (
          <div className="dp-progress-section">
            <div className="dp-progress-section-title">Course Progress</div>
            <div className="dp-progress-cards">
              {context.courses.map(courseCtx => (
                <CourseProgressCard
                  key={courseCtx.courseId}
                  courseContext={courseCtx}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Course selector ── */}
        {courses.length > 1 && (
          <div className="db-course-tabs">
            <button
              className={`db-course-tab ${activeFilters.courseId === "all" ? "active" : ""}`}
              onClick={() => setFilter("courseId", "all")}
            >
              All Courses
            </button>
            {courses.map((c) => (
              <button
                key={c.courseId}
                className={`db-course-tab ${activeFilters.courseId === c.courseId ? "active" : ""}`}
                onClick={() => setFilter("courseId", c.courseId)}
              >
                {c.courseTitle}
              </button>
            ))}
          </div>
        )}

        <div className="dp-filter-bar">
          <span className="dp-filter-label">From</span>
          <input
            type="date"
            className="dp-filter-input"
            value={activeFilters.dateFrom ? activeFilters.dateFrom.split("T")[0] : ""}
            onChange={e => setFilter("dateFrom", e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
          <span className="dp-filter-label">To</span>
          <input
            type="date"
            className="dp-filter-input"
            value={activeFilters.dateTo ? activeFilters.dateTo.split("T")[0] : ""}
            onChange={e => setFilter("dateTo", e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
          <select
            className="dp-filter-input"
            value={activeFilters.difficulty || "all"}
            onChange={e => setFilter("difficulty", e.target.value === "all" ? "all" : e.target.value)}
          >
            <option value="all">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          {(activeFilters.dateFrom || activeFilters.dateTo || (activeFilters.difficulty && activeFilters.difficulty !== "all")) && (
            <button className="dp-filter-reset" onClick={handleResetFilters}>
              Reset filters
            </button>
          )}
        </div>

        {/* ── Active course meta ── */}
        {activeCourse && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24 }}>
            <ProficiencyBadge level={activeCourse.proficiency} />
            {activeCourse.aggregateScore?.trend && (
              <TrendBadge trend={activeCourse.aggregateScore.trend} />
            )}
            <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 4 }}>
              {activeCourse.enrollment.videosWatched} / {activeCourse.enrollment.videosTotal} videos watched
            </span>
          </div>
        )}

        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Score bar chart + stat cards — two-column grid ── */}
            <div className="dp-course-pills">
              <button className={`dp-course-pill ${selectedCourseId === "all" ? "active" : ""}`} onClick={() => setSelectedCourseId("all")}>All Courses</button>
              {courses.map((course) => (
                <button
                  key={course.courseId}
                  className={`dp-course-pill ${selectedCourseId === course.courseId ? "active" : ""}`}
                  onClick={() => setSelectedCourseId(course.courseId)}
                >
                  {course.courseTitle}
                </button>
              ))}
            </div>

            <div className="dp-scores-grid">
              {/* Left column: bar chart */}
              <div className="db-panel dp-scores-left">
                <div className="db-panel-title">Test Scores</div>
                <div className="db-panel-desc">
                  Each bar is one test attempt — amber = passed, grey = failed · Pass line at 70%
                </div>
                <div className="db-chart-wrap dp-chart-wrapper" style={{ minHeight: 240 }}>
                  {barData.length === 0 ? (
                    <div className="dp-chart-empty">No test results yet for this course.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={barData} margin={{ top: 6, right: 16, bottom: 28, left: 0 }}>
                        <XAxis
                          dataKey="label"
                          tick={{ fill: T.textMuted, fontSize: 10 }}
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                          height={48}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: T.textMuted, fontSize: 10 }}
                          tickFormatter={(v) => `${v}%`}
                          width={36}
                        />
                        <ReferenceLine
                          y={70}
                          stroke={T.warmGrey}
                          strokeDasharray="4 3"
                          label={{ value: "Pass", fill: T.textMuted, fontSize: 10, position: "right" }}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: T.amberPale }} />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                          {barData.map((entry, i) => (
                            <Cell key={i} fill={entry.score >= 70 ? T.amber : T.warmGrey} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Right column: stat cards stacked vertically */}
              {aggregateScore && aggregateScore.averageScore !== null && (
                <div className="dp-scores-stat-col">
                  <KpiCard label="Average Score"  value={`${aggregateScore.averageScore}%`} sub="all attempts" highlight="amber" />
                  <KpiCard label="Highest Score"  value={`${aggregateScore.highestScore}%`} sub="personal best" highlight="green" />
                  <KpiCard label="Pass Rate"      value={`${aggregateScore.passRate}%`} sub="of attempts passed" />
                  <KpiCard label="7-day Avg"      value={`${aggregateScore.movingAverage7d}%`} sub="recent performance" />
                </div>
              )}
            </div>

            {/* ── Performance trend ── */}
            {areaData.length > 1 && (
              <div className="db-panel">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <div className="db-panel-title" style={{ marginBottom: 0 }}>Performance Trend</div>
                  {aggregateScore?.trend && <TrendBadge trend={aggregateScore.trend} />}
                </div>
                <div className="db-panel-desc">
                  Solid line = score · Dashed = 7-day moving average
                </div>
                <div className="db-chart-wrap">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={areaData} margin={{ top: 6, right: 16, bottom: 16, left: 0 }}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={T.amber} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={T.amber} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: T.textMuted, fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: T.textMuted, fontSize: 10 }}
                        tickFormatter={(v) => `${v}%`}
                        width={36}
                      />
                      <ReferenceLine y={70} stroke={T.border} strokeDasharray="4 3" />
                      <Tooltip content={<CustomAreaTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={T.amber}
                        strokeWidth={2}
                        fill="url(#scoreGrad)"
                        dot={{ fill: T.amber, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="movingAvg"
                        stroke={T.warmGrey}
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        fill="none"
                        dot={false}
                        activeDot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        <FingerprintInsightPanel fingerprints={selectedFingerprints} />

        {/* ── Final Exams ── */}
        {context?.courses?.length > 0 && (
          <div className="dp-progress-section">
            <div className="dp-progress-section-title">Final Exams</div>
            <div className="dp-progress-cards">
              {context.courses.map(course => (
                <CapstoneStatusCard
                  key={course.courseId}
                  courseId={course.courseId}
                  courseName={course.courseTitle}
                  refreshKey={capstoneRefreshKey}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ─── Small helper components ───────────────────────────────────────────────

function KpiCard({ label, value, sub, highlight }) {
  return (
    <div className="db-kpi">
      <div className="db-kpi-label">{label}</div>
      <div className={`db-kpi-value ${highlight || ""}`}>{value}</div>
      {sub && <div className="db-kpi-sub">{sub}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="db-empty">
      <div className="db-empty-title">No test results yet</div>
      <div className="db-empty-sub">
        Watch a video and complete a test — your scores will appear here.
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="db-root">
        <div className="db-skeleton" style={{ height: 36, width: "40%", marginBottom: 8 }} />
        <div className="db-skeleton" style={{ height: 16, width: "25%", marginBottom: 36 }} />
        <div className="db-kpi-row">
          {[1,2,3,4].map(i => (
            <div key={i} className="db-skeleton" style={{ height: 88, borderRadius: 12 }} />
          ))}
        </div>
        <div className="db-skeleton" style={{ height: 280, borderRadius: 16, marginBottom: 20 }} />
        <div className="db-skeleton" style={{ height: 280, borderRadius: 16 }} />
      </div>
    </>
  );
}

function DashboardError({ message }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="db-root">
        <div className="db-empty">
          <div className="db-empty-title">Could not load dashboard</div>
          <div className="db-empty-sub">{message || "Please refresh the page."}</div>
        </div>
      </div>
    </>
  );
}

// ─── Data helpers ──────────────────────────────────────────────────────────

/**
 * Builds the data array for the area chart.
 * Groups tests by date (day) and computes a 7-day rolling average.
 */
function buildAreaChartData(tests) {
  if (!tests.length) return [];

  const sorted = [...tests]
    .filter((t) => t.totalScore !== null && t.evaluationStatus === "complete")
    .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));

  if (!sorted.length) return [];

  // Group by day
  const byDay = sorted.reduce((acc, t) => {
    const d = new Date(t.takenAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t.totalScore);
    return acc;
  }, {});

  const points = Object.entries(byDay).map(([date, scores]) => ({
    date,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // Compute 7-day rolling average (window = up to 7 points back)
  return points.map((p, i) => {
    const window = points.slice(Math.max(0, i - 6), i + 1);
    const movingAvg = Math.round(
      window.reduce((a, x) => a + x.score, 0) / window.length
    );
    return { ...p, movingAvg };
  });
}

function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}