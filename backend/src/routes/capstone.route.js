import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getCapstoneStatus,
  generateCapstone,
  submitCapstone,
  getCapstoneResult,
} from "../controllers/capstone.controller.js";

const router = express.Router();

router.get("/status/:courseId", protectRoute, getCapstoneStatus);
router.post("/generate/:courseId", protectRoute, generateCapstone);
router.post("/submit/:sessionId", protectRoute, submitCapstone);
router.get("/result/:sessionId", protectRoute, getCapstoneResult);

export default router;
