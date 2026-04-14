console.log("[INDEX] Server file loaded at:", new Date().toISOString());
import "./env.js";

import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import authRoutes from "./routes/auth.route.js";
import videoRoutes from "./routes/video.route.js";
import testRoutes from "./routes/test.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import courseRoutes from "./routes/course.route.js";
import progressRoutes from "./routes/progress.route.js";
import studentContextRoutes from "./routes/studentContext.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import capstoneRoutes from "./routes/capstone.route.js";
import "./lib/cascadeHooks.js";

const app = express();


app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/student-context", studentContextRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/capstone", capstoneRoutes);


const PORT = process.env.PORT;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", credentials: true },
});
app.set("io", io); // accessible in controllers via req.app.get("io")

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});