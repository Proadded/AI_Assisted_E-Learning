# LearnMind — Student Performance Dashboard
## Implementation Design Document

**Project:** Student Analytics Dashboard + Student Context System + Fingerprint Integration
**Platform:** LearnMind (AI-Assisted E-Learning — `learnmind`)
**Version:** 1.0 — Architecture & Implementation Plan
**Date:** 2026-03-31
**Status:** Pre-implementation — for review before any code is written
**Scope:** Backend services, data layer, frontend dashboard, fingerprint algorithm integration

---

## Table of Contents

1. [Executive Summary & Key Assumptions](#1-executive-summary--key-assumptions)
2. [System Architecture](#2-system-architecture)
3. [Data Modelling](#3-data-modelling)
4. [Backend Design](#4-backend-design)
5. [Frontend Design](#5-frontend-design)
6. [Fingerprint Integration Strategy](#6-fingerprint-integration-strategy)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Risks & Considerations](#8-risks--considerations)

---

## 1. Executive Summary & Key Assumptions

### What This Document Defines

This document specifies the complete next phase of development for LearnMind's student-facing analytics layer. It builds on the existing tested and shipped infrastructure described in `PROJECT_STATE.md` and incorporates the Answer Trajectory Fingerprinting system described in `fingerprint_implementation_doc.docx`.

The three coordinated deliverables are:

1. **Student Context System (SCS)** — A centralised, reusable data aggregation layer that collects, normalises, and caches all analytically meaningful data about a student. This is the foundation every other feature in this phase is built on top of.

2. **Student Performance Dashboard** — A `/dashboard` page (currently a stub) that consumes the SCS and presents course-wise scores, performance trends, proficiency indicators, and filtering controls to the student.

3. **Answer Trajectory Fingerprint Integration** — The fingerprint classification system (Conceptual Gap / Uncertain / Careless Error) is wired into the SCS and surfaced in the dashboard as a new "understanding depth" layer, feeding the AI context directly.

### Key Assumptions

The following are assumed true based on the contents of both uploaded documents:

| # | Assumption | Basis |
|---|---|---|
| A1 | The existing `TestResult` and `Progress` collections are the canonical source of test history data. | `PROJECT_STATE.md` — Section 3 |
| A2 | The `fingerprint.model.js` new collection (described in the fingerprint doc, Section 5.2) does not yet exist in the codebase. | Fingerprint doc — Section 5: "A new Mongoose model file **will be created**" |
| A3 | The `Progress.studentId` bug (stores `User._id` but references `Student`) is treated as a known technical debt item, not fixed in this phase, but wrapped behind the SCS abstraction layer. | `PROJECT_STATE.md` — Section 8, Critical Issues #3 |
| A4 | `Socket.IO` (`socket.io ^4.8.1`) is already installed and available for real-time updates — it just needs to be wired up. | `PROJECT_STATE.md` — Section 6 |
| A5 | The `Gemini API` remains the AI provider for any LLM-based analysis. The fingerprint algorithm itself is deterministic (not LLM-based). | Fingerprint doc — Section 4; `PROJECT_STATE.md` — Section 6 |
| A6 | The design system CSS variables (`--ivory`, `--charcoal`, `--amber`, etc.) defined in `PROJECT_STATE.md` Section 7 are the design source of truth and must be respected throughout the dashboard. | `PROJECT_STATE.md` — Section 7 |
| A7 | Questions in `quiz.model.js` do not yet have `conceptTag` or `phrasingSeed` fields. These must be added as described in the fingerprint doc. | Fingerprint doc — Section 5.1 |

---

## 2. System Architecture

### 2.1 High-Level Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          LEARNMIND FRONTEND (React)                         │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    /dashboard (DashboardPage.jsx)                     │  │
│  │                                                                        │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │   │ Score Charts  │  │ Trend Graphs  │  │  Fingerprint Insight Panel│  │  │
│  │   │ (Recharts)    │  │ (Recharts)   │  │  (Custom SVG indicators)  │  │  │
│  │   └──────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  │                                                                        │  │
│  │   ┌──────────────────────────────────────────────────────────────┐   │  │
│  │   │              useStudentContextStore (Zustand)                  │   │  │
│  │   │  Caches: scores, trends, fingerprints, courses, metadata       │   │  │
│  │   └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                          │  Axios (withCredentials)  ▲                       │
│                          │  Socket.IO (real-time)    │                       │
└──────────────────────────┼───────────────────────────┼───────────────────────┘
                           ▼                           │
┌────────────────────────────────────────────────────────────────────────────┐
│                         LEARNMIND BACKEND (Express.js)                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                 Student Context Service (new)                          │  │
│  │                 backend/src/services/studentContext.service.js         │  │
│  │                                                                        │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────┐  │  │
│  │  │ Score Aggregator│  │ Trend Calculator│  │ Fingerprint Recomputer│  │  │
│  │  └────────────────┘  └────────────────┘  └───────────────────────┘  │  │
│  └────────────────────────────────┬─────────────────────────────────────┘  │
│                                   │                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         API Layer (Express Router)                      │ │
│  │  GET /api/student-context/:studentId                                    │ │
│  │  GET /api/dashboard/scores                                              │ │
│  │  GET /api/dashboard/trends                                              │ │
│  │  GET /api/dashboard/fingerprints                                        │ │
│  │  POST /api/fingerprints/recompute/:studentId                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                   │                                          │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │ MongoDB  │ │Gemini API│ │  Socket.IO   │ │ fingerprint  │ │  Progress │  │
│  │Aggregation│ │(AI Labels│ │  (emit on   │ │  algorithm   │ │  model    │  │
│  │Pipelines │ │for tags) │ │  recompute) │ │  (pure fn)  │ │           │  │
│  └─────────┘ └──────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                           │
┌────────────────────────────────────────────────────────────────────────────┐
│                           MONGODB COLLECTIONS                               │
│  User · Student · Course · Video · Test(quiz) · Progress ·                  │
│  TestResult · StudentFingerprint (new)                                       │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Where the Student Context System Fits

The Student Context System (SCS) is **not a database model** — it is a **service layer** that aggregates across existing models. It sits between the raw MongoDB collections and any feature that needs student intelligence.

```
Feature A: Dashboard  ──┐
Feature B: AI Chatbot ──┤──▶ Student Context Service ──▶ MongoDB (aggregated)
Feature C: Instructor ──┘                            └──▶ StudentFingerprint
           Dashboard
```

This ensures the aggregation logic is written once and is reusable. The dashboard is the first consumer; the AI chatbot context injection described in the fingerprint doc is the second.

### 2.3 Data Flow on Dashboard Load

```
1. User navigates to /dashboard
2. DashboardPage mounts → calls useStudentContextStore.fetchContext(userId)
3. Zustand store makes GET /api/student-context/:studentId
4. Backend SCS runs three parallel MongoDB aggregations:
   a. Score history (TestResult → grouped by courseId + date)
   b. Progress state (Progress → per video + test summary)
   c. Fingerprint state (StudentFingerprint → per conceptTag + courseId)
5. SCS assembles a unified StudentContext object and returns it
6. Zustand store caches it under contextByStudentId[id]
7. Dashboard sub-components consume slices of cached context
8. Socket.IO emits 'context:updated' when a new TestResult is committed
9. Dashboard listens → triggers a targeted re-fetch of the affected course slice
```

---

## 3. Data Modelling

### 3.1 Changes to Existing Models

#### `quiz.model.js` — Add Fingerprint Fields to Question Subdocument

Add two optional fields to each question object inside the `Test` schema, exactly as described in the fingerprint doc Section 5.1:

```js
// Inside the questions subdocument array in quiz.model.js
{
  question:      String,
  type:          String,   // enum: ["mcq", "short", "essay"]
  options:       [String],
  correctAnswer: String,

  // NEW FIELDS — required by fingerprint algorithm
  conceptTag:   { type: String, default: null },
  // e.g. "closures", "async-await", "array-methods"
  // Grouping key: all questions testing the same concept share this value
  // across different tests and different videos.

  phrasingSeed: { type: String, default: null },
  // e.g. "closure_scope_variable" (short fingerprint of surface structure)
  // Two questions with same conceptTag but different phrasingSeed = same
  // concept, different wording. Key signal for phrasing variance dimension.
}
```

**Migration note:** Existing documents without these fields will be skipped by the fingerprint algorithm (null check on `conceptTag`). No immediate migration required.

**Seed script update:** `seedTests.js` must populate `conceptTag` and `phrasingSeed` for all new test documents. Gemini's `aiEvaluator.js` is the natural place to auto-generate these during test creation.

#### `testResult.model.js` — Add Timing Data to Answer Subdocument

The fingerprint algorithm needs `fastWrongRatio`: answers submitted under 8 seconds are discounted. Add answer timing to the existing `answerSchema`:

```js
// In answerSchema (inside testResult.model.js)
{
  questionId:          ObjectId,
  questionType:        String,   // "mcq" | "short_answer" | "essay"
  studentAnswer:       String,
  isCorrect:           Boolean,
  aiScore:             Number,
  aiConfidence:        Number,
  aiFeedback:          String,

  // NEW FIELD — required by fastWrongRatio dimension
  responseTimeMs: { type: Number, default: null },
  // Time in milliseconds from question display to answer submission.
  // Populated by the frontend TestPanel on submit. If null, timing
  // discount is not applied (conservative — student is not penalised).
}
```

**Frontend change required:** `TestPanel.jsx` must record `Date.now()` when each question is displayed and compute `responseTimeMs = Date.now() - questionDisplayedAt` before including it in the submission payload.

### 3.2 New Collection: `StudentFingerprint`

Create `backend/src/models/fingerprint.model.js`. This is taken directly from the fingerprint doc Section 5.2, extended with the full set of fields needed by the algorithm:

```js
import mongoose from "mongoose";

const fingerprintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",           // Using User._id (consistent with existing Progress.studentId)
      required: true,
    },
    conceptTag: {
      type: String,
      required: true,        // e.g. "closures", "async-await"
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // === Raw counters (updated incrementally on each test submission) ===
    attempts:          { type: Number, default: 0 },   // total questions answered on this concept
    wrongCount:        { type: Number, default: 0 },   // total wrong answers
    phrasingsTotal:    { type: Number, default: 0 },   // total unique phrasingSeeds encountered
    phrasingsFailed:   { type: Number, default: 0 },   // unique phrasingSeeds student got wrong
    fastWrongCount:    { type: Number, default: 0 },   // wrong answers under 8s threshold
    conceptsRecovered: { type: Number, default: 0 },   // correct after prior failure + feedback
    conceptsFailed:    { type: Number, default: 0 },   // failures that preceded a feedback window

    // === Computed score (recomputed after each update) ===
    fingerprintScore: { type: Number, default: null }, // 0.0 – 1.0 decimal
    classification: {
      type: String,
      enum: ["ConceptualGap", "Uncertain", "CarelessError"],
      default: "Uncertain",
    },

    // === Audit ===
    lastUpdatedFromResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestResult",
    },
    lastComputedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound unique index: one fingerprint per student per concept per course
fingerprintSchema.index(
  { studentId: 1, conceptTag: 1, courseId: 1 },
  { unique: true }
);

export default mongoose.model("StudentFingerprint", fingerprintSchema);
```

### 3.3 Student Context Schema (API Response Shape)

This is the shape of the object returned by `GET /api/student-context/:studentId`. It is not a MongoDB model — it is assembled by the SCS aggregation layer.

```ts
// TypeScript-style definition for clarity

interface StudentContext {
  studentId: string;
  generatedAt: string;       // ISO timestamp

  courses: CourseContext[];  // One entry per enrolled course
  summary: SummaryStats;     // Across all courses
}

interface CourseContext {
  courseId:    string;
  courseTitle: string;
  category:    string;

  enrollment: {
    enrolledAt:         string | null;
    videosTotal:        number;
    videosWatched:      number;
    completionPercent:  number;
    courseComplete:     boolean;
    allTestsPassed:     boolean;
  };

  testHistory: TestSnapshot[];      // One per TestResult, sorted by date ascending
  aggregateScore: ScoreAggregate;   // Computed across all testHistory entries
  proficiency: ProficiencyBand;     // "Beginner" | "Developing" | "Proficient" | "Mastery"

  fingerprints: FingerprintSummary[]; // Per-concept fingerprint classifications
}

interface TestSnapshot {
  resultId:       string;
  testId:         string;
  videoId:        string | null;
  videoTitle:     string | null;
  attemptNumber:  number;
  totalScore:     number;         // 0–100
  passed:         boolean;
  difficulty:     string;         // "beginner" | "intermediate" | "advanced"
  takenAt:        string;         // ISO timestamp (createdAt)
  evaluationStatus: string;
}

interface ScoreAggregate {
  averageScore:    number;   // Mean across all completed TestResults
  highestScore:    number;
  lowestScore:     number;
  movingAverage7d: number;   // Average over the last 7 days
  trend:           "improving" | "declining" | "stable" | "insufficient_data";
  totalAttempts:   number;
  passRate:        number;   // 0–1
}

type ProficiencyBand = "Beginner" | "Developing" | "Proficient" | "Mastery";
// Computed from averageScore:
// < 40  → Beginner
// 40–59 → Developing
// 60–79 → Proficient
// ≥ 80  → Mastery

interface FingerprintSummary {
  conceptTag:       string;
  classification:   "ConceptualGap" | "Uncertain" | "CarelessError";
  fingerprintScore: number | null;
  attempts:         number;
  hasMinimumData:   boolean;   // true if attempts >= 3
  lastComputedAt:   string;
}

interface SummaryStats {
  totalCoursesEnrolled:  number;
  totalTestsAttempted:   number;
  overallAverageScore:   number;
  totalConceptualGaps:   number;
  totalCarelessErrors:   number;
  strongestCourse:       string | null;   // courseId with highest averageScore
  weakestCourse:         string | null;   // courseId with lowest averageScore
}
```

### 3.4 Entity Relationship Overview

```
User (1) ─────────── (1) Student
  │
  ├── (many) TestResult ──────── (1) Test ──── (1) Video ──── (1) Course
  │         │
  │         └── answers[]: { questionId, questionType, responseTimeMs, ... }
  │
  ├── (many) Progress ──────────── (1) Video
  │
  └── (many) StudentFingerprint ── (1) Course
                │
                └── conceptTag (logical link to Test.questions[].conceptTag)
```

---

## 4. Backend Design

### 4.1 New Files to Create

```
backend/src/
├── services/
│   ├── studentContext.service.js     # Core SCS — aggregation orchestrator
│   └── fingerprintEngine.service.js  # Fingerprint algorithm (pure function, testable)
├── models/
│   └── fingerprint.model.js          # StudentFingerprint Mongoose schema (Section 3.2)
├── controllers/
│   ├── studentContext.controller.js  # Thin HTTP layer over SCS
│   └── dashboard.controller.js       # Dashboard-specific sliced endpoints
└── routes/
    ├── studentContext.route.js
    └── dashboard.route.js
```

### 4.2 Student Context Service

`backend/src/services/studentContext.service.js`

This service is the heart of the SCS. It runs all aggregation queries in parallel and assembles the `StudentContext` shape from Section 3.3.

```js
// Pseudocode — illustrates structure, not final implementation

export async function buildStudentContext(userId) {
  // Run all three aggregation pipelines concurrently
  const [testHistory, progressData, fingerprintData] = await Promise.all([
    aggregateTestHistory(userId),       // → grouped by courseId
    aggregateProgressData(userId),      // → grouped by courseId/videoId
    fetchFingerprintData(userId),       // → grouped by courseId/conceptTag
  ]);

  // Fetch course metadata for titles and categories
  const courseIds = [...new Set(testHistory.map(r => r.courseId.toString()))];
  const courses = await Course.find({ _id: { $in: courseIds } });

  // Assemble per-course CourseContext objects
  const courseContexts = courses.map(course => {
    const tests = testHistory.filter(/* by courseId */);
    const progress = progressData[course._id.toString()] || null;
    const fingerprints = fingerprintData[course._id.toString()] || [];

    return {
      courseId:       course._id,
      courseTitle:    course.title,
      category:       course.category,
      enrollment:     buildEnrollment(progress, course),
      testHistory:    tests,
      aggregateScore: computeScoreAggregate(tests),
      proficiency:    computeProficiency(tests),
      fingerprints:   fingerprints,
    };
  });

  return {
    studentId:   userId,
    generatedAt: new Date().toISOString(),
    courses:     courseContexts,
    summary:     buildSummaryStats(courseContexts),
  };
}
```

#### MongoDB Aggregation Pipeline: Test History

```js
// aggregateTestHistory(userId) — runs on TestResult collection
TestResult.aggregate([
  { $match: { studentId: new ObjectId(userId), evaluationStatus: "complete" } },
  { $sort:  { createdAt: 1 } },
  {
    $lookup: {
      from:         "videos",
      localField:   "videoId",
      foreignField: "_id",
      as:           "video",
    }
  },
  { $unwind: { path: "$video", preserveNullAndEmpty: true } },
  {
    $project: {
      courseId:         1,
      videoId:          1,
      "video.title":    1,
      testId:           1,
      totalScore:       1,
      passed:           1,
      attemptNumber:    1,
      evaluationStatus: 1,
      createdAt:        1,
    }
  }
])
```

#### Score Aggregate Computation

```js
// computeScoreAggregate(tests) — runs in memory after fetch
function computeScoreAggregate(tests) {
  const completed = tests.filter(t => t.evaluationStatus === "complete");
  if (!completed.length) return null;

  const scores  = completed.map(t => t.totalScore);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;

  // 7-day moving average
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = completed.filter(t => new Date(t.takenAt) >= sevenDaysAgo);
  const movingAverage7d = recent.length
    ? recent.reduce((a, t) => a + t.totalScore, 0) / recent.length
    : average;

  // Trend: compare last 3 results vs previous 3
  const trend = computeTrend(completed);

  return {
    averageScore:    Math.round(average),
    highestScore:    Math.max(...scores),
    lowestScore:     Math.min(...scores),
    movingAverage7d: Math.round(movingAverage7d),
    trend,
    totalAttempts:   completed.length,
    passRate:        completed.filter(t => t.passed).length / completed.length,
  };
}

function computeTrend(tests) {
  if (tests.length < 4) return "insufficient_data";
  const recent = tests.slice(-3).map(t => t.totalScore);
  const prior  = tests.slice(-6, -3).map(t => t.totalScore);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const priorAvg  = prior.reduce((a, b) => a + b, 0) / prior.length;
  const delta = recentAvg - priorAvg;
  if (delta >  5) return "improving";
  if (delta < -5) return "declining";
  return "stable";
}
```

### 4.3 Fingerprint Engine Service

`backend/src/services/fingerprintEngine.service.js`

This is a **pure function module** — no DB access, no side effects, fully unit-testable. It takes raw counter data and produces a `FingerprintScore` and `classification`.

```js
// Thresholds — stored as constants, easily tunable
const CONCEPTUAL_GAP_THRESHOLD = 0.60;
const CARELESS_ERROR_THRESHOLD = 0.30;
const MINIMUM_ATTEMPTS         = 3;
const FAST_ANSWER_MS_THRESHOLD = 8000;  // 8 seconds, per fingerprint doc Section 4.2

// Weights per fingerprint doc Section 4.2
const W_RECURRENCE  = 0.35;
const W_PHRASING    = 0.30;
const W_RECOVERY    = 0.25;
const W_TIMING      = 0.10;

/**
 * Computes FingerprintScore and classification for a student-concept pair.
 * 
 * @param {Object} counters - Raw counts from StudentFingerprint document
 * @returns {{ fingerprintScore: number|null, classification: string }}
 */
export function computeFingerprint(counters) {
  const {
    attempts,
    wrongCount,
    phrasingsTotal,
    phrasingsFailed,
    fastWrongCount,
    conceptsRecovered,
    conceptsFailed,
  } = counters;

  // Minimum data gate — per fingerprint doc Section 4.4
  if (attempts < MINIMUM_ATTEMPTS) {
    return { fingerprintScore: null, classification: "Uncertain" };
  }

  // Dimension 1: Recurrence rate
  const recurrenceRate = wrongCount / attempts;

  // Dimension 2: Phrasing variance
  const phrasingsFailedRatio = phrasingsTotal > 0
    ? phrasingsFailed / phrasingsTotal
    : 0;

  // Dimension 3: Recovery failure (inverted — high recovery = careless)
  const recoveryRate = conceptsFailed > 0
    ? conceptsRecovered / conceptsFailed
    : 1;  // Default to full recovery (benefit of doubt) if no prior failures

  // Dimension 4: Fast-wrong timing discount
  const fastWrongRatio = wrongCount > 0
    ? fastWrongCount / wrongCount
    : 0;

  // Weighted formula — per fingerprint doc Section 4.2
  const score =
    (W_RECURRENCE * recurrenceRate)
    + (W_PHRASING  * phrasingsFailedRatio)
    + (W_RECOVERY  * (1 - recoveryRate))
    - (W_TIMING    * fastWrongRatio);

  // Clamp to [0, 1]
  const fingerprintScore = Math.max(0, Math.min(1, score));

  // Classification thresholds — per fingerprint doc Section 4.3
  let classification;
  if (fingerprintScore >= CONCEPTUAL_GAP_THRESHOLD) {
    classification = "ConceptualGap";
  } else if (fingerprintScore < CARELESS_ERROR_THRESHOLD) {
    classification = "CarelessError";
  } else {
    classification = "Uncertain";
  }

  return { fingerprintScore: parseFloat(fingerprintScore.toFixed(4)), classification };
}
```

### 4.4 Fingerprint Update Hook in `submitTest`

After a test is graded in `test.controller.js`, the fingerprint counters must be updated. This should be triggered inside `finalizeResult` (the async function that fires after AI evaluation completes):

```js
// Inside finalizeResult() in test.controller.js
// After Progress.findOneAndUpdate() — add this:

import { updateFingerprintsFromResult } from "../services/fingerprintEngine.service.js";

// Non-blocking — fingerprint update happens asynchronously
// Any failure here must not break the test submission response
updateFingerprintsFromResult(testResult).catch(err =>
  console.log("Fingerprint update failed (non-critical):", err.message)
);
```

`updateFingerprintsFromResult` iterates over each answer in the `TestResult`, looks up the associated `Test.questions[].conceptTag` and `phrasingSeed`, updates the `StudentFingerprint` counters for each concept using `findOneAndUpdate` with `upsert: true`, and then calls `computeFingerprint()` to recompute the score and classification in the same operation.

### 4.5 API Endpoints

All routes are protected by `protectRoute`. Mount in `index.js`:

```js
app.use("/api/student-context", studentContextRoutes);
app.use("/api/dashboard",       dashboardRoutes);
```

#### Student Context Routes

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| `GET` | `/api/student-context/:studentId` | `getStudentContext` | Full context object. Validates that `req.user._id === studentId` (or admin role) before serving. |

#### Dashboard Routes

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| `GET` | `/api/dashboard/scores` | `getDashboardScores` | Course-wise scores with history. Query params: `courseId`, `dateFrom`, `dateTo`, `difficulty`. |
| `GET` | `/api/dashboard/trends` | `getDashboardTrends` | Time-series data for performance trend charts. Query param: `courseId`, `window` (7d/30d/all). |
| `GET` | `/api/dashboard/fingerprints` | `getDashboardFingerprints` | All fingerprints for the student, grouped by course. Optional filter: `classification`. |
| `GET` | `/api/dashboard/summary` | `getDashboardSummary` | Aggregate stats (SummaryStats shape). Lightweight — used for header KPI cards. |

---

## 5. Frontend Design

### 5.1 Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| **Charts** | `recharts` | Composable, React-native, works well with Tailwind layouts. Supports `LineChart`, `BarChart`, `AreaChart`, `RadarChart` natively. |
| **State** | Zustand (`useStudentContextStore`) | Consistent with existing store pattern (`useAuthStore`, `useTestStore`). |
| **Real-time** | `socket.io-client` | Already installed on backend side. Wire up on dashboard mount. |
| **Animations** | CSS transitions + keyframes | Consistent with existing codebase pattern (no external animation library introduced). |

### 5.2 New State Store

`frontend/src/store/useStudentContextStore.js`

```js
// Zustand store shape
{
  // State
  context:       null | StudentContext,     // Full context object
  isLoading:     boolean,
  activeFilters: {
    courseId:    string | "all",
    dateFrom:    Date | null,
    dateTo:      Date | null,
    difficulty:  string | "all",
  },

  // Actions
  fetchContext(userId),        // GET /api/student-context/:studentId
  setFilter(key, value),       // Updates activeFilters
  resetFilters(),
  refreshCourseSlice(courseId), // Targeted re-fetch after socket event
}
```

### 5.3 Dashboard Layout & Component Tree

```
DashboardPage.jsx
│
├── DashboardHeader.jsx
│   └── KPI cards: Avg Score · Courses Enrolled · Conceptual Gaps · Trend arrow
│
├── CourseSelector.jsx          // Horizontal tabs or dropdown filter
│
├── DashboardFilters.jsx        // Date range picker + difficulty filter
│
├── ScoreOverviewPanel.jsx      // Bar chart: one bar per test, colour-coded pass/fail
│   └── uses Recharts BarChart
│
├── PerformanceTrendPanel.jsx   // Line chart: score over time per course
│   └── uses Recharts LineChart with ReferenceArea for 7-day moving average
│
├── FingerprintInsightPanel.jsx // Conceptual gap / careless error breakdown
│   ├── ConceptTag list with coloured classification badge
│   ├── FingerprintScoreBar.jsx — horizontal progress bar per concept
│   └── Tooltip: "3 attempts · Failing across 2 different phrasings"
│
├── CourseProgressCard.jsx      // Per-course: videos watched / total, tests passed
│   └── Circular progress indicator (CSS conic-gradient)
│
└── EmptyDashboardState.jsx     // Shown when no TestResults exist yet
```

### 5.4 Design System Compliance

All components must use the existing CSS variable palette from `PROJECT_STATE.md` Section 7:

```css
/* Score colour mapping */
--score-pass:   #D4860A;   /* --amber: used for passing scores ≥ 70 */
--score-fail:   #7A756D;   /* --text-muted: used for failing scores */
--gap-critical: #C0392B;   /* New: ConceptualGap badge */
--gap-warning:  #D4860A;   /* --amber: Uncertain badge */
--gap-ok:       #27AE60;   /* New: CarelessError badge (green — reassurance) */
```

Classification badge colours are chosen deliberately:
- **ConceptualGap** → warm red. Signals action needed. Not alarming — warm red not emergency red.
- **CarelessError** → green. Reassures the student: "You know this — just be careful."
- **Uncertain** → amber (brand accent). Signals: "We're still watching."

### 5.5 Recharts Implementation Patterns

#### Score Bar Chart (ScoreOverviewPanel)

```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from "recharts";

// data shape: [{ label: "Video 3 Test", score: 82, passed: true, takenAt: "..." }]

<BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
  <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)" }} />
  <ReferenceLine y={70} stroke="var(--warm-grey)" strokeDasharray="4 4" label="Pass" />
  <Tooltip
    contentStyle={{ background: "var(--charcoal)", color: "var(--ivory)", border: "none" }}
    formatter={(value) => [`${value}%`, "Score"]}
  />
  <Bar dataKey="score" radius={[3, 3, 0, 0]}>
    {chartData.map((entry, i) => (
      <Cell key={i} fill={entry.passed ? "var(--amber)" : "var(--text-muted)"} />
    ))}
  </Bar>
</BarChart>
```

#### Performance Trend Chart (PerformanceTrendPanel)

```jsx
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

// data shape: [{ date: "Mar 15", score: 74, movingAvg: 71 }]

<AreaChart data={trendData}>
  <defs>
    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%"  stopColor="var(--amber)" stopOpacity={0.2} />
      <stop offset="95%" stopColor="var(--amber)" stopOpacity={0}   />
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="score" stroke="var(--amber)" fill="url(#scoreGradient)" />
  <Line type="monotone" dataKey="movingAvg" stroke="var(--warm-grey)"
        strokeDasharray="4 2" dot={false} />
</AreaChart>
```

### 5.6 Real-Time Socket Integration

```js
// Inside DashboardPage.jsx useEffect
import { io } from "socket.io-client";

useEffect(() => {
  const socket = io("http://localhost:3001", { withCredentials: true });

  socket.on("context:updated", ({ studentId, courseId }) => {
    if (studentId === authUser._id) {
      // Targeted refresh of only the affected course slice
      refreshCourseSlice(courseId);
    }
  });

  return () => socket.disconnect();
}, [authUser._id]);
```

Backend must emit this event from `finalizeResult()` in `test.controller.js` after fingerprints are updated:

```js
// In test.controller.js, after fingerprint recompute completes
req.app.get("io").emit("context:updated", {
  studentId: testResult.studentId.toString(),
  courseId:  testResult.courseId.toString(),
});
```

Wire up Socket.IO in `index.js`:

```js
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "http://localhost:5173", credentials: true } });
app.set("io", io);   // Make io accessible in controllers via req.app.get("io")
httpServer.listen(PORT);  // Replace app.listen with httpServer.listen
```

---

## 6. Fingerprint Integration Strategy

### 6.1 Where Fingerprint Data Integrates with the Student Context

The `StudentFingerprint` collection feeds into the `StudentContext` via the `fingerprints` array on each `CourseContext`. The flow is:

```
Test submitted → finalizeResult() → updateFingerprintsFromResult()
                                         │
                                         ├── Reads Test.questions[].conceptTag + phrasingSeed
                                         ├── Upserts StudentFingerprint counters
                                         ├── Calls computeFingerprint() (pure fn)
                                         └── Writes updated score + classification back to DB
                                                     │
                                    (Socket.IO) ◄────┘
                                         │
                              Dashboard refreshes fingerprint panel
```

### 6.2 Use Cases Enabled by Fingerprint Integration

#### Dashboard: Understanding Depth Layer

The `FingerprintInsightPanel` surfaces classification data to students. Key UX decision: call the panel **"Understanding Depth"** rather than exposing the internal "fingerprint" terminology to students.

Example UI copy:
- ConceptualGap → *"This concept needs more work"*
- CarelessError → *"You know this — just slow down on these questions"*
- Uncertain → *"We're still building a picture of this concept"*

#### AI Context Injection (Phase 2 Unlock)

The fingerprint classification is the filter for `Progress.aiAnalysis`. Currently `aiAnalysis.weakAreas` would receive raw topic labels. With fingerprints:

```js
// Before (noisy — raw topic labels):
weakAreas: ["closures", "async-await", "array-methods"]

// After (filtered by classification):
weakAreas: ["closures", "async-await"]  // Only ConceptualGap classifications included
// "array-methods" is excluded because its classification is "CarelessError"
```

This directly solves the problem described in fingerprint doc Section 2.2 — the AI no longer treats careless errors and conceptual gaps identically.

#### Anomaly Detection (Phase 3 Opportunity)

`fastWrongRatio` data collected in `responseTimeMs` enables detection of anomalous test-taking patterns:
- Student who answers all 15 questions within 30 seconds → potential academic integrity flag for instructors
- Student whose `fastWrongRatio` exceeds 0.8 consistently → UX intervention: "Looks like you're rushing — take your time on this test"

#### Session Tracking & Personalisation (Phase 3 Opportunity)

`responseTimeMs` per question, aggregated over time, enables:
- Identifying questions that consistently take students long to answer (hard questions regardless of outcome)
- Detecting time-of-day effects (performance at 2am vs. 10am)
- Personalising quiz pacing recommendations

### 6.3 Privacy & Security Considerations

| Risk | Mitigation |
|---|---|
| `responseTimeMs` data is behavioural and sensitive | Store at `TestResult` level only. Never expose raw timing data to students or via public APIs. Accessible only by admins and internal computation. |
| Fingerprint scores could feel punitive if misunderstood | Never expose `fingerprintScore` (the decimal) to students. Only expose the human-readable `classification` label with friendly copy. |
| Anomaly detection could be discriminatory | Any instructor-facing anomaly flags must be clearly labelled as "for review" not "confirmed cheating." Provide context alongside the flag. |
| StudentFingerprint data must belong to the student | All fingerprint queries are scoped to `studentId`. The `getStudentContext` controller validates `req.user._id === studentId` before responding. No cross-student data leakage is possible. |
| GDPR / data deletion | If a student account is deleted, a cascade delete must remove all `StudentFingerprint` documents for that `studentId`. Implement as a Mongoose post-hook on `User` deletion. |
| `conceptTag` string values are instructor-defined | Tag values must be sanitised (lowercase, alphanumeric + hyphens only) before storage. A malformed or injected tag string should be rejected at the schema level with a regex validator. |

---

## 7. Implementation Roadmap

### Phase 1 — Foundation (MVP) · Estimated: 2 weeks

**Goal:** The `DashboardPage` renders real data. No fingerprints yet. Core data layer in place.

| # | Task | File(s) | Dependency |
|---|------|---------|------------|
| 1.1 | Create `fingerprint.model.js` (empty counters, no compute yet) | `backend/src/models/fingerprint.model.js` | None |
| 1.2 | Add `conceptTag`, `phrasingSeed` to `quiz.model.js` questions | `backend/src/models/quiz.model.js` | None |
| 1.3 | Add `responseTimeMs` to `answerSchema` in `testResult.model.js` | `backend/src/models/testResult.model.js` | None |
| 1.4 | Update `TestPanel.jsx` to capture and submit `responseTimeMs` per answer | `frontend/src/components/TestPanel.jsx` | 1.3 |
| 1.5 | Create `studentContext.service.js` with `buildStudentContext()` | `backend/src/services/studentContext.service.js` | 1.1 |
| 1.6 | Create `studentContext.controller.js` and `studentContext.route.js` | Backend controllers + routes | 1.5 |
| 1.7 | Mount `/api/student-context` in `index.js` | `backend/src/index.js` | 1.6 |
| 1.8 | Create `useStudentContextStore.js` Zustand store | `frontend/src/store/useStudentContextStore.js` | 1.7 |
| 1.9 | Build `DashboardPage.jsx` with score bar chart and trend line | `frontend/src/components/DashboardPage.jsx` | 1.8 |
| 1.10 | Install `recharts` on frontend | `frontend/package.json` | None |
| 1.11 | Fix `index.js` to use `httpServer.listen` with Socket.IO wired | `backend/src/index.js` | None |

**Phase 1 Success Criteria:**
- Student can navigate to `/dashboard` and see their test scores per course
- Bar chart renders historical scores colour-coded by pass/fail
- Trend line renders with 7-day moving average overlay
- Filtering by course and date range works

---

### Phase 2 — Fingerprint Integration · Estimated: 1.5 weeks

**Goal:** Fingerprint engine running, classifications visible on dashboard, AI context filtered.

| # | Task | File(s) | Dependency |
|---|------|---------|------------|
| 2.1 | Create `fingerprintEngine.service.js` with pure `computeFingerprint()` | `backend/src/services/fingerprintEngine.service.js` | None |
| 2.2 | Create `updateFingerprintsFromResult()` function | Same file | 2.1, 1.3 |
| 2.3 | Hook `updateFingerprintsFromResult()` into `finalizeResult()` | `backend/src/controllers/test.controller.js` | 2.2 |
| 2.4 | Update `seedTests.js` to include `conceptTag` and `phrasingSeed` on all questions | `backend/src/seed/seedTests.js` | 1.2 |
| 2.5 | Add `fingerprints` to `buildStudentContext()` response | `studentContext.service.js` | 2.3 |
| 2.6 | Build `FingerprintInsightPanel.jsx` component | `frontend/src/components/` | 2.5 |
| 2.7 | Wire Socket.IO `context:updated` emit in `finalizeResult()` | `test.controller.js` | 1.11 |
| 2.8 | Add Socket.IO listener in `DashboardPage.jsx` | `DashboardPage.jsx` | 2.7 |
| 2.9 | Filter `Progress.aiAnalysis.weakAreas` using fingerprint classifications | `test.controller.js` (in `evaluateSubjectiveAnswersAsync`) | 2.3 |

**Phase 2 Success Criteria:**
- After submitting a test, fingerprint panel updates in real-time without page reload
- Concepts classified as `ConceptualGap` appear in AI weak-areas context; `CarelessError` concepts do not
- Minimum 3 attempts required before non-Uncertain classification is shown (no false positives on first test)

---

### Phase 3 — Enhancements · Estimated: 2 weeks

**Goal:** Polish, performance, instructor visibility, advanced analytics.

| # | Task |
|---|------|
| 3.1 | Add `CourseProgressCard` components with circular progress indicators |
| 3.2 | Add date range filter + difficulty filter to dashboard |
| 3.3 | Build `/api/dashboard/scores`, `/trends`, `/fingerprints`, `/summary` sliced endpoints for lighter payloads |
| 3.4 | Add `ProficiencyBand` badge to course cards in `CoursePage.jsx` (pulls from SCS) |
| 3.5 | Gemini auto-generation of `conceptTag` + `phrasingSeed` during test creation |
| 3.6 | Instructor-facing anomaly panel (fast-answer pattern detection using `fastWrongRatio`) |
| 3.7 | Response time heatmap: per-concept average time-to-answer visualisation |
| 3.8 | `StudentFingerprint` cascade delete hook on User deletion (GDPR) |
| 3.9 | Populate `Progress.aiAnalysis` fields using Gemini, now filtered by fingerprint classifications |

---

### Key Milestones & Dependencies

```
Week 1-2   [Phase 1]  ── Schema updates → SCS service → API → Zustand store → Dashboard UI
Week 3-4   [Phase 2]  ── Fingerprint engine → Update hook → Socket.IO → Panel UI → AI filter
Week 5-6   [Phase 3]  ── Sliced endpoints → Instructor view → Gemini auto-tags → GDPR hook
```

---

## 8. Risks & Considerations

### 8.1 Scalability

| Risk | Impact | Mitigation |
|---|---|---|
| `buildStudentContext()` runs three aggregation pipelines per request | High latency for students with many tests | Cache context in Redis or in-memory with a 60-second TTL. Invalidate on `context:updated` socket event. Phase 1 can skip cache; Phase 2/3 must add it. |
| `StudentFingerprint` upsert runs per concept per test submission | Acceptable at current scale; could become slow with thousands of concepts | Batch the upserts using `bulkWrite()` operations rather than individual `findOneAndUpdate` calls. |
| MongoDB aggregation pipeline joins across `TestResult` → `Video` | N+1 risk if not indexed | Ensure compound index on `TestResult`: `{ studentId: 1, courseId: 1, createdAt: -1 }`. Ensure `VideoId` is indexed on both `TestResult` and `Video`. |
| Recharts rendering many data points in line chart | Browser performance with 500+ test results | Implement data thinning — if more than 50 data points, sample to a representative subset or aggregate to weekly averages. |

### 8.2 Data Consistency

| Risk | Impact | Mitigation |
|---|---|---|
| `Progress.studentId` stores `User._id` but is typed as `ref: "Student"` | Queries joining Progress to Student will silently fail | The SCS abstracts this: it queries Progress by `req.user._id` directly, never via the Student ref. The semantic mismatch is isolated. Document in code comments that this is a known debt item. |
| Fingerprint counters are updated asynchronously after grading | Dashboard may momentarily show stale fingerprint data | Use Socket.IO to trigger a targeted refresh. Mark the fingerprint panel with a subtle "updating..." indicator for 3 seconds after a test is submitted. |
| `conceptTag` values must be consistent across tests | Typo variations (`"closures"` vs `"closure"`) produce separate fingerprints | Enforce a controlled vocabulary: define valid `conceptTag` values per course in a constants file or Course metadata. Validate against this list in the schema. |
| `fingerprintScore` could drift stale if algorithm weights change | Old scores computed with old weights | Store `algorithmVersion: String` on each `StudentFingerprint` document. Re-run recomputation on all records when weights change. This is a background job, not a migration. |

### 8.3 Privacy Concerns

| Concern | Detail | Action |
|---|---|---|
| Behavioural timing data | `responseTimeMs` is granular user behaviour. Even if not shown to users, it must be handled with care. | Do not expose `responseTimeMs` in any student-facing API. Admin-only access. Include in Privacy Policy disclosure. |
| Fingerprint classification could demotivate students | A `ConceptualGap` label could feel like a harsh judgement if poorly communicated | Use friendly copy throughout (see Section 6.2). Show classification alongside positive framing: "Still developing" rather than "Conceptual Gap." Never surface the raw score. |
| Cross-role data exposure | Instructors currently have no dashboard. When built, ensure instructors can only see fingerprint data for students enrolled in their own courses | Enforce in the instructor-facing API layer with a course-ownership check: `Course.tutorId === req.user._id` before serving student data. |
| Data retention | Student fingerprints persist indefinitely today | Define a retention policy: fingerprints older than 24 months (or tied to a deactivated course) should be archived or anonymised. Implement as a scheduled job in Phase 3. |

---

*Document ends. Proceed to Phase 1 implementation once reviewed.*