# LearnMind — Course Capstone Test System
### Fingerprint-Driven Adaptive Final Examination

| | |
|---|---|
| **Project** | LearnMind — AI-Assisted E-Learning Platform |
| **Document** | Capstone Test System — Architecture & Implementation Plan |
| **Version** | 1.0 — Pre-implementation. Post Phase 3 of dashboard_plan.md. |
| **Date** | 2026-03-31 |
| **Dependencies** | dashboard_plan.md (all 3 phases shipped), fingerprint_implementation_doc.docx (Phase 2 stable) |
| **Question Scope** | MCQ only. Subjective questions explicitly out of scope for v1. |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Dependencies & Roadmap Placement](#2-dependencies--roadmap-placement)
3. [User Flow](#3-user-flow)
4. [Question Generation — Hybrid Model](#4-question-generation--hybrid-model)
5. [Data Modelling](#5-data-modelling)
6. [Backend API Design](#6-backend-api-design)
7. [Frontend Design](#7-frontend-design)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Risks & Mitigations](#9-risks--mitigations)
10. [Known Future Enhancements (v2)](#10-known-future-enhancements-v2)

---

## 1. Executive Summary

The Capstone Test System is the course completion gate for LearnMind. Once a student has finished all videos and passed all in-lesson tests, they are presented with a single, dynamically constructed final exam. Passing it marks the course as fully complete. Failing it enforces a cooldown before a retake is permitted.

What makes this system different from the existing in-lesson tests is that the capstone exam is not a static document. It is assembled at runtime by a two-layer generation strategy:

- **Layer 1 — Seeded pool selection:** Questions are selected from a pre-authored, instructor-verified MCQ bank, weighted heavily towards the `conceptTag`s where the student's fingerprint classification is `ConceptualGap` or `Uncertain`.
- **Layer 2 — AI gap-fill:** If the seeded pool does not have enough questions to cover all weak `conceptTag`s (typically on new courses with sparse banks), Gemini generates supplementary MCQ questions for those uncovered tags. These are graded by the standard MCQ comparator — no subjective grading involved.

> **Scope Decision — Subjective Questions**
> Subjective (short answer) questions are explicitly excluded from the capstone in v1. The three unresolved problems documented at the end of `fingerprint_implementation_doc.docx` — undefined wrong/correct thresholds, ignored `aiConfidence` weighting, and the inapplicability of the `fastWrongRatio` timing signal to essays — mean that subjective grading signals cannot yet be trusted to drive a course-completion gate. Subjective questions in the capstone are a Phase 2 (v2) problem, tracked as a known future enhancement in Section 10.

---

## 2. Dependencies & Roadmap Placement

This system is designed to be implemented after all three phases of `dashboard_plan.md` are shipped.

| Capstone Subsystem | Depends On | Why |
|---|---|---|
| Fingerprint-weighted question selection | dashboard_plan.md Phase 2 (Fingerprint Engine stable) | Needs reliable `ConceptualGap` / `Uncertain` / `CarelessError` classifications per `conceptTag` before weighting makes sense. |
| AI gap-fill question generation | dashboard_plan.md Phase 3 (Gemini auto-tags) | Needs `conceptTag` vocabulary to be standardised and controlled. Phase 3 Task 3.5 does this. |
| Cooldown enforcement | dashboard_plan.md Phase 1 (TestResult model extended) | Cooldown is computed from the last capstone `TestResult` timestamp. `TestResult` model must exist and be stable. |
| Course completion gate | dashboard_plan.md Phase 1 (`checkCourseCompletion`) | Capstone is only unlocked after all in-lesson tests pass. This logic already exists in `test.controller.js`. |
| Dashboard capstone status card | dashboard_plan.md Phase 1 (`DashboardPage.jsx`) | The capstone status block is an additional panel added to the existing dashboard. |

> **Note:** Do not begin implementing this system until Phase 3 of `dashboard_plan.md` has passed its success criteria. Starting earlier means the fingerprint classifications driving question selection will be unreliable, making the adaptive element meaningless.

---

## 3. User Flow

### 3.1 Unlock Conditions

The capstone test is hidden until all of the following are true for a given course:

1. All course videos have a `Progress` record with `watchedPercent >= 90`.
2. All in-lesson tests associated with the course have a passing `TestResult` (score >= 70).
3. No active cooldown period exists for the student on this course's capstone.

The existing `checkCourseCompletion` function in `test.controller.js` already checks conditions 1 and 2. It will be extended to emit a `capstone:unlocked` socket event when both conditions first become true.

### 3.2 Step-by-Step Flow

1. Student completes final in-lesson test. `checkCourseCompletion` runs and evaluates unlock conditions.
2. If unlocked: socket event `capstone:unlocked` fires. Dashboard and `CourseDetailPage` both listen and update UI without page reload.
3. Student clicks **Start Final Exam**. Frontend calls `POST /api/capstone/generate/:courseId`.
4. Backend generates the exam paper (see Section 4). Returns a structured question set with a `capstoneSessionId`.
5. Student completes the exam. Frontend calls `POST /api/capstone/submit/:sessionId`.
6. Backend grades instantly (MCQ only). Score >= 70: course marked complete. Score < 70: cooldown record written.
7. Dashboard updates in real-time via socket event `capstone:result`.
8. If failed: student sees cooldown timer. On expiry, they may regenerate and retake — a fresh exam is generated each attempt.

### 3.3 Cooldown Policy

A failed capstone attempt triggers a 24-hour cooldown. During cooldown the student cannot access the capstone interface. The default is configurable per-course by the instructor in a future admin panel (v2).

| Attempt | Cooldown |
|---|---|
| 1st failure | 24 hours from submission timestamp |
| 2nd failure | 24 hours (same policy — no escalation in v1) |
| Subsequent failures | 24 hours each. No attempt cap in v1. |

> **Note:** Escalating cooldowns and attempt caps are documented as v2 enhancements in Section 10.

---

## 4. Question Generation — Hybrid Model

Each capstone exam is generated fresh per attempt. The exam always has a fixed total question count (default: 20) and is assembled in two layers.

### 4.1 Layer 1 — Seeded Pool Selection

The seeded pool is the bank of pre-authored, instructor-verified MCQ questions stored in the existing `Test` collection. These questions already have `conceptTag` fields (added in `dashboard_plan.md` Phase 2, Task 1.2).

**Selection algorithm:**

1. Load the student's `StudentFingerprint` documents for the course being tested.
2. Partition `conceptTag`s into three buckets by classification:
   - `ConceptualGap` — highest priority. Target **50%** of total question count.
   - `Uncertain` — medium priority. Target **30%** of total question count.
   - `CarelessError` / no classification — low priority. Target **20%** of total question count.
3. For each bucket, query the `Test` collection for MCQ questions matching the `conceptTag`s in that bucket.
4. Sample questions per bucket proportionally. If a bucket has fewer available questions than the target, take all available and note the deficit.
5. Record unfilled deficit per `conceptTag` — this becomes the input to Layer 2.

> **Why proportional weighting?**
> A `ConceptualGap` classification means the student has demonstrated consistent knowledge failure on a concept across multiple attempts — it is not noise. The capstone should concentrate exam pressure on these areas. `Uncertain` concepts are worth probing again but may simply reflect quiz-phrasing ambiguity. `CarelessError` concepts do not need heavy representation — the fingerprint already determined that the student understands the material.

### 4.2 Layer 2 — AI Gap-Fill

If Layer 1 cannot fill the target question count — because the seeded bank is sparse for certain `conceptTag`s — Gemini generates supplementary MCQ questions for each uncovered tag.

**Gap-fill prompt contract (sent to Gemini per unfilled `conceptTag`):**

| Prompt Field | Value |
|---|---|
| `conceptTag` | The specific tag with insufficient seeded questions (e.g. `closures`, `event-loop`). |
| `courseTitle` | Title of the course from `Course` document. |
| `count` | Number of questions to generate (the deficit for this tag). |
| `difficulty` | Derived from the course `difficulty` field. Maps: `beginner→easy`, `intermediate→medium`, `advanced→hard`. |
| `existingQuestions` | Array of question stems already included from the seeded pool, to avoid near-duplicate generation. |
| `responseFormat` | Strict JSON schema (see Section 4.3). Model instructed to return only JSON, no preamble. |

### 4.3 AI-Generated Question Schema

Gemini is instructed to return a JSON array conforming to this schema. Each generated question is validated before being included in the exam. Invalid generations are discarded; if too many fail validation, the exam is assembled with fewer questions rather than surfacing an error to the student.

| Field | Type | Description |
|---|---|---|
| `stem` | String | The question text. Must end with a question mark or colon. |
| `options` | String[4] | Exactly 4 answer options. No "All of the above" or "None of the above" in v1. |
| `correctIndex` | Number (0–3) | Index of the correct option in the `options` array. |
| `conceptTag` | String | Must exactly match the tag requested. Validated server-side against controlled vocabulary. |
| `source` | `"ai_generated"` | Literal string. Distinguishes AI questions from seeded questions in analytics. |
| `difficulty` | `"easy"` \| `"medium"` \| `"hard"` | Must match the difficulty passed in the prompt. |

> **Note:** AI-generated questions are never stored permanently in the `Test` collection. They are ephemeral — generated, used for the session, and saved only in the `CapstoneSession` document for auditability. This keeps the seeded bank clean and instructor-curated.

### 4.4 Session Assembly & Shuffle

1. Merge seeded and AI-generated questions into a single flat array.
2. Shuffle the array using a Fisher-Yates shuffle seeded with the `capstoneSessionId` (reproducible shuffle — if the student refreshes mid-exam, they see the same order).
3. Shuffle option order within each question independently.
4. Write the `CapstoneSession` document to MongoDB (see Section 5.1).
5. Return the session to the frontend — questions without `correctIndex` exposed.

---

## 5. Data Modelling

### 5.1 New Collection: `CapstoneSession`

A new Mongoose model `capstoneSession.model.js` is created. One document is written per exam attempt.

| Field | Type / Ref | Description |
|---|---|---|
| `studentId` | ObjectId → User | The student. Stored as `User._id` consistent with existing `Progress` pattern. |
| `courseId` | ObjectId → Course | Course this capstone belongs to. |
| `status` | Enum: `pending` \| `submitted` \| `passed` \| `failed` | Lifecycle state of this session. |
| `questions` | Array (`CapstoneQuestionSchema`) | Full question set for this attempt. Includes `correctIndex` — never sent to client. |
| `fingerprintSnapshot` | Object | A copy of the `StudentFingerprint` classifications at generation time. Used for post-analysis. |
| `score` | Number (0–100) | Final weighted score. Set on submission. |
| `passed` | Boolean | True if `score >= passingThreshold` (default 70). |
| `passingThreshold` | Number | Stored per-session. Allows future per-course threshold config without breaking history. |
| `cooldownUntil` | Date \| null | If failed, set to `submittedAt + cooldownDurationMs`. Null if passed. |
| `cooldownDurationMs` | Number | Milliseconds. Default: `86400000` (24h). Stored per-session for auditability. |
| `generatedAt` | Date | When the session was created (exam generated). |
| `submittedAt` | Date \| null | When answers were submitted. |
| `attemptNumber` | Number | 1-indexed count of this student's attempts on this course's capstone. |

### 5.2 `CapstoneQuestionSchema` (subdocument)

| Field | Type | Description |
|---|---|---|
| `questionId` | ObjectId \| null | Ref to `Test` question if seeded. Null if AI-generated. |
| `stem` | String | Question text. |
| `options` | String[4] | Answer choices (shuffled). |
| `correctIndex` | Number | Index of correct answer. Server-only — never returned in GET responses. |
| `conceptTag` | String | Tag this question targets. |
| `questionSource` | `"seeded"` \| `"ai_generated"` | Origin of this question. |
| `studentAnswer` | Number \| null | Index submitted by student. Null until submission. |
| `isCorrect` | Boolean \| null | Set on grading. |

### 5.3 Changes to Existing Collections

| Collection / File | Change |
|---|---|
| `progress.model.js` | Add `capstoneSessionId: { type: ObjectId, ref: 'CapstoneSession', default: null }` and `capstonePassed: { type: Boolean, default: false }`. |
| `quiz.model.js` | No changes. Existing `conceptTag` field is used as-is. |
| `test.controller.js` | `checkCourseCompletion` extended to emit `capstone:unlocked` via Socket.IO when all conditions met. |
| `index.js` (backend) | Mount new `/api/capstone` router. |

---

## 6. Backend API Design

### 6.1 New Router: `/api/capstone`

A new file `backend/src/routes/capstone.route.js` is created, mounted in `index.js` as `app.use('/api/capstone', capstoneRoutes)`. All routes are protected by the existing `protectRoute` middleware.

| Endpoint | Method | Description |
|---|---|---|
| `/api/capstone/status/:courseId` | GET | Returns capstone unlock status, last attempt result, and `cooldownUntil` for the authenticated student. Powers the UI gate. |
| `/api/capstone/generate/:courseId` | POST | Generates and saves a new `CapstoneSession`. Returns questions without `correctIndex`. Blocked if cooldown active. |
| `/api/capstone/submit/:sessionId` | POST | Accepts answers array, grades, updates session, writes cooldown or marks course complete. |
| `/api/capstone/result/:sessionId` | GET | Returns graded result with per-question breakdown for the results screen. |

### 6.2 Controller File Structure

A new file `backend/src/controllers/capstone.controller.js` exports four functions, one per route above. It imports:

- `fingerprintEngine.service.js` — to read current fingerprint classifications.
- `studentContext.service.js` — to verify all unlock conditions are met.
- `aiEvaluator.js` — reused for the Gemini gap-fill call (new exported function `generateCapstoneMCQ`).
- `capstoneSession.model.js` — the new model.
- `io` (Socket.IO instance) — emits `capstone:result` on grading completion.

### 6.3 Grading Logic

Grading is synchronous and immediate — there is no polling loop for the capstone. Every question is MCQ, so the comparator is a simple strict equality check between `studentAnswer` and `correctIndex`.

Score calculation: each question is worth equal weight (`100 / totalQuestions` points). Final score is rounded to one decimal place. A score `>= passingThreshold` (default 70) sets `passed: true`.

> **No Gemini in the grading path.** Unlike in-lesson subjective tests, the capstone grading path does not call Gemini. Grading is deterministic, instant, and does not require async polling. This is a deliberate scope decision to make the capstone result feel immediate and certain.

---

## 7. Frontend Design

### 7.1 New Components

| Component / File | Responsibility |
|---|---|
| `CapstoneStatusCard.jsx` | Rendered in `DashboardPage.jsx` below course cards. Shows one of: locked (conditions unmet), cooldown countdown timer, or "Start Final Exam" CTA. |
| `CapstonePage.jsx` (`/capstone/:courseId`) | Full-screen exam interface. Renders question list, per-question MCQ selector, progress indicator, submit button. Built on the same design system as `TestPanel.jsx`. |
| `CapstoneResultPage.jsx` (`/capstone/:courseId/result/:sessionId`) | Results screen. Shows overall score, pass/fail state, per-question correctness breakdown grouped by `conceptTag`, and a next-steps prompt. |
| `useCapstoneStore.js` (Zustand) | Manages: status fetch, generate call, answer state, submit, result. Mirrors `useTestStore.js` patterns for consistency. |

### 7.2 Dashboard Integration

The existing `DashboardPage.jsx` gains a Capstone Status section below the course performance charts. For each enrolled course, a `CapstoneStatusCard` renders in one of four states:

| State | UI |
|---|---|
| Locked | Grey card. Text: "Complete all lessons and tests to unlock the final exam." No CTA. |
| Cooldown active | Amber card. Text: "Retake available in [HH:MM:SS]". Countdown timer refreshes every second in-component. |
| Available | Amber-bordered card with "Start Final Exam" button. If previously attempted: shows last score. |
| Passed | Green card. Text: "Course Complete". Badge rendered. No retake option. |

### 7.3 Socket.IO Events

| Event Name | Payload & Action |
|---|---|
| `capstone:unlocked` | `{ courseId }`. Listened in `DashboardPage` and `CourseDetailPage`. Triggers status refetch; `CapstoneStatusCard` transitions from Locked to Available without reload. |
| `capstone:result` | `{ sessionId, passed, score, courseId }`. Listened in `CapstonePage` and `DashboardPage`. On pass: triggers course-complete animation. On fail: starts cooldown timer. |

### 7.4 Design System Compliance

All capstone UI components must use the existing CSS variable design system from `PROJECT_STATE.md` Section 7. Specific guidance:

- **Pass state:** use `--amber` / `--amber-pale` for borders and background. Do not introduce green as a new semantic colour — amber is the brand's positive signal colour.
- **Fail state:** use `--warm-grey` / `--charcoal` for a neutral, non-alarming failure treatment.
- **Cooldown timer:** amber text on ivory background. Font: DM Mono (already loaded) for the countdown digits.
- **Result breakdown table:** follows the same alternating-row pattern as the dashboard score tables.

---

## 8. Implementation Roadmap

This system is implemented in a single phase, beginning after `dashboard_plan.md` Phase 3 is complete.

### Phase C1 — Data Layer & API (Week 1)

| # | Task | File(s) | Dependency |
|---|---|---|---|
| C1.1 | Create `capstoneSession.model.js` with `CapstoneQuestionSchema` | `backend/src/models/capstoneSession.model.js` | None |
| C1.2 | Add `capstoneSessionId` and `capstonePassed` to `progress.model.js` | `backend/src/models/progress.model.js` | C1.1 |
| C1.3 | Add `generateCapstoneMCQ()` to `aiEvaluator.js` | `backend/src/lib/aiEvaluator.js` | None |
| C1.4 | Create `capstone.controller.js` with all 4 controller functions | `backend/src/controllers/capstone.controller.js` | C1.1, C1.3 |
| C1.5 | Create `capstone.route.js` and mount in `index.js` | `backend/src/routes/capstone.route.js`, `index.js` | C1.4 |
| C1.6 | Extend `checkCourseCompletion` to emit `capstone:unlocked` | `backend/src/controllers/test.controller.js` | C1.5 |

### Phase C2 — Frontend (Week 2)

| # | Task | File(s) | Dependency |
|---|---|---|---|
| C2.1 | Create `useCapstoneStore.js` Zustand store | `frontend/src/store/useCapstoneStore.js` | C1.5 |
| C2.2 | Create `CapstoneStatusCard.jsx` | `frontend/src/components/CapstoneStatusCard.jsx` | C2.1 |
| C2.3 | Integrate `CapstoneStatusCard` into `DashboardPage.jsx` | `frontend/src/components/DashboardPage.jsx` | C2.2 |
| C2.4 | Create `CapstonePage.jsx` and add route `/capstone/:courseId` | `frontend/src/components/CapstonePage.jsx`, `App.jsx` | C2.1 |
| C2.5 | Create `CapstoneResultPage.jsx` and add route | `frontend/src/components/CapstoneResultPage.jsx`, `App.jsx` | C2.4 |
| C2.6 | Wire Socket.IO `capstone:unlocked` and `capstone:result` listeners | `DashboardPage.jsx`, `CapstonePage.jsx` | C2.3, C2.4 |

### Phase C3 — Validation & Hardening (Week 3)

| # | Task | Notes |
|---|---|---|
| C3.1 | Validate AI-generated question schema server-side before including in session | Reject and discard questions failing schema. Log discard rate per course for monitoring. |
| C3.2 | Ensure `correctIndex` is stripped from all `GET /api/capstone/*` responses | Security audit — inspect all serialisation paths. |
| C3.3 | Test cooldown enforcement edge cases: system clock manipulation, concurrent submissions | Unit test `cooldownUntil` comparison on server using `Date.now()`, not client timestamp. |
| C3.4 | Seed test coverage: seed a capstone question bank for the existing JS course | Add to `seedTests.js`. Minimum 5 questions per `conceptTag` for seeded pool to have depth. |
| C3.5 | End-to-end test: complete course → unlock → generate → submit → pass/fail → retake flow | Manual QA pass. Document in session log. |

### Success Criteria

- A student who has passed all in-lesson tests sees the "Start Final Exam" button in their dashboard.
- The exam paper reflects the student's weak `conceptTag`s — `ConceptualGap` concepts appear more frequently than `CarelessError` concepts.
- A passing student sees their course marked complete instantly (no page reload required).
- A failing student cannot access the exam during the 24-hour cooldown window — server enforces this regardless of client-side state.
- A fresh exam is generated on each retake — the student does not see the same question set twice.
- No `correctIndex` values are exposed in any client-facing API response.

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Gemini generates a question with a wrong correct answer | High — student fails a question they should pass | Instructor review queue (v2). In v1: log all AI-generated questions with session ID for post-hoc review. If discard rate or student complaint rate is high, reduce gap-fill reliance. |
| Seeded pool is too sparse on a new course | Medium — exam is shorter than 20 questions | Minimum viable exam is 10 questions. If Layer 1 + Layer 2 combined cannot reach 10, block generation and surface a clear message to the instructor: "Not enough questions in this course bank." |
| Student refreshes mid-exam and loses answers | Medium — poor UX | `useCapstoneStore` persists answer state to `sessionStorage` keyed by `sessionId`. On remount, state is restored. Server session remains open until explicit submit. |
| Fingerprint classifications are stale at generation time | Low — exam weighting is based on outdated data | `fingerprintSnapshot` is written into `CapstoneSession` at generation time. The exam is always coherent with the fingerprint that generated it, even if fingerprints update before submission. |
| `cooldownUntil` bypassed via client-side clock manipulation | High — student retakes immediately | `cooldownUntil` comparison is always done server-side in the generate endpoint: `if (session.cooldownUntil && Date.now() < session.cooldownUntil) return 403`. Client timer is display-only. |
| `conceptTag` vocabulary drift between test questions and capstone bank | Medium — questions tagged differently do not get weighted correctly | Controlled vocabulary enforced per Section 4.3. Server validates AI-generated `conceptTag` against `Course.allowedConceptTags` before accepting. |

---

## 10. Known Future Enhancements (v2)

The following items are explicitly out of scope for v1. They are documented here so they are not forgotten and can be designed into v2 without requiring architectural changes to the v1 foundation.

| Enhancement | Detail |
|---|---|
| Subjective questions in capstone | Blocked by three unresolved fingerprinting problems: undefined wrong/correct threshold for short answers, ignored `aiConfidence` weighting, and inapplicability of `fastWrongRatio` to essays. Requires dedicated fingerprinting work first. |
| Escalating cooldowns | First failure: 24h. Second: 48h. Third+: 72h. Requires attempt history query in generate endpoint. |
| Per-course passing threshold config | Instructors set `passingThreshold` per course (e.g. 80 for advanced courses). Requires instructor admin panel. |
| Per-course cooldown duration config | Same as above. Instructor sets `cooldownDurationMs` per course. |
| Instructor question review queue | All AI-generated questions surfaced in an instructor review panel. Instructor can approve (promotes to seeded pool), reject (blacklists stem), or edit. |
| Capstone analytics for instructors | Per-course capstone pass rate, most-failed `conceptTag`s, average attempt count. Feeds into instructor dashboard (Phase 3.6 of `dashboard_plan.md`). |
| Remediation path on failure | Instead of cooldown-only, offer curated video replay for the failed `conceptTag`s before retake is permitted. |
| Attempt cap | Maximum N retakes per course. Currently no limit in v1. |

---

*Document ends. Begin implementation after `dashboard_plan.md` Phase 3 success criteria are met.*