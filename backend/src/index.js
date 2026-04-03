import "./env.js";
import express from "express";
import authRoutes from "./routes/auth.route.js";
import videoRoutes from "./routes/video.route.js";
import testRoutes from "./routes/test.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import courseRoutes from "./routes/course.route.js";
import progressRoutes from "./routes/progress.route.js";


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


const PORT = process.env.PORT;



app.listen(PORT, () => {
  console.log(`Server is running on PORT:` + PORT);
  connectDB();
});