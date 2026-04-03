// routes/test.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getTest, submitTest, getResult } from "../controllers/test.controller.js";

const router = express.Router();

router.get("/video/:videoId", protectRoute, getTest);
router.post("/:testId/submit", protectRoute, submitTest);
router.get("/result/:resultId", protectRoute, getResult);

export default router;