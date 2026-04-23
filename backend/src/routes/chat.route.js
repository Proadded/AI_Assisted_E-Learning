import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendMessage, getCuriositySummary } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/message", protectRoute, sendMessage);

router.get("/curiosity-summary", protectRoute, getCuriositySummary);

export default router;
