import express from "express";
import authRoutes from "./routes/auth.route.js";
const app = express();
const PORT = 3000;

// const users = require("../MOCK_DATA.json")
app.use("/api/auth", authRoutes);



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});