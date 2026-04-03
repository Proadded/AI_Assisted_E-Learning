# PROJECT_STATE.md — learnmind (AI-Assisted E-Learning Platform)

> **Purpose:** This document is the single source of truth for anyone (human or AI) who needs to understand the full current state of the codebase and immediately begin producing accurate, production-ready code.

---

## 1. Project Overview & Tech Stack

### What It Is
**learnmind** is an AI-assisted e-learning platform where students watch YouTube-embedded course videos, take auto-generated quizzes, and receive personalised AI-powered diagnostic feedback. Instructors (tutors) have their own role-gated dashboard (currently a placeholder). The platform uses a role-based authentication system (`student` / `instructor` / `admin`).

### Backend Tech Stack
| Technology | Version/Detail |
|---|---|
| **Runtime** | Node.js (ES Modules: `"type": "module"`) |
| **Framework** | Express.js `^5.2.1` |
| **Database** | MongoDB via Mongoose `^9.1.1` |
| **Auth** | JSON Web Tokens (`jsonwebtoken ^9.0.3`) — stored as `httpOnly` cookies |
| **Password Hashing** | `bcryptjs ^3.0.3` (salt rounds: 10) |
| **File Uploads** | `cloudinary ^2.8.0` (installed, not yet wired up) |
| **Real-time** | `socket.io ^4.8.1` (installed, not yet wired up) |
| **HTTP parsing** | `cookie-parser ^1.4.7`, `cors ^2.8.6`, `express.json()` |
| **Environment** | `dotenv ^17.2.3` |
| **Dev Server** | `nodemon ^3.1.11` |
| **Package Manager** | npm |

### Frontend Tech Stack
| Technology | Version/Detail |
|---|---|
| **UI Library** | React `^19.2.0` |
| **Build Tool** | Vite `^7.2.4` with `@vitejs/plugin-react ^5.1.1` |
| **CSS** | TailwindCSS v4 via `@tailwindcss/vite` plugin (Vite plugin-based, no config file) + DaisyUI (loaded via `@plugin "daisyui"` in `index.css`) |
| **State Management** | Zustand (via `create()`) — `useAuthStore` |
| **HTTP Client** | Axios (`axiosInstance` in `src/lib/axios.js`) |
| **Routing** | `react-router-dom` (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`) |
| **Notifications** | `react-hot-toast` |
| **Fonts** | Google Fonts — DM Serif Display, DM Sans, DM Mono (loaded in-component via `<style>` injection) |
| **Package Manager** | npm |

### Environment Variables (Backend — `backend/.env`)
```
PORT=<port>               # Server port (used in index.js as process.env.PORT)
MONGO_URI=<connection>    # MongoDB connection string
JWT_SECRET=<secret>       # Secret for JWT signing
NODE_ENV=development      # Controls cookie `secure` flag
```
> Cloudinary credentials are presumably in `.env` but not yet consumed.

---

## 2. System Architecture & Directory Structure

```
E_Learning/
├── backend/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── index.js                    # Express app entry point, middleware, route mounting
│       ├── controllers/
│       │   ├── auth.controller.js      # signup, login, logout, checkAuth
│       │   ├── course.controller.js    # getAllCourses, getCourseById
│       │   ├── video.controller.js     # getCourseVideos, getVideo, markWatched
│       │   └── test.controller.js      # getTest, submitTest (with auto-grading)
│       ├── routes/
│       │   ├── auth.route.js           # /api/auth/*
│       │   ├── course.route.js         # /api/courses/* ⚠️ NOT MOUNTED in index.js
│       │   ├── video.route.js          # /api/videos/*
│       │   └── test.route.js           # /api/tests/*
│       ├── models/
│       │   ├── user.model.js           # Core auth identity
│       │   ├── student.model.js        # Extended student profile (refs User)
│       │   ├── tutor.model.js          # Extended tutor profile (refs User)
│       │   ├── course.model.js         # Course catalogue entry
│       │   ├── video.model.js          # Individual video in a course
│       │   ├── quiz.model.js           # Test/quiz (exported as "Test" model)
│       │   ├── progress.model.js       # Per-student per-video progress + AI analysis
│       │   └── testResult.model.js     # Test result and subjective grading
│       ├── middleware/
│       │   └── auth.middleware.js      # protectRoute — verifies JWT cookie, attaches req.user
│       ├── seed/
│       │   └── seedTests.js            # Seed script for Test documents
│       └── lib/
│           ├── db.js                   # connectDB() — Mongoose connection
│           ├── utils.js                # generateToken() — creates + sets JWT cookie
│           └── aiEvaluator.js          # Gemini API subjective evaluation logic
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                    # React root, wraps App in BrowserRouter + StrictMode
│       ├── App.jsx                     # Route definitions + auth guards + global Toaster
│       ├── index.css                   # @import "tailwindcss"; @plugin "daisyui";
│       ├── store/
│       │   ├── useAuthStore.js         # Zustand store: authUser, login, signup, logout, checkAuth
│       │   └── useTestStore.js         # Zustand store: test fetching, submission, polling
│       ├── lib/
│       │   └── axios.js                # Axios instance — baseURL: http://localhost:3001/api
│       └── components/
│           ├── Navbar.jsx              # Fixed top nav, logo, auth-conditional links
│           ├── HomePage.jsx            # Marketing landing page (scroll reveal, no auth required)
│           ├── LoginPage.jsx           # Email + password form → useAuthStore.login()
│           ├── SignupPage.jsx          # Full registration form → useAuthStore.signup()
│           ├── CoursePage.jsx          # Authenticated course catalogue (/course)
│           ├── DashboardPage.jsx       # Student dashboard STUB (only renders <div>DashboardPage</div>)
│           ├── TutorPlaceholderPage.jsx # "Coming Soon" 404-style page for /tutor route
│           ├── TestPanel.jsx           # Embedded quiz/test UI component
│           └── IMG-20260307-WA0000.png # Garfield image used in TutorPlaceholderPage
│
└── MOCK_DATA.json                       # Large mock dataset (211KB) — likely for DB seeding
```

---

## 3. Data Models & Database Schema

### `User` Collection
```js
{
  email:      String,   // required, unique
  fullName:   String,   // required
  password:   String,   // required, minlength: 6 (stored as bcrypt hash)
  role:       String,   // enum: ["student", "instructor", "admin"], default: "student"
  createdAt:  Date,     // auto (timestamps)
  updatedAt:  Date,     // auto (timestamps)
}
```
> This is the core auth entity. The `_id` of a saved User is used as the JWT payload (`{ userID }`).

---

### `Student` Collection
```js
{
  userId:           ObjectId,  // ref: "User", required, unique (1-to-1 with User)
  courseSubscribed: String,    // single course ID as string (not ObjectId ref)
  educationLevel:   String,

  progress: {
    currentSubject:   String,
    currentTopic:     String,
    completedTopics:  [String],
  },

  performance: {
    averageScore:  Number,
    strongTopics:  [String],
    weakTopics:    [String],
  },

  createdAt: Date,
  updatedAt: Date,
}
```

---

### `Tutor` Collection
```js
{
  userId:           ObjectId,  // ref: "User", required, unique (1-to-1 with User)
  subjectsTeaching: [String],
  qualifications:   String,

  course: [
    {
      courseId: String,        // stored as plain string, not ObjectId
      students: [
        {
          studentsID:     ObjectId,  // ref: "Student"
          enrollmentDate: Date,
          averageScore:   Number,
          weakTopics:     [String],
        }
      ]
    }
  ],

  createdAt: Date,
  updatedAt: Date,
}
```

---

### `Course` Collection
```js
{
  title:       String,    // required
  description: String,    // required
  thumbnail:   String,    // URL string, default: ""
  category:    String,    // default: "General"
  instructor:  String,    // Display name string, default: "Instructor"
  tutorId:     ObjectId,  // ref: "User" (not Tutor)
  videoCount:  Number,    // default: 0
  videos:      [ObjectId], // array of refs to "Video"

  // Temporary mock field — no real progress logic yet
  userProgress: {
    completedVideos: Array,  // default: []
  },

  createdAt: Date,
  updatedAt: Date,
}
```

---

### `Video` Collection
```js
{
  title:       String,
  description: String,
  youtubeUrl:  String,  // Full YouTube URL (embed or watch)
  subject:     String,
  topic:       String,
  duration:    String,  // Format: "MM:SS" e.g. "15:30"
  order:       Number,  // Playlist position (sorted ascending when fetched)
  courseId:    String,  // Stored as plain String, not ObjectId (to match Course._id.toString())
  createdAt:   Date,
  updatedAt:   Date,
}
```

---

### `Test` Collection (file: `quiz.model.js`, model name: `"Test"`)
```js
{
  videoId:      ObjectId,  // ref: "Video"
  courseId:     ObjectId,  // ref: "Course"
  subject:      String,
  topic:        String,
  placement:    String,    // enum: ["after_video", "end_of_course", "both"]
  difficulty:   String,    // enum: ["beginner", "intermediate", "advanced"]
  isReusable:   Boolean,
  tags:         [String],

  questions: [
    {
      question:      String,
      type:          String,  // enum: ["mcq", "short", "essay"]
      options:       [String], // Only for MCQ
      correctAnswer: String,   // Only for MCQ (used in server-side grading)
    }
  ],

  passingScore: Number,  // default: 70 (percentage)
  createdAt:    Date,
  updatedAt:    Date,
}
```
> **Security note:** `correctAnswer` is stripped from responses in `getTest()` before sending to the client.

---

### `Progress` Collection
```js
{
  studentId:  ObjectId,  // ref: "Student"
  videoId:    ObjectId,  // ref: "Video"
  watched:    Boolean,   // default: false
  testTaken:  Boolean,   // default: false
  testScore:  Number,    // percentage 0–100

  // Intended AI analysis output (not yet populated by any AI call)
  aiAnalysis: {
    weakAreas:             [String],
    strengths:             [String],
    personalizedFeedback:  String,
    recommendations:       [String],
  },

  testResultId:   ObjectId, // ref: "TestResult"
  courseComplete: Boolean,
  allTestsPassed: Boolean,

  createdAt: Date,
  updatedAt: Date,
}
```

---

### `TestResult` Collection (file: `testResult.model.js`, model name: `"TestResult"`)
```js
// Extracted as a named schema to avoid Mongoose `type` keyword conflicts
const answerSchema = new mongoose.Schema({
  questionId:    ObjectId,
  questionType:  String,   // "mcq" | "short_answer" | "essay" (renamed from `type` to avoid conflict)
  studentAnswer: String,
  isCorrect:     Boolean,  // MCQ only
  aiScore:       Number,   // 0–100, subjective only
  aiConfidence:  Number,   // 0–1
  aiFeedback:    String,
}, { _id: false });

{
  testId:           ObjectId, // ref: "Test", required
  studentId:        ObjectId, // ref: "User", required
  courseId:         ObjectId, // ref: "Course"
  videoId:          ObjectId, // ref: "Video"

  answers:          [answerSchema], // Array of subdocuments

  totalScore:       Number,   // weighted aggregate
  passed:           Boolean,
  attemptNumber:    Number,   // default: 1
  evaluationStatus: String,   // enum: ["pending", "processing", "complete", "failed"], default: "pending"
  createdAt:        Date,
  updatedAt:        Date,
}
```

---

## 4. API Documentation (Backend)

**Base URL:** `http://localhost:3001/api`

All protected routes require a valid `jwt` cookie (set automatically by the browser after login/signup). The `protectRoute` middleware verifies the JWT, looks up the user (sans password), and attaches it to `req.user`.

---

### Auth Routes — `/api/auth`

#### `POST /api/auth/signup`
Creates a User and a corresponding Student or Tutor profile, then sets JWT cookie.

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass",
  "confirmPassword": "securepass",
  "role": "student"  // or "instructor"
}
```
**Success Response `201`:**
```json
{
  "_id": "...",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "<hashed>",
  "role": "student"
}
```
> ⚠️ The response currently returns the hashed `password` field — this is a security bug.

**Error Responses:** `400` (validation), `500` (server)

---

#### `POST /api/auth/login`
Authenticates a user and sets JWT cookie.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepass"
}
```
**Success Response `200`:**
```json
{
  "_id": "...",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "<hashed>",
  "role": "student"
}
```
> ⚠️ Also returns hashed `password` in response.

---

#### `POST /api/auth/logout`
Clears the JWT cookie.

**No request body.**

**Success Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

#### `GET /api/auth/check` 🔒 Protected
Returns the currently authenticated user (injected by `protectRoute` as `req.user`).

**No request body.**

**Success Response `200`:** The User document (without `password` field, as Mongoose selects `-password`).
```json
{
  "_id": "...",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "role": "student",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### Video Routes — `/api/videos` 🔒 All Protected

#### `GET /api/videos/course/:courseId`
Returns all videos for a course, sorted by `order` ascending.

**Response `200`:**
```json
{
  "videos": [
    {
      "_id": "...",
      "title": "...",
      "description": "...",
      "youtubeUrl": "...",
      "subject": "...",
      "topic": "...",
      "duration": "12:45",
      "order": 1,
      "courseId": "..."
    }
  ]
}
```

---

#### `GET /api/videos/:videoId`
Returns a single video by its ID.

**Response `200`:**
```json
{ "video": { ...videoDocument } }
```

---

#### `PUT /api/videos/:videoId/watch` 🔒 Protected
Marks a video as watched for the authenticated student. Creates a `Progress` document if one doesn't exist (upsert-like logic).

**No request body.**

**Response `200`:**
```json
{ "message": "Marked as watched" }
```
> Uses `req.user._id` as the `studentId`.

---

### Test Routes — `/api/tests` 🔒 All Protected

#### `GET /api/tests/video/:videoId`
Returns the test associated with a video. Correct answers are **stripped** from the response.

**Response `200`:**
```json
{
  "test": {
    "_id": "...",
    "videoId": "...",
    "subject": "...",
    "topic": "...",
    "passingScore": 70,
    "questions": [
      {
        "_id": "...",
        "question": "What is...?",
        "type": "mcq",
        "options": ["A", "B", "C", "D"]
        // correctAnswer is omitted
      }
    ]
  }
}
```
**`404`** if no test found for that `videoId`.

---

#### `POST /api/tests/:testId/submit` 🔒 Protected
Grades the submitted test, updates/creates a `Progress` record, and returns an `evaluationStatus`. Subjective answers return `evaluationStatus: "processing"` to be graded asynchronously.

**Request Body:**
```json
{
  "answers": [
    { "questionId": "<question _id>", "answer": "B" }
  ]
}
```
**Response `200`:**
```json
{
  "resultId": "...",
  "evaluationStatus": "processing",
  "message": "AI is evaluating your written answers."
}
```

---

#### `GET /api/tests/result/:resultId` 🔒 Protected
Returns a `TestResult` document.

**Response `200`:**
```json
{
  "result": { ...testResultDocument }
}
```
> **Note:** Automatically strips `aiFeedback` from responses while `evaluationStatus` is `"processing"`.

---

### Course Routes — `/api/courses` 🔒 All Protected

#### `GET /api/courses`
Returns all courses.

#### `GET /api/courses/:id`
Returns a single course by ID.

---

### Progress Routes — `/api/progress` 🔒 All Protected

#### `GET /api/progress/course/:courseId`
Aggregates and returns per-user video completion for the entire course.

**Response `200`:**
```json
{
  "completedVideoIds": ["<videoId1>", "<videoId2>"],
  "completedCount": 2,
  "totalCount": 13,
  "percentComplete": 15
}
```

---

## 5. Frontend State & Data Flow

### Global State — Zustand (`src/store/useAuthStore.js`)

The entire auth state is managed in a single Zustand store. No React Context or Redux is used.

```js
// State shape:
{
  authUser: null | UserObject,  // Set after login/signup/checkAuth
  isSigningUp: boolean,
  isLoggingIn: boolean,
  isCheckingAuth: boolean,      // true on startup; set false after checkAuth resolves
}

// Actions:
checkAuth()   // GET /auth/check — called once on App mount via useEffect
signup(data)  // POST /auth/signup — sets authUser on success
login(data)   // POST /auth/login  — sets authUser on success
logout()      // POST /auth/logout — clears authUser
```

### HTTP Client — Axios (`src/lib/axios.js`)

A single pre-configured Axios instance is shared across all components:
```js
const axiosInstance = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true,           // Sends the JWT cookie on every request
  headers: { "Content-Type": "application/json" },
});
```
Import path: `import axiosInstance from "../lib/axios"` (or `"../lib/axios.js"`).

### Routing & Auth Guards (`src/App.jsx`)

React Router v6 `<Routes>/<Route>` structure with inline `<Navigate>` guards:

| Route | Unauthenticated | Student | Instructor/Tutor |
|---|---|---|---|
| `/` | `<HomePage>` | `<HomePage>` | `<HomePage>` |
| `/login` | `<LoginPage>` | → `/course` | → `/tutor` |
| `/signup` | `<SignupPage>` | → `/course` | → `/tutor` |
| `/course` | → `/login` | `<CoursePage>` | → `/tutor` |
| `/course/:courseId` | → `/login` | `<CourseDetailPage>` | `<CourseDetailPage>` |
| `/dashboard` | → `/login` | `<DashboardPage>` | → `/tutor` |
| `/tutor` | → `/login` | → `/course` | `<TutorPlaceholderPage>` |

Role detection: `authUser.role === "student"` → `isStudent`; `authUser.role === "instructor" || "tutor"` → `isTutor`.
> ⚠️ Note: `/course/:courseId` currently has no role guard, so tutors can access it directly via URL.

**Auth check flow:** `App` calls `checkAuth()` on mount. While `isCheckingAuth && !authUser`, a fullscreen spinner is shown. This prevents route flicker on page reload.

### Component-Level Data Fetching

- **`CoursePage`**: Uses local `useState` + `useEffect` to fetch courses and progress in parallel on mount. Merges `realProgress` into course cards. Has local `search` and `filter` state.
- **`CourseDetailPage`**: Uses Zustand `useCourseStore` for `fetchCourse`, `activeLesson`, `markLessonComplete`. Embeds YouTube `VideoPlayer`.
- **`LoginPage`**: Local `useState` for `formData`, calls `useAuthStore().login(formData)`.
- **`SignupPage`**: Local `useState` for `formData` (fullName, email, password, confirmPassword, role), calls `useAuthStore().signup(formData)`.
- **`Navbar`**: Reads `authUser`, `logout` from `useAuthStore` directly.
- **`DashboardPage`**: Only reads `authUser` from store; renders nothing useful yet.

---

## 6. Third-Party Integrations

| Integration | Status | Where Used |
|---|---|---|
| **Google Fonts (DM Serif Display, DM Sans, DM Mono)** | ✅ Active | Injected via `<style dangerouslySetInnerHTML>` inside each major component (Navbar, HomePage, LoginPage, SignupPage, TutorPlaceholderPage, CoursePage, CourseDetailPage) |
| **YouTube** | ✅ Active | `VideoPlayer` sub-component in `CourseDetailPage` uses the YouTube IFrame API to embed and track watch duration (90% completion trigger) |
| **Google Gemini API (google/generative-ai)** | ✅ Active | Model: `gemini-2.5-flash-lite` — used in `backend/src/lib/aiEvaluator.js` for subjective answer evaluation. Requires `GEMINI_API_KEY` in `backend/.env` |
| **Cloudinary** | 🟡 Installed, unused | `cloudinary ^2.8.0` in `backend/package.json`; no controller or route uses it |
| **Socket.IO** | 🟡 Installed, unused | `socket.io ^4.8.1` in `backend/package.json`; not imported in `index.js` |
| **AI (unspecified)** | 🔴 Planned, not built | `Progress.aiAnalysis` schema fields exist (weakAreas, strengths, personalizedFeedback, recommendations) but no AI API call is implemented anywhere |

---

## 7. Coding Standards & Conventions

### Naming Conventions
- **Files:** `kebab-case.js` for backend (`auth.controller.js`, `user.model.js`)
- **Components/Pages:** `PascalCase.jsx` (`LoginPage.jsx`, `CoursePage.jsx`)
- **Variables/Functions:** `camelCase` everywhere
- **CSS Classes (custom):** Each component uses a unique BEM-like prefix (e.g., `lp-` for LoginPage, `sp-` for SignupPage, `nb-` for Navbar, `p404-` for TutorPlaceholder) injected via `<style dangerouslySetInnerHTML={{ __html: CSS }}>` string

### Component Patterns
- **All components are functional components** using React hooks (`useState`, `useEffect`, `useRef`)
- **No class components** anywhere in the codebase
- **Sub-components are defined in the same file** as their parent (e.g., `CourseCard`, `SkeletonCard` inside `CoursePage.jsx`; `HowItWorks`, `FeatureAI` inside `HomePage.jsx`)
- **Custom hooks** are defined inline within their file (e.g., `useScrollReveal` inside `HomePage.jsx`)
- **Inline icon components:** SVG icons are defined as small arrow-function components (`const PlayIcon = () => <svg>...`)
- **Inline CSS:** Heavy use of CSS-in-JS via template literal strings + `dangerouslySetInnerHTML`. Each major component embeds its complete stylesheet this way. Tailwind utility classes are also used alongside

### Backend Patterns
- **ES Modules** (`import`/`export`) — both backend and frontend use `"type": "module"`
- **Async/await** with try/catch in all controllers
- **Error logging:** `console.log("Error in [name] controller:", error.message)` pattern
- **Controller exports:** Named exports only (`export const signup = async (req, res) => {}`)
- **Route files:** Create an Express `Router`, attach handlers, `export default router`
- **JWT:** 7-day expiry, `httpOnly: true`, `sameSite: "strict"`, `secure` in production only
- **Model exports:** `export default ModelName`
- **Mongoose Subdocuments:** `type` is a reserved keyword in Mongoose. Subdocuments with a field named `type` must be extracted into a named schema using `new mongoose.Schema({...}, { _id: false })` to avoid Mongoose misinterpreting the inline definition as a scalar type (e.g., `answerSchema`).

### Error Handling Patterns

**Backend:**
```js
try {
  // ...logic
} catch (error) {
  console.log("Error in [controller name]:", error.message);
  return res.status(500).json({ message: "Server error" });
}
```

**Frontend (Zustand store):**
```js
try {
  const res = await axiosInstance.post("/auth/login", data);
  set({ authUser: res.data });
  toast.success("Logged in successfully");
} catch (err) {
  toast.error(err.response.data.message);  // Uses server's message field directly
}
```

**Frontend (component-level):**
```js
try {
  const res = await axiosInstance.get("/courses");
  setCourses(res.data);
} catch (err) {
  console.error("Failed to load courses:", err);
  toast.error("Failed to load courses");
} finally {
  setLoading(false);
}
```

### Design System (CSS Variables)
All components share the same CSS custom property palette:
```css
--ivory: #F7F5F0;       /* Background */
--ivory-dark: #EDE9E1;
--charcoal: #2A2723;    /* Dark text, buttons */
--ink: #1A1815;         /* Darkest text */
--amber: #D4860A;       /* Brand accent */
--amber-light: #F0A830;
--amber-pale: #FDF3E1;  /* Light amber bg */
--warm-grey: #C8C2B8;
--text-muted: #7A756D;
--text-body: #4A4540;
--border: rgba(42,39,35,0.1);
```

---

## 8. Current Status & Known Issues

### ✅ Fully Implemented & Working

- **Authentication:** Signup (with Student/Tutor profile creation), Login, Logout, `checkAuth` on page reload. JWT stored in `httpOnly` cookie, 7-day expiry.
- **Role-based routing:** Student → `/course`, Instructor → `/tutor`, with proper auth guards on all protected routes.
- **Homepage:** Fully built marketing page with scroll-reveal animations, "How It Works" steps, feature sections, footer.
- **Login & Signup pages:** Complete forms with validation, password strength meter (signup), show/hide password toggle, toast notifications, loading states.
- **Course Catalogue UI (`CoursePage`):** Grid of course cards with search, filter tabs (All / In Progress / Completed), progress bar on enrolled courses, skeleton loading states. Uses real data merged from `/api/progress/course/:id`.
- **Course Detail UI (`CourseDetailPage`):** Two-column layout with YouTube `VideoPlayer` and `LessonList`. Auto-marks lessons as watched at 90% completion.
- **Navbar:** Fixed, glassmorphism design, shows greeting + Dashboard + Courses + Logout when authenticated, just logo when not.
- **Backend models:** All 7 models defined (`User`, `Student`, `Tutor`, `Course`, `Video`, `Test`, `Progress`).
- **Video API:** `GET /api/videos/course/:courseId` and `GET /api/videos/:videoId` functional.
- **Watch API:** `PUT /api/videos/:videoId/watch` creates/updates Progress.
- **Progress API:** `GET /api/progress/course/:courseId` aggregates course progress for the student.
- **Test grading API:** Now supports MCQ + subjective question types, creates `TestResult` documents, and fires async AI evaluation.
- **AI evaluation:** AI-based subjective answer grading implemented and working via Gemini API (`aiEvaluator.js`).
- **TestResult model:** stores per-attempt answers, scores, AI feedback, and evaluation status.
- **Test submission pipeline:** MCQ grading is instant, subjective answers are evaluated asynchronously via Gemini, results are polled by the frontend.
- **Weighted scoring:** `calculateWeightedScore` in `aiEvaluator.js` handles mixed MCQ and subjective question types.

### 🔴 Broken / Critical Issues

1. **Password returned in auth responses:** Both `login` and `signup` controllers return `password: savedUser.password` (the bcrypt hash) in the JSON response. This should be removed.

3. **`req.user._id` used as `studentId`:** In `video.controller.markWatched` and `test.controller.submitTest`, `req.user._id` (the User `_id`) is stored as the `Progress.studentId`, but the `Progress` schema declares `studentId` as `ref: "Student"`. This is semantically incorrect — it should look up the Student document's `_id` using the User's `_id`.

### 🟡 Incomplete / Under Development

- **Course completion gate:** `checkCourseCompletion` implemented in `test.controller.js`, not yet verified end-to-end.
- **TestPanel UI:** component built, submission and polling flow implemented, results display not yet fully verified.
- **Dashboard page (`/dashboard`):** Only renders a bare `<div>DashboardPage</div>`. Needs full implementation.
- **Tutor dashboard (`/tutor`):** Shows a "Coming Soon" placeholder page with a Garfield image and an email notify form (non-functional — just sets `sent: true` locally).
- **AI feedback:** The `Progress.aiAnalysis` fields exist but nothing populates them. No AI API (OpenAI, Claude, etc.) is integrated yet despite the UI marketing text referencing it.
- **Cloudinary:** Installed but no upload routes exist. Likely intended for course thumbnail uploads.
- **Socket.IO:** Installed but not used anywhere.
- **Admin role:** Defined in the User schema's enum but has no dedicated routes, controllers, or UI.
- **"Forgot password" link:** Present in `LoginPage` (links to `/forgot-password`) but that route doesn't exist.
- **Student enrollment system:** `courseSubscribed` in `Student` is a single plain String — not a proper array of ObjectIds. Enrollment flow (subscribing a student to a course) has no API endpoint.
- **MOCK_DATA.json:** A 211KB file at the root — presumably for seeding the database, but no seed script exists.

---

## 9. Implementation Session Logs

### 2026-03-15
**Backend changes:**
- Fixed critical bug: mounted `course.route.js` in `backend/src/index.js` as `app.use("/api/courses", courseRoutes)`.
- Added `watchedAt: { type: Date }` optional field to `backend/src/models/progress.model.js`.
- Added compound unique index on Progress model: `progressSchema.index({ studentId: 1, videoId: 1 }, { unique: true })`.
- Created `progress.controller.js` with `getCourseProgress` function that aggregates per-user video completion for an entire course and returns `{ completedVideoIds, completedCount, totalCount, percentComplete }`.
- Created `progress.route.js` with `GET /course/:courseId` protected by `protectRoute`.
- Mounted progress routes in `backend/src/index.js` as `app.use("/api/progress", progressRoutes)`.

**Frontend changes:**
- Created `frontend/src/lib/utils.js` with `extractYouTubeId(url)` utility that handles both `youtube.com/watch?v=` and `youtu.be/` URL formats.
- Created `useCourseStore.js` (Zustand) managing course state with actions: `fetchCourse`, `setActiveLesson`, `markLessonComplete` (optimistic update + revert on failure), `resetCourse`.
- Created `CourseDetailPage.jsx` containing `VideoPlayer` (YouTube API integration, 90% watch threshold detection via polling), `LessonList` (duration formatting, visual cues), and `CourseProgressBar`.
- Added `/course/:courseId` protected route in `App.jsx`.
- Fixed `CoursePage.jsx` course cards to fetch real progress data from `/api/progress/course/:id` in parallel with course fetch, completely replacing the stale `userProgress.completedVideos` embedded field used previously.

**Data:**
- Created `backend/src/seed/seedCourse.js` — seed script for "JavaScript for Beginners" course with 13 videos from the Apna College javascript playlist. Run with `node src/seed/seedCourse.js` from the backend folder.

**Known remaining issues (not fixed in this session):**
- `Progress.studentId` stores `User._id` but is declared as `ref: "Student"` — semantic mismatch, documented in code comments, requires a data migration to fix properly.
- `Course.videoCount` is a manual field that can desync from actual video count — should eventually be replaced with a computed value.
- No role guard on `/course/:courseId` route — tutors can access it directly via URL.

### 2026-03-22
**Session Summary:**
Implemented complete MCQ and subjective AI-assisted testing pipeline.

- **Models:** 
  - Created `TestResult` collection with `answerSchema` subdocument.
  - Updated `Test` (`quiz.model.js`) with placement and difficulty metadata.
  - Updated `Progress` to track completion state and test links.
  - *Bugfix:* Extracted `answerSchema` in Mongoose to avoid scalar-type `type` keyword conflict, renaming standard target to `questionType`.
- **Controllers & Logic:** 
  - Written `test.controller.js` logic completely accommodating async evaluation triggers for non-MCQ.
  - Integrated `aiEvaluator.js` utilizing Google Gemini (`gemini-2.5-flash-lite`).
  - Added `checkCourseCompletion` gating method on tests passing.
- **Data:** Created `seedTests.js` to pre-populate exams.
- **Frontend:** 
  - Built out complete `TestPanel.jsx` evaluation interface component.
  - Incorporate `useTestStore.js` (Zustand) for submission state and result polling.
  - Formally appended `TestPanel` onto the `CourseDetailPage.jsx` component routing logic.

### 2026-03-29
**Backend changes:**
- Added `placement`, `courseId`, `difficulty`, `isReusable`, `tags` fields to Test schema (`quiz.model.js`)
- Created `testResult.model.js` with `answerSchema` subdocument (note: field named `questionType` not `type` — `type` is a reserved Mongoose keyword and cannot be used as a subdocument field name)
- Extended `progress.model.js` with `testResultId`, `courseComplete`, `allTestsPassed` fields
- Created `backend/src/lib/aiEvaluator.js` — Gemini-powered subjective grading with `evaluateSubjectiveAnswer` and `calculateWeightedScore`
- Rewrote `test.controller.js` — `submitTest` now handles mixed question types, creates `TestResult`, fires async AI evaluation. Added `getResult` for polling. Added internal helpers `evaluateSubjectiveAnswersAsync`, `finalizeResult`, `checkCourseCompletion`
- Added `GET /api/tests/result/:resultId` route to `test.route.js`
- Created `backend/src/env.js` — explicit dotenv path loader using `fileURLToPath` and `dirname` to ensure `.env` loads correctly regardless of working directory. Imported as first line in `index.js`
- Created `backend/src/seed/seedTests.js` — seeds one test per video with 2 MCQ + 1 short answer question

**Frontend changes:**
- Created `frontend/src/store/useTestStore.js` — Zustand store with `fetchTest`, `submitAnswers`, `pollResult`, `clearTest` actions
- Created `frontend/src/components/TestPanel.jsx` — handles idle, taking, submitting, polling, and results phases
- Updated `CourseDetailPage.jsx` — renders `TestPanel` below video player when a lesson is active

**Known issues resolved:**
- Mongoose reserved keyword `type` inside inline subdocument array caused `Cast to [string] failed` validation error — fixed by extracting `answerSchema` as a named schema
- `dotenv.config()` was not loading before ES Module imports executed — fixed via dedicated `env.js` with explicit `__dirname`-relative path
