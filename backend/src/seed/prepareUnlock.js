import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Progress from "../models/progress.model.js";
import Test from "../models/quiz.model.js";
import TestResult from "../models/testResult.model.js";

dotenv.config();

async function run() {
  await connectDB();
  const student = await User.findOne({ role: "student" });
  if (!student) {
    console.log("No student found in DB.");
    process.exit(1);
  }

  const course = await Course.findOne({ title: /JavaScript/i });
  if (!course) {
    console.log("JS Course not found.");
    process.exit(1);
  }

  console.log(`Preparing UI unlock test for student: ${student.email}`);

  // We want to pass all tests EXCEPT ONE, so you can do the last one manually
  const tests = await Test.find({ courseId: course._id, isReusable: false });
  if (tests.length === 0) {
    console.log("No tests found for course.");
    process.exit(1);
  }

  const testsToPass = tests.slice(0, tests.length - 1);
  const testToLeave = tests[tests.length - 1];

  for (const test of testsToPass) {
    const existing = await TestResult.findOne({ studentId: student._id, testId: test._id, passed: true });
    if (!existing) {
      const result = await TestResult.create({
        studentId: student._id,
        testId: test._id,
        courseId: course._id,
        videoId: test.videoId,
        answers: [],
        evaluationStatus: "complete",
        totalScore: 100,
        passed: true
      });
      await Progress.findOneAndUpdate(
        { studentId: student._id, videoId: test.videoId },
        { testTaken: true, testScore: 100, testResultId: result._id },
        { upsert: true }
      );
    }
  }

  // Clear the last test so it can trigger the transition!
  await TestResult.deleteMany({ studentId: student._id, testId: testToLeave._id });
  await Progress.findOneAndUpdate(
    { studentId: student._id, videoId: testToLeave._id },
    { testTaken: false, allTestsPassed: false, courseComplete: false, capstonePassed: false }
  );

  // Clear capstone progress to ensure pristine conditions
  await Progress.updateMany(
    { studentId: student._id, courseId: course._id },
    { allTestsPassed: false, courseComplete: false, capstonePassed: false }
  );

  console.log(`\n✅ Setup complete!`);
  console.log(`Login as: ${student.email}`);
  console.log(`All tests except the last one have been passed.`);
  console.log(`\n👉 To verify the 'capstone:unlocked' socket:`);
  console.log(`1. Open two browser windows: one on /dashboard, one on the final video in JS course.`);
  console.log(`2. Complete the final test.`);
  console.log(`3. Watch the Dashboard card flip to Available in real-time!`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(console.error);
