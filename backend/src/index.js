import express from "express";
import authRoutes from "./routes/auth.route.js";
import videoRoutes from "./routes/video.route.js";
import testRoutes from "./routes/test.route.js";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/tests", testRoutes);


const PORT = process.env.PORT;



app.listen(PORT, () => {
  console.log(`Server is running on PORT:` + PORT);
  connectDB();
});