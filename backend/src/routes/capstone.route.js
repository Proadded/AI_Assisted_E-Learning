import express from "express";
import CapstoneSession from "../models/capstoneSession.model.js";
import {
  getCapstoneStatus,
  generateCapstone,
  submitCapstone,
  getCapstoneResult,
} from "../controllers/capstone.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.delete("/clear-test/:studentId", async (req, res) => {
  try {
    const result = await CapstoneSession.deleteMany({ studentId: req.params.studentId });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All capstone routes require authentication
router.use(protectRoute);

router.get("/status/:courseId", getCapstoneStatus);
router.post("/generate/:courseId", generateCapstone);
router.post("/submit/:sessionId", submitCapstone);
router.get("/result/:sessionId", getCapstoneResult);

export default router;
