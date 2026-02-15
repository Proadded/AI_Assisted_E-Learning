import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getCourseVideos, getVideo, markWatched } from "../controllers/video.controller.js";

const router = express.Router();

router.get("/course/:courseId", protectRoute, getCourseVideos);
router.get("/:videoId", protectRoute, getVideo);
router.put("/:videoId/watch", protectRoute, markWatched);

export default router;
