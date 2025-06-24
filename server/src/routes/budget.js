const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics,
  getBudgetSpending,
  checkBudgetAlerts,
  getBudgetSummary,
} = require("../controllers/budgetController");

// Basic CRUD routes
router.get("/budgets", auth, getBudgets);
router.post("/budgets", auth, createBudget);
router.put("/budgets/:id", auth, updateBudget);
router.delete("/budgets/:id", auth, deleteBudget);

// Enhanced analytics routes
router.get("/budgets/summary", auth, getBudgetSummary);
router.get("/budgets/alerts", auth, checkBudgetAlerts);
router.get("/budgets/:id/analytics", auth, getBudgetAnalytics);
router.get("/budgets/:id/spending", auth, getBudgetSpending);

module.exports = router;
