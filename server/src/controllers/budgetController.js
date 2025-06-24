const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction"); // Assuming you have this model

exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const { category, amount, period, alertThreshold, description } = req.body;

    if (!category || !amount || !period) {
      return res
        .status(400)
        .json({ message: "Category, amount, and period are required" });
    }

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category: category.trim(),
      period,
    });

    if (existingBudget) {
      return res.status(400).json({
        message: `Budget already exists for ${category} (${period})`,
      });
    }

    const budget = new Budget({
      userId: req.user.id,
      category: category.trim(),
      amount: parseFloat(amount),
      period,
      alertThreshold: alertThreshold || 0.8,
      description: description || "",
      analytics: {
        createdAt: new Date(),
        editHistory: [],
        notifications: [],
      },
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, period, alertThreshold, description } = req.body;

    const currentBudget = await Budget.findOne({
      _id: id,
      userId: req.user.id,
    });
    if (!currentBudget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Track changes for analytics
    const changes = {};
    if (category && category !== currentBudget.category)
      changes.category = { from: currentBudget.category, to: category };
    if (amount && amount !== currentBudget.amount)
      changes.amount = { from: currentBudget.amount, to: amount };
    if (period && period !== currentBudget.period)
      changes.period = { from: currentBudget.period, to: period };
    if (alertThreshold && alertThreshold !== currentBudget.alertThreshold)
      changes.alertThreshold = {
        from: currentBudget.alertThreshold,
        to: alertThreshold,
      };

    const updateData = {
      category: category?.trim() || currentBudget.category,
      amount: amount ? parseFloat(amount) : currentBudget.amount,
      period: period || currentBudget.period,
      alertThreshold:
        alertThreshold !== undefined
          ? alertThreshold
          : currentBudget.alertThreshold,
      description:
        description !== undefined ? description : currentBudget.description,
      "analytics.lastUpdated": new Date(),
    };

    // Add to edit history if there are changes
    if (Object.keys(changes).length > 0) {
      await Budget.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        {
          ...updateData,
          $push: {
            "analytics.editHistory": {
              date: new Date(),
              changes,
              previousValues: {
                category: currentBudget.category,
                amount: currentBudget.amount,
                period: currentBudget.period,
                alertThreshold: currentBudget.alertThreshold,
              },
            },
          },
        }
      );
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updateData,
      { new: true }
    );

    res.json(budget);
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully", deletedBudget: budget });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// New: Get budget analytics
exports.getBudgetAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOne({ _id: id, userId: req.user.id });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Get related transactions
    const transactions = await Transaction.find({
      userId: req.user.id,
      category: budget.category,
      type: "expense",
    }).sort({ date: -1 });

    const analytics = {
      budget: budget,
      transactions: transactions,
      summary: {
        totalTransactions: transactions.length,
        totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
        averageTransaction:
          transactions.length > 0
            ? transactions.reduce((sum, t) => sum + t.amount, 0) /
              transactions.length
            : 0,
        lastTransaction: transactions[0] || null,
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching budget analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// New: Get budget spending for specific period
exports.getBudgetSpending = async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.query;

    const budget = await Budget.findOne({ _id: id, userId: req.user.id });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      userId: req.user.id,
      category: budget.category,
      type: "expense",
      date: { $gte: startDate },
    }).sort({ date: -1 });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = Math.max(0, budget.amount - totalSpent);
    const progress = budget.amount > 0 ? totalSpent / budget.amount : 0;

    res.json({
      budget,
      period,
      dateRange: { start: startDate, end: now },
      transactions,
      summary: {
        budgetAmount: budget.amount,
        totalSpent,
        remaining,
        progress: Math.round(progress * 100),
        isOverBudget: totalSpent > budget.amount,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching budget spending:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// New: Check budget alerts
exports.checkBudgetAlerts = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    const alerts = [];

    for (const budget of budgets) {
      // Get spending for current period
      const now = new Date();
      let startDate;

      switch (budget.period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "yearly":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const transactions = await Transaction.find({
        userId: req.user.id,
        category: budget.category,
        type: "expense",
        date: { $gte: startDate },
      });

      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const progress = budget.amount > 0 ? totalSpent / budget.amount : 0;

      // Check if alert threshold is exceeded
      if (progress >= budget.alertThreshold) {
        alerts.push({
          budgetId: budget._id,
          category: budget.category,
          budgetAmount: budget.amount,
          spent: totalSpent,
          progress: Math.round(progress * 100),
          alertThreshold: Math.round(budget.alertThreshold * 100),
          isOverBudget: totalSpent > budget.amount,
          message:
            totalSpent > budget.amount
              ? `You're over budget on ${budget.category}!`
              : `You've reached ${Math.round(progress * 100)}% of your ${
                  budget.category
                } budget.`,
          severity: totalSpent > budget.amount ? "high" : "medium",
        });
      }
    }

    res.json({ alerts, alertCount: alerts.length });
  } catch (error) {
    console.error("Error checking budget alerts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// New: Get budget summary
exports.getBudgetSummary = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    let totalBudgetAmount = 0;
    let totalSpent = 0;
    let alertCount = 0;
    let overBudgetCount = 0;

    for (const budget of budgets) {
      totalBudgetAmount += budget.amount;

      // Calculate spending for each budget
      const now = new Date();
      let startDate;

      switch (budget.period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "yearly":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const transactions = await Transaction.find({
        userId: req.user.id,
        category: budget.category,
        type: "expense",
        date: { $gte: startDate },
      });

      const budgetSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      totalSpent += budgetSpent;

      const progress = budget.amount > 0 ? budgetSpent / budget.amount : 0;

      if (progress >= budget.alertThreshold) alertCount++;
      if (budgetSpent > budget.amount) overBudgetCount++;
    }

    res.json({
      totalBudgets: budgets.length,
      totalBudgetAmount,
      totalSpent,
      totalRemaining: Math.max(0, totalBudgetAmount - totalSpent),
      overallProgress:
        totalBudgetAmount > 0
          ? Math.round((totalSpent / totalBudgetAmount) * 100)
          : 0,
      alertCount,
      overBudgetCount,
      healthScore:
        budgets.length > 0
          ? Math.max(0, 100 - (overBudgetCount / budgets.length) * 100)
          : 100,
    });
  } catch (error) {
    console.error("Error fetching budget summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};
