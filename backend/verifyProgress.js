import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './src/lib/db.js';
import User from './src/models/user.model.js';
import Progress from './src/models/progress.model.js';

dotenv.config();

async function run() {
  await connectDB();
  const student = await User.findOne({ role: 'student' }).lean();
  if (!student) {
    console.log('No student found');
    process.exit(1);
  }
  
  const progresses = await Progress.find({ studentId: student._id }).lean();
  if (!progresses || progresses.length === 0) {
    console.log('MISSING:progress document');
  } else {
    console.log(JSON.stringify(progresses, null, 2));
    
    console.log('\n---SUMMARY ONLY---');
    const allTestsPassed = progresses.some(p => p.allTestsPassed === true);
    const courseComplete = progresses.some(p => p.courseComplete === true);
    
    let capstonePassed = 'does not exist';
    const hasCapstoneFlag = progresses.some(p => 'capstonePassed' in p);
    if (hasCapstoneFlag) {
        // Technically some might be false, some true if multiple docs exist. 
        // We'll check if ANY document has it set to true.
        capstonePassed = progresses.some(p => p.capstonePassed === true);
    }
    
    console.log('allTestsPassed: ' + allTestsPassed);
    console.log('courseComplete: ' + courseComplete);
    console.log('capstonePassed: ' + capstonePassed);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(console.error);
