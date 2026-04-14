# LearnMind — Post-Capstone Remaining Work
### Everything still outstanding after the Capstone Test System is shipped

| | |
|---|---|
| **Project** | LearnMind — AI-Assisted E-Learning Platform |
| **Document** | Post-Capstone Remaining Work Register |
| **Date** | 2026-04-14 |
| **Assumes** | `Capstone_test_plan.md` fully shipped and verified |

---

## 1. Critical Bugs (Security / Correctness)

These exist today and survive into post-capstone. They are not blocked by anything — they can be fixed at any point.

| # | Issue | File(s) | Detail |
|---|---|---|---|
| B1 | **Password hash returned in auth responses** | `auth.controller.js` | Both `login` and `signup` return `password: savedUser.password` (bcrypt hash) in the JSON response body. Must be stripped before any public deployment. Fix: select `-password` on the returned user object, same pattern already used in `protectRoute`. |
| B2 | **`req.user._id` stored as `Progress.studentId`** | `video.controller.js`, `test.controller.js`, `progress.model.js` | `Progress.studentId` is declared as `ref: "Student"` but stores `User._id`. Semantically incorrect. The SCS works around it by querying directly via `req.user._id`. Needs a proper data migration + ref fix to be architecturally clean. Do not fix without migrating existing Progress documents. |
| B3 | **`course.route.js` not mounted in `index.js`** | `backend/src/index.js` | Flagged in the directory structure with ⚠️. The course routes file exists but is never mounted, meaning `/api/courses` is served by some other mechanism or is broken. Needs verification and a one-line fix in `index.js`. |
| B4 | **SCS pipeline silent failure on progress data** | `studentContext.service.js` | `buildStudentContext()` silently fails to return enrollment/progress data — suspected ObjectId/String type mismatch on `Video.courseId`. Cosmetically worked around in `DashboardPage.jsx` by fetching directly from `/api/progress/course/:courseId`. Root cause unresolved. |

---

## 2. Incomplete / Stubbed Features

These are features that are partially built — routes, models, or UI exist but the full flow does not work end-to-end.

### 2.1 Student Enrollment System
**Status:** Schema exists but no enrollment flow.

`Student.courseSubscribed` is a single plain String — not an array, not an ObjectId ref. There is no API endpoint to enroll a student in a course. Currently students appear to have access to all courses without any enrollment gate.

What needs to be built:
- Change `Student.courseSubscribed` to `coursesSubscribed: [ObjectId]` with ref to Course
- `POST /api/courses/:courseId/enroll` endpoint
- Enrollment check middleware or guard on course detail access
- Frontend enroll button on `CoursePage` course cards

### 2.2 Instructor / Tutor Dashboard
**Status:** `/tutor` route shows a Garfield placeholder page.

The entire instructor-facing side of the platform is unbuilt. What needs to exist:
- Instructor can view their own courses
- Instructor can see which students are enrolled
- Instructor can see per-student performance summaries (fingerprint data scoped to their courses)
- Instructor can create/edit tests (currently tests are only seeded via script)
- Capstone plan Section 10 mentions a future capstone analytics panel for instructors (per-course pass rate, most-failed conceptTags, average attempt count) — this belongs here too

Files that would need to be created:
- `instructor.controller.js`
- `instructor.route.js`
- `InstructorDashboardPage.jsx` (replacing `TutorPlaceholderPage.jsx`)

### 2.3 Admin Role
**Status:** `role: "admin"` exists in the User schema enum. Nothing else.

No admin routes, no admin UI, no admin-specific middleware beyond the bypass in `studentContext.controller.js`. If an admin account is created in the DB it has no special interface.

What would be needed:
- Admin-only middleware
- User management (view/deactivate accounts)
- Course management (approve/remove courses)
- System health / analytics overview

### 2.4 Course Completion Gate — End-to-End Verification
**Status:** `checkCourseCompletion` is implemented in `test.controller.js` but not verified end-to-end.

The function exists and checks conditions, but it has never been tested through the full flow (all videos watched + all tests passed → completion state triggered). After Capstone ships, `checkCourseCompletion` also needs to emit `capstone:unlocked` — so the full gate needs a proper QA pass.

### 2.5 TestPanel Results Display
**Status:** Submission and polling flow implemented, results display not fully verified.

The `TestPanel.jsx` component handles all phases (idle → taking → submitting → polling → results) but the results rendering has not been confirmed working end-to-end in a real browser session.

### 2.6 Forgot Password Flow
**Status:** Link exists in `LoginPage.jsx` pointing to `/forgot-password`. That route does not exist anywhere.

Needs: backend password reset flow (token generation, email sending) + frontend reset page. Email sending would require a new dependency (e.g. nodemailer or a transactional email service).

### 2.7 Cloudinary Image Uploads
**Status:** `cloudinary ^2.8.0` installed in `backend/package.json`. Never wired up.

Intended for course thumbnail uploads. Needs:
- Upload middleware (`multer` or similar)
- `POST /api/upload` or inline in course creation endpoint
- Frontend file picker on course creation/edit form (which doesn't exist yet either)

---

## 3. Known Technical Debt (Algorithm / Data)

These are known-incorrect or known-incomplete behaviours inside already-shipped code. They don't break the app visibly but will cause silent data quality issues at scale.

| # | Issue | File(s) | Detail |
|---|---|---|---|
| TD1 | **`phrasingsTotal` / `phrasingsFailed` overcounting** | `fingerprintEngine.service.js` | `updateFingerprintsFromResult` uses `$inc` with count of unique phrasingSeeds in the current batch. If the same phrasingSeed appears across multiple test submissions, it is counted multiple times. A correct implementation requires storing the full seen-phrasingSeeds set per StudentFingerprint document and using set operations. Acceptable at current scale. |
| TD2 | **Recovery dimension not computing** | `fingerprintEngine.service.js` | `conceptsRecovered` and `conceptsFailed` counters are never populated — computing recovery requires cross-result history comparison which is not yet implemented. The `W_RECOVERY` weight (0.25) always uses the default `recoveryRate = 1`, meaning recovery contributes 0 to every fingerprint score. The algorithm still works via the other three dimensions but is missing 25% of its signal. |
| TD3 | **`difficulty` filter on dashboard silently broken** | `studentContext.service.js`, `DashboardPage.jsx` | The `aggregateTestHistory` pipeline does not join the `Test` collection, so `difficulty` is absent from `CourseContext.testHistory`. The difficulty filter in `DashboardPage` has no effect on existing data. Fix: add a `$lookup` on the `tests` collection in the aggregation pipeline and project `test.difficulty`. |
| TD4 | **`aiAnalysis` not written for end-of-course tests** | `test.controller.js` | The Progress update in the `aiAnalysis` IIFE queries by `{ studentId, videoId }`. If `videoId` is null (end-of-course test), the query matches nothing and `aiAnalysis` is silently not written. Fix: add a fallback query by `{ studentId, courseId }` when `videoId` is null. |
| TD5 | **`Progress.studentId` ref mismatch (pre-existing)** | `progress.model.js` | Same as B2 above — listed separately here because it also affects data integrity of the Progress collection independently of the auth response bug. Any future query that joins Progress → Student via the ref will silently return nothing. |
| TD6 | **`Course.videoCount` can desync** | `course.model.js` | `videoCount` is a manually maintained field. If videos are added or removed without updating this field, it drifts out of sync with the actual video count. Should eventually be a computed virtual. |
| TD7 | **SCS pipeline root cause unresolved** | `studentContext.service.js` | See B4. The silent failure in `buildStudentContext()` that causes enrollment/progress data to return empty is worked around cosmetically but the actual cause (suspected ObjectId/String mismatch on `Video.courseId`) is unresolved. |

---

## 4. Fingerprint Algorithm — Future Enhancements

These are explicitly listed as future work in `fingerprint_implementation_doc.docx` and `dashboard_plan.md` but were not in scope for any shipped phase.

| # | Enhancement | Detail |
|---|---|---|
| FP1 | **Auto-generate `conceptTag` + `phrasingSeed` via Gemini during test creation** | Currently tags are manually set in `seedTests.js`. `generateConceptTag()` exists in `aiEvaluator.js` but is not called during test creation — only available as a utility. Wire it into the test creation flow so new tests are auto-tagged. |
| FP2 | **Controlled `conceptTag` vocabulary per course** | Tags must be consistent across questions for fingerprinting to work correctly. A typo (`"closures"` vs `"closure"`) produces separate fingerprints. Need a `Course.allowedConceptTags` array and server-side validation against it. |
| FP3 | **`StudentFingerprint` data retention policy** | Fingerprints older than 24 months (or tied to a deactivated course) should be archived or anonymised. Implement as a scheduled background job. |
| FP4 | **`algorithmVersion` field on StudentFingerprint** | If fingerprint algorithm weights change, old scores computed with old weights become stale. Adding `algorithmVersion: String` to each document enables a background recomputation job to target only stale records. |
| FP5 | **TestResult index for fingerprint query performance** | `analyzeFingerprint` queries all completed TestResults for a student+course on every submission. Needs compound index `{ studentId: 1, courseId: 1, evaluationStatus: 1 }` on `TestResult` collection. Not yet added. |

---

## 5. Capstone v2 Enhancements (Explicitly Out of Scope for v1)

These are documented in `Capstone_test_plan.md` Section 10 as known future work. They require the v1 Capstone to be stable first.

| # | Enhancement | Detail |
|---|---|---|
| CV1 | **Subjective questions in capstone** | Blocked by three unresolved fingerprinting problems: undefined wrong/correct threshold for short answers, ignored `aiConfidence` weighting, and inapplicability of `fastWrongRatio` to essays. |
| CV2 | **Escalating cooldowns** | First failure: 24h. Second: 48h. Third+: 72h. Requires attempt history query in generate endpoint. |
| CV3 | **Per-course passing threshold config** | Instructors set `passingThreshold` per course (e.g. 80 for advanced). Requires instructor admin panel (see Section 2.2). |
| CV4 | **Per-course cooldown duration config** | Same — instructor sets `cooldownDurationMs` per course. |
| CV5 | **Instructor question review queue** | AI-generated capstone questions surfaced to instructor for approve / reject / edit. Approved questions promoted to seeded pool. |
| CV6 | **Capstone analytics for instructors** | Per-course pass rate, most-failed conceptTags, average attempt count. Part of the instructor dashboard (Section 2.2). |
| CV7 | **Remediation path on failure** | Instead of cooldown-only, offer curated video replay for failed conceptTags before retake. |
| CV8 | **Attempt cap** | Maximum N retakes per course. No limit exists in v1. |

---

## 6. Security & Production Hardening

Things that must be addressed before any real deployment.

| # | Issue | Detail |
|---|---|---|
| S1 | **Password in auth response** | Same as B1 — critical before deployment. |
| S2 | **No role guard on `/course/:courseId`** | Tutors can access the course detail page directly via URL. Needs a role check added to the route guard in `App.jsx`. |
| S3 | **`responseTimeMs` behavioural data exposure** | Timing data per answer is sensitive. Must never appear in any student-facing API response. Currently stored in `TestResult` — confirm no serialisation path leaks it to the client. |
| S4 | **`correctIndex` exposure audit (Capstone)** | `Capstone_test_plan.md` Phase C3.2 — must audit all GET responses on `/api/capstone/*` to confirm `correctIndex` is never sent to client. |
| S5 | **CORS in production** | Currently `cors` is configured for development (`http://localhost:5173`). Needs environment-aware origin configuration before deployment. |
| S6 | **Cookie `secure` flag** | Already environment-gated (`NODE_ENV=production`). Verify it works correctly when deployed over HTTPS. |
| S7 | **JWT secret strength** | `JWT_SECRET` in `.env` — needs to be a cryptographically strong random string in production, not a simple word. |
| S8 | **Rate limiting** | No rate limiting on auth routes (`/api/auth/signup`, `/api/auth/login`). Brute-force attacks are unrestricted. Add `express-rate-limit`. |
| S9 | **Input sanitisation** | `conceptTag` has a regex validator on the schema. Other string inputs (course titles, question text) have no sanitisation. XSS via stored content is theoretically possible if content is ever rendered as raw HTML. |

---

## 7. Infrastructure / DevOps (Pre-Deployment)

| # | Task | Detail |
|---|---|---|
| I1 | **Environment variable management** | Currently all config is in a local `.env` file. Needs a secrets management strategy for deployment (e.g. Railway/Render environment variables, or Doppler). |
| I2 | **MongoDB indexes audit** | Several indexes are recommended in design docs but not confirmed added: `{ studentId, courseId, evaluationStatus }` on TestResult (FP5 above), compound index on Progress. Run `db.collection.getIndexes()` and add missing ones. |
| I3 | **MOCK_DATA.json** | 211KB file at the project root. Presumably for seeding — no seed script consumes it. Either write the seed script or delete the file. |
| I4 | **Production build verification** | `vite build` on frontend has not been verified. Potential issues: hardcoded `localhost:3001` URLs in `axios.js` and Socket.IO connection string in `DashboardPage.jsx`. Need environment-aware base URLs. |
| I5 | **Error monitoring** | No error monitoring (Sentry etc.) wired up. Silent failures (e.g. fingerprint update failures) are only logged to console. In production these would be invisible. |

---

## 8. Summary — Priority Order

Working from most to least blocking for a usable, shippable product:

**Must fix before showing to any real user:**
- B1 (password in response), B3 (course routes), S1, S2, S8

**Should fix before calling it production-ready:**
- B2 / TD5 (studentId ref mismatch — requires migration planning)
- B4 / TD7 (SCS silent failure root cause)
- TD3 (difficulty filter broken)
- I4 (hardcoded localhost URLs)
- S5 (CORS), S3 (timing data exposure audit)

**Important but not blocking:**
- Section 2 incomplete features (enrollment, instructor dashboard, admin)
- TD1, TD2 (fingerprint algorithm gaps)
- TD4 (aiAnalysis on end-of-course tests)

**Nice to have / future roadmap:**
- Section 5 (Capstone v2)
- Section 4 (Fingerprint enhancements)
- Section 3 remaining TD items
- Section 7 infrastructure items

---

*Document generated 2026-04-14. Update after each session as items are resolved.*
