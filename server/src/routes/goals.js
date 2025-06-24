const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

// Routes for goals
router.get("/goals", auth, getGoals);
router.post("/goals", auth, createGoal);
router.put("/goals/:id", auth, updateGoal);
router.delete("/goals/:id", auth, deleteGoal);

module.exports = router;
