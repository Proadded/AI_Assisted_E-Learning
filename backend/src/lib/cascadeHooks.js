import StudentFingerprint from "../models/fingerprint.model.js";
import User from "../models/user.model.js";

User.schema.post("findOneAndDelete", async function (deletedUser) {
  if (!deletedUser) return;
  try {
    await StudentFingerprint.deleteMany({ studentId: deletedUser._id });
    console.log(`Cascade deleted fingerprints for user ${deletedUser._id}`);
  } catch (err) {
    console.log("Fingerprint cascade delete failed:", err.message);
  }
});

export default {};
