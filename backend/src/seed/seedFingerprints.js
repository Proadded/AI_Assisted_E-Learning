import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";

dotenv.config();
await connectDB();

const STUDENT_ID = new mongoose.Types.ObjectId("69e49ce68ae8d96636e94971");
const COURSE_ID = new mongoose.Types.ObjectId("69b6ea3eb9ba212775749252");
const REF_RESULT_ID = new mongoose.Types.ObjectId("69e4c10c22fe03c91f47f5e0");

const fingerprints = [
  { conceptTag: "loops", attempts: 8, wrongCount: 6, fastWrongCount: 0, phrasingsFailed: 3, phrasingsTotal: 4, conceptsFailed: 2, conceptsRecovered: 0, fingerprintScore: 0.72, classification: "ConceptualGap" },
  { conceptTag: "dom-manipulation", attempts: 9, wrongCount: 6, fastWrongCount: 0, phrasingsFailed: 4, phrasingsTotal: 5, conceptsFailed: 2, conceptsRecovered: 0, fingerprintScore: 0.68, classification: "ConceptualGap" },
  { conceptTag: "async-await", attempts: 7, wrongCount: 5, fastWrongCount: 0, phrasingsFailed: 3, phrasingsTotal: 4, conceptsFailed: 2, conceptsRecovered: 0, fingerprintScore: 0.65, classification: "ConceptualGap" },
  { conceptTag: "operators", attempts: 6, wrongCount: 4, fastWrongCount: 0, phrasingsFailed: 3, phrasingsTotal: 4, conceptsFailed: 1, conceptsRecovered: 0, fingerprintScore: 0.61, classification: "ConceptualGap" },
  { conceptTag: "arrays", attempts: 5, wrongCount: 2, fastWrongCount: 0, phrasingsFailed: 2, phrasingsTotal: 3, conceptsFailed: 1, conceptsRecovered: 0, fingerprintScore: 0.44, classification: "Uncertain" },
  { conceptTag: "game-logic", attempts: 5, wrongCount: 2, fastWrongCount: 0, phrasingsFailed: 2, phrasingsTotal: 3, conceptsFailed: 1, conceptsRecovered: 0, fingerprintScore: 0.40, classification: "Uncertain" },
  { conceptTag: "event-handling", attempts: 4, wrongCount: 2, fastWrongCount: 0, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 1, conceptsRecovered: 0, fingerprintScore: 0.38, classification: "Uncertain" },
  { conceptTag: "classes", attempts: 4, wrongCount: 2, fastWrongCount: 0, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 1, conceptsRecovered: 0, fingerprintScore: 0.35, classification: "Uncertain" },
  { conceptTag: "conditionals", attempts: 4, wrongCount: 1, fastWrongCount: 0, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 0, conceptsRecovered: 0, fingerprintScore: 0.32, classification: "Uncertain" },
  { conceptTag: "js-basics", attempts: 5, wrongCount: 1, fastWrongCount: 1, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 0, conceptsRecovered: 0, fingerprintScore: 0.12, classification: "CarelessError" },
  { conceptTag: "functions", attempts: 5, wrongCount: 1, fastWrongCount: 1, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 0, conceptsRecovered: 0, fingerprintScore: 0.09, classification: "CarelessError" },
  { conceptTag: "string-methods", attempts: 5, wrongCount: 1, fastWrongCount: 1, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 0, conceptsRecovered: 0, fingerprintScore: 0.11, classification: "CarelessError" },
  { conceptTag: "math-methods", attempts: 5, wrongCount: 1, fastWrongCount: 1, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 0, conceptsRecovered: 0, fingerprintScore: 0.08, classification: "CarelessError" },
  { conceptTag: "fetch-api", attempts: 5, wrongCount: 1, fastWrongCount: 1, phrasingsFailed: 1, phrasingsTotal: 3, conceptsFailed: 0, conceptsRecovered: 0, fingerprintScore: 0.10, classification: "CarelessError" },
];

// To this — delete ALL pending sessions for this student:
await mongoose.connection.collection("capstonesessions").deleteMany({ 
  studentId: new mongoose.Types.ObjectId("69e49ce68ae8d96636e94971"),
  status: "pending"
});
console.log("Deleted all pending capstone sessions for student.");

// Clear existing fingerprints for this student
await mongoose.connection.collection("studentfingerprints").deleteMany({ 
  studentId: STUDENT_ID 
});
console.log("Cleared existing fingerprints.");

const now = new Date();
const docs = fingerprints.map(f => ({
  studentId: STUDENT_ID,
  courseId: COURSE_ID,
  algorithmVersion: "1.0",
  conceptsFailed: 0,
  conceptsRecovered: 0,
  lastUpdatedFromResultId: REF_RESULT_ID,
  lastComputedAt: now,
  createdAt: now,
  updatedAt: now,
  ...f
}));

await mongoose.connection.collection("studentfingerprints").insertMany(docs);
console.log(`Inserted ${docs.length} fingerprint documents.`);

const count = await mongoose.connection.collection("studentfingerprints").countDocuments({ studentId: STUDENT_ID });
console.log(`Verified: ${count} fingerprints in DB for this student.`);

await mongoose.disconnect();
process.exit(0);