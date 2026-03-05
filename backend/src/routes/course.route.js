import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllCourses, getCourseById } from "../controllers/course.controller.js";

const router = express.Router();

router.get("/", protectRoute, getAllCourses);
router.get("/:id", protectRoute, getCourseById);

export default router;
