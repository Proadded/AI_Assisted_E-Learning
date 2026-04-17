import express from "express";
import {
  getCapstoneStatus,
  generateCapstone,
  submitCapstone,
  getCapstoneResult,
} from "../controllers/capstone.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All capstone routes require authentication
router.use(protectRoute);

router.get("/status/:courseId", getCapstoneStatus);
router.post("/generate/:courseId", generateCapstone);
router.post("/submit/:sessionId", submitCapstone);
router.get("/result/:sessionId", getCapstoneResult);

export default router;
