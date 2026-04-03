import express from "express";
import { getCourseProgress } from "../controllers/progress.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/course/:courseId", protectRoute, getCourseProgress);

export default router;