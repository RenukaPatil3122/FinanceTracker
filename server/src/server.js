const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/database");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budget");
const goalRoutes = require("./routes/goals");
const predictionRoutes = require("./routes/predictions");
const recommendationRoutes = require("./routes/recommendations");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api", usersRoutes);
app.use("/api", transactionRoutes);
app.use("/api", budgetRoutes);
app.use("/api", goalRoutes);
app.use("/api", predictionRoutes);
app.use("/api", recommendationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Personal Finance Tracker API is running!" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
