import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getDashboardScores,
  getDashboardTrends,
  getDashboardFingerprints,
  getDashboardSummary,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/scores",       protectRoute, getDashboardScores);
router.get("/trends",       protectRoute, getDashboardTrends);
router.get("/fingerprints", protectRoute, getDashboardFingerprints);
router.get("/summary",      protectRoute, getDashboardSummary);

export default router;
