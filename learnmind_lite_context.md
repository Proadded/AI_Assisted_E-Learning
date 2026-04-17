# LEARNMIND --- LITE CONTEXT (AI-OPTIMIZED)

## 1. Core System

Type: AI-assisted e-learning platform\
Flow: video → test → result → fingerprint → dashboard → AI feedback

## 2. Stack

Backend: - Node.js + Express (ESM) - MongoDB + Mongoose - JWT (httpOnly
cookie) - Socket.IO - Gemini API

Frontend: - React + Vite - Zustand - Axios - Recharts

## 3. Critical Architecture

Test submission → TestResult created → fingerprintEngine.update() →
StudentFingerprint updated → aiEvaluator.generateAiAnalysis() → Progress
updated → Socket emits "context:updated" → Dashboard refetch

## 4. Key Models

User: \_id, email, password(hash), role

StudentFingerprint: studentId (User.\_id) conceptTag courseId attempts,
wrongCount, phrasingsTotal, phrasingsFailed, fastWrongCount
fingerprintScore (0--1) classification

TestResult: testId, studentId(User.\_id) answers\[\], evaluationStatus

Progress: studentId (User.\_id mismatch) videoId watched, testScore
aiAnalysis

## 5. Constraints

-   Uses User.\_id as studentId everywhere
-   Fingerprint engine is core logic
-   Real-time via Socket.IO

## 6. APIs

/auth/* /videos/* /tests/* /student-context/* /dashboard/\*

## 7. Known Issues

-   Password returned in auth ❌
-   ID mismatch ❌
-   Difficulty filter broken ❌
-   aiAnalysis fails for course tests ❌

## 8. Do Not Modify

-   fingerprintEngine
-   StudentContext
-   socket flow
