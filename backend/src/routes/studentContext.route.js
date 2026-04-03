/**
 * studentContext.route.js
 * Mount in index.js:  app.use("/api/student-context", studentContextRoutes);
 */

import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStudentContext,
  refreshCourseSlice,
} from "../controllers/studentContext.controller.js";

const router = express.Router();

// GET /api/student-context/:studentId
router.get("/:studentId", protectRoute, getStudentContext);

// GET /api/student-context/:studentId/course/:courseId/refresh
router.get("/:studentId/course/:courseId/refresh", protectRoute, refreshCourseSlice);

export default router;