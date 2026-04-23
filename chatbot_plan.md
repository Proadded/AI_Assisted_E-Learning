# learnmind — AI Doubt Chatbot Implementation Plan

**Feature:** Context-Aware Floating Chatbot with Curiosity Fingerprinting  
**Status:** Pre-implementation — design approved, ready for development  
**Date:** April 2026  
**Depends on:** Existing `StudentFingerprint`, `Progress`, `Video`, `Course` models + `buildStudentContext()` SCS

---

## 1. Feature Summary

A floating "Ask Doubts" popup chatbot accessible from the navbar on every page. The chatbot:

- Answers student questions using **full student context** (fingerprints, watched videos, weak areas, test scores)
- Maintains **multi-turn conversation** within a session (resets on popup close)
- Extracts a **conceptTag** from course-related questions and increments a curiosity counter stored in MongoDB
- Non-course questions are answered but **not stored**
- Curiosity frequency data feeds into **capstone question weighting** via a separate lightweight API call (separate from ATF to preserve token budget)

---

## 2. Architecture Overview

```
Student types message
        ↓
POST /api/chat/message
        ↓
┌─────────────────────────────────────────────┐
│  1. Classify message — course-related?      │
│     → Gemini call #1 (tiny, classification) │
└─────────────────────────────────────────────┘
        ↓                        ↓
  Course-related            Not course-related
        ↓                        ↓
  Extract conceptTag        Answer directly
  Store CuriosityLog        Do NOT store
  Build student context     Return response
  Generate answer
  Return response
        ↓
  Frontend appends to
  in-memory conversation
  history (session only)
```

---

## 3. Database Design

### 3.1  New Collection — `CuriosityLog`

File: `backend/src/models/curiosityLog.model.js`

```js
{
  studentId:   ObjectId,  // ref: User
  courseId:    ObjectId,  // ref: Course (nullable — if question maps to a course)
  conceptTag:  String,    // extracted by Gemini, same format as ATF conceptTags
  rawQuestion: String,    // the student's original message (truncated to 500 chars)
  askedAt:     Date,      // timestamp

  createdAt:   Date,
  updatedAt:   Date,
}

// Index for efficient frequency queries:
curiosityLogSchema.index({ studentId: 1, conceptTag: 1, courseId: 1 });
curiosityLogSchema.index({ studentId: 1, askedAt: -1 });
```

> One document per question asked. Frequency is computed by aggregation (`$group + $count`), not stored as a counter — this preserves the timeline and allows time-windowed queries later.

### 3.2  No changes to existing models

`StudentFingerprint`, `Progress`, `Video`, `Course`, `User` — all read-only from the chatbot's perspective.

---

## 4. API Design

**Base:** `POST /api/chat/message` — protected by `protectRoute`  
**Mount:** `app.use("/api/chat", chatRoutes)` in `index.js`

### 4.1  `POST /api/chat/message`

**Request body:**
```json
{
  "message": "I don't understand how async/await works with fetch",
  "courseId": "69b6ea3eb9ba212775749252",
  "history": [
    { "role": "user", "content": "What is a Promise?" },
    { "role": "assistant", "content": "A Promise is..." }
  ]
}
```

- `history` — full conversation so far, sent by frontend on every turn (session-only, never stored)
- `courseId` — currently active course (from URL or store), used to scope context. Can be null if student is on homepage.

**Response:**
```json
{
  "reply": "Great question! Based on your recent test history...",
  "conceptTag": "async-await",
  "stored": true
}
```

- `stored: true` — course-related, curiosity log written
- `stored: false` — off-topic, answered but not stored
- `conceptTag: null` — could not extract a tag (off-topic or too vague)

### 4.2  `GET /api/chat/curiosity-summary`

Returns the top curiosity conceptTags for the student across all courses. Used by the capstone weighting system.

**Query params:** `courseId` (optional — filter to one course)

**Response:**
```json
{
  "curiosity": [
    { "conceptTag": "async-await", "askCount": 7, "courseId": "..." },
    { "conceptTag": "dom-manipulation", "askCount": 4, "courseId": "..." },
    { "conceptTag": "closures", "askCount": 2, "courseId": "..." }
  ]
}
```

---

## 5. Backend Implementation Plan

### 5.1  Files to create

```
backend/src/
├── models/
│   └── curiosityLog.model.js          # CuriosityLog schema
├── controllers/
│   └── chat.controller.js             # sendMessage, getCuriositySummary
├── routes/
│   └── chat.route.js                  # POST /message, GET /curiosity-summary
```

### 5.2  Files to modify

```
backend/src/
├── index.js                           # mount /api/chat router
├── controllers/capstone.controller.js # read curiosity summary in generateCapstone
├── lib/aiEvaluator.js                 # add classifyAndTag(), generateChatReply()
```

---

## 6. `chat.controller.js` — Full Logic Flow

```js
export const sendMessage = async (req, res) => {
  const { message, courseId, history } = req.body;
  const studentId = req.user._id;

  // ── Step 1: Classify message ───────────────────────────────────────────
  // Gemini call #1 — tiny classification prompt
  // Returns: { isCourseRelated: bool, conceptTag: string | null }
  const classification = await classifyAndTag(message, courseId);

  // ── Step 2: Build student context (only for course-related questions) ──
  let studentContext = null;
  if (classification.isCourseRelated) {
    studentContext = await buildStudentContext(studentId);
    // Slim down to relevant course only to save tokens
    const courseContext = studentContext?.courses?.find(
      c => c.courseId.toString() === courseId
    ) || null;
    studentContext = courseContext;
  }

  // ── Step 3: Generate reply ─────────────────────────────────────────────
  // Gemini call #2 — main reply with context injected
  const reply = await generateChatReply({
    message,
    history,
    studentContext,          // null if off-topic
    isCourseRelated: classification.isCourseRelated,
  });

  // ── Step 4: Store curiosity log (course-related only) ──────────────────
  let stored = false;
  if (classification.isCourseRelated && classification.conceptTag) {
    await CuriosityLog.create({
      studentId,
      courseId: courseId || null,
      conceptTag: classification.conceptTag,
      rawQuestion: message.slice(0, 500),
      askedAt: new Date(),
    });
    stored = true;
  }

  return res.status(200).json({
    reply,
    conceptTag: classification.conceptTag,
    stored,
  });
};
```

---

## 7. `aiEvaluator.js` — Two New Functions

### 7.1  `classifyAndTag(message, courseId)`

**Gemini call #1 — classification only**

Prompt instructs Gemini to return ONLY a JSON object:
```json
{ "isCourseRelated": true, "conceptTag": "async-await" }
```

- `isCourseRelated: true` if the question relates to programming, JavaScript, web development, or the course content
- `conceptTag` must match the ATF tag format (`/^[a-z0-9-]+$/`) — e.g. `"async-await"`, `"dom-manipulation"`
- `conceptTag: null` if no specific concept can be extracted or if off-topic
- Max output tokens: 50 (tiny call — just a JSON blob)

### 7.2  `generateChatReply({ message, history, studentContext, isCourseRelated })`

**Gemini call #2 — the actual answer**

System prompt when `isCourseRelated = true`:
```
You are a friendly programming tutor for the learnmind platform.
The student is learning JavaScript.

Student knowledge context:
- Concepts they are genuinely struggling with (ConceptualGap): ${gapConcepts}
- Concepts they make careless mistakes on (CarelessError): ${carelessConcepts}
- Videos they have watched: ${watchedVideoTitles}
- Their average score: ${avgScore}%
- Their proficiency level: ${proficiency}

Use this context to tailor your explanation:
- If they ask about a ConceptualGap concept, explain it from first principles with examples
- If they ask about a CarelessError concept, remind them they know it well but to slow down
- Reference videos they have watched when relevant
- Keep responses concise (3–5 sentences for simple questions, longer for complex ones)
- Do not reveal internal classification labels (ConceptualGap, CarelessError) to the student
- If the question is off-topic from programming/JavaScript, answer briefly but steer back to the course
```

System prompt when `isCourseRelated = false`:
```
You are a helpful assistant. Answer the question briefly. 
If it relates even loosely to programming or learning, mention that you can help more 
with their JavaScript course. Keep the response under 3 sentences.
```

Multi-turn history is passed as the `messages` array to the Gemini API — each prior exchange is included as alternating user/model turns.

---

## 8. Capstone Integration — Curiosity Weighting

In `generateCapstone()` in `capstone.controller.js`, after fetching fingerprints:

```js
// Fetch curiosity summary for this student + course
const curiosityCounts = await CuriosityLog.aggregate([
  { $match: { 
      studentId: new mongoose.Types.ObjectId(studentId), 
      courseId: courseObjId 
  }},
  { $group: { _id: "$conceptTag", askCount: { $sum: 1 } }},
  { $sort: { askCount: -1 } }
]);

// Build curiosity boost map: { "async-await": 7, "closures": 3 }
const curiosityBoost = {};
curiosityCounts.forEach(c => { curiosityBoost[c._id] = c.askCount; });

// Apply curiosity boost to bucket classification:
// A concept with high curiosity + Uncertain classification 
// gets promoted to act like ConceptualGap for question weighting
const CURIOSITY_THRESHOLD = 3; // asked 3+ times → treat as gap-level priority

for (const fp of fingerprints) {
  if (
    fp.classification === "Uncertain" &&
    (curiosityBoost[fp.conceptTag] || 0) >= CURIOSITY_THRESHOLD
  ) {
    // Promote to ConceptualGap bucket for this capstone only
    conceptTagsByBucket["ConceptualGap"].push(fp.conceptTag);
    conceptTagsByBucket["Uncertain"] = conceptTagsByBucket["Uncertain"]
      .filter(t => t !== fp.conceptTag);
    console.log(`[Capstone] Curiosity-promoted: ${fp.conceptTag} (asked ${curiosityBoost[fp.conceptTag]}x)`);
  }
}
```

> This uses a separate aggregation query — no extra Gemini tokens. The promotion is non-destructive — it only affects the capstone bucket assignment for this session, not the actual `StudentFingerprint` classification.

---

## 9. Frontend Implementation Plan

### 9.1  Files to create

```
frontend/src/
├── store/
│   └── useChatStore.js                # Zustand store for chat state
├── components/
│   └── ChatbotPopup.jsx               # Full chat UI component
```

### 9.2  Files to modify

```
frontend/src/
├── components/Navbar.jsx              # Add "Ask Doubts" button beside Dashboard
├── App.jsx                            # Pass courseId context to chatbot
```

---

## 10. `useChatStore.js` — State Shape

```js
{
  isOpen: false,               // popup open/closed
  history: [],                 // [{ role: "user"|"assistant", content: string }]
  isLoading: false,            // waiting for reply
  error: null,
}

// Actions:
openChat()
closeChat()                    // clears history (session-only)
sendMessage(message, courseId) // POST /api/chat/message, appends to history
clearHistory()
```

---

## 11. `ChatbotPopup.jsx` — UI Spec

**Trigger:** Button in Navbar labeled "Ask Doubts" with a chat bubble icon, positioned beside the Dashboard button. Only visible when `authUser` exists.

**Popup dimensions:** Fixed position, bottom-right corner, `400px wide × 560px tall`

**Layout:**
```
┌─────────────────────────────────┐
│  🤖 Ask Doubts          [✕]    │  ← Header, close button clears history
├─────────────────────────────────┤
│                                 │
│  [Assistant bubble]             │  ← Scrollable message area
│  Hi! I'm your learnmind tutor. │
│  Ask me anything about your    │
│  JavaScript course.            │
│                                 │
│          [User bubble]          │
│          How does async work?   │
│                                 │
│  [Assistant bubble]             │
│  Great question! Based on your  │
│  progress, you've watched the   │
│  async/await video but it's     │
│  still a ConceptualGap for you. │
│  Let's break it down...         │
│                                 │
├─────────────────────────────────┤
│  [Type your question...] [Send] │  ← Input, Enter to send
└─────────────────────────────────┘
```

**Behaviour:**
- Opens as a slide-up popup (CSS transform animation)
- Message bubbles: user = right-aligned amber, assistant = left-aligned ivory
- Loading state: animated typing indicator (three dots) while waiting for Gemini
- Auto-scrolls to latest message on each new reply
- `courseId` is read from React Router `useParams()` if on a course page, otherwise null
- Session resets on popup close (history cleared from Zustand)
- Does NOT use `localStorage` — state is in-memory only

**CSS prefix:** `cb-` (chatbot)

---

## 12. Token Budget Analysis

Per student message, two Gemini calls are made:

| Call | Purpose | Est. Input Tokens | Est. Output Tokens |
|---|---|---|---|
| `classifyAndTag` | Classification + tag extraction | ~150 | ~20 |
| `generateChatReply` | Full contextual answer | ~800–1200 | ~200–400 |
| **Total per message** | | **~950–1350** | **~220–420** |

**Multi-turn cost:** Each turn includes prior history. At 10 turns, input grows by ~200 tokens per turn as history accumulates. Cap history at **last 10 exchanges** to prevent unbounded growth.

**Well within Gemini 2.5 Flash-Lite limits:**
- 250,000 TPM — a 10-turn conversation uses ~15,000 tokens total
- 30 RPM — two calls per message = 2 RPM per active student

---

## 13. Implementation Order

```
Phase 1 — Backend (no frontend changes needed to test)
  1. curiosityLog.model.js
  2. classifyAndTag() in aiEvaluator.js
  3. generateChatReply() in aiEvaluator.js
  4. chat.controller.js (sendMessage + getCuriositySummary)
  5. chat.route.js
  6. Mount in index.js
  7. Test via Postman/Thunder Client

Phase 2 — Frontend
  8. useChatStore.js
  9. ChatbotPopup.jsx
  10. Wire into Navbar.jsx
  11. Pass courseId from active route

Phase 3 — Capstone Integration
  12. Add curiosity boost logic in capstone.controller.js
  13. Test curiosity-promoted concepts appearing in capstone
```

---

## 14. Known Constraints and Decisions

| Decision | Rationale |
|---|---|
| Session-only history | No `ChatSession` model needed. Simpler. History resets on close which is expected behaviour for a doubt-clearing popup. |
| Separate classification call | Keeps the main reply prompt clean. Classification is a tiny call (~20 output tokens). |
| Raw question stored (truncated 500 chars) | Allows future features like showing the student "your most asked questions". |
| Curiosity threshold = 3 | Prevents a single off-hand question from inflating capstone weighting. Tunable constant. |
| History capped at 10 exchanges | Prevents unbounded token growth on long sessions. Oldest messages dropped first. |
| courseId nullable | Student may open chat from homepage before entering a course. Context injection is skipped, chat still works. |
| ConceptualGap context injected | Only gap concepts are surfaced to Gemini — same philosophy as the capstone AI, no noise from CarelessError concepts. |

---

## 15. Out of Scope (Future Enhancements)

- Persistent chat history across sessions (would require `ChatSession` model)
- Voice input
- Image/code snippet uploads
- Instructor-facing view of what students ask most
- Rate limiting per student (beyond Gemini's own limits)
- Push notifications for unanswered questions
