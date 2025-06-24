// Calculate category totals by transaction type
export const calculateCategoryTotals = (transactions) => {
  return transactions.reduce((acc, t) => {
    const amount = t.type === "expense" ? -t.amount : t.amount;
    acc[t.category] = (acc[t.category] || 0) + amount;
    return acc;
  }, {});
};

// Calculate monthly totals for a specific transaction type
export const calculateMonthlyTotals = (transactions, type) => {
  const monthly = {};
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      monthly[key] = (monthly[key] || 0) + t.amount;
    });
  return Object.entries(monthly)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Calculate growth rate between two values
export const calculateGrowthRate = (currentValue, previousValue) => {
  if (previousValue === 0 || !previousValue) return 0;
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
};

// Calculate moving average over a window
export const calculateMovingAverage = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((sum, value) => sum + (value || 0), 0);
  return sum / values.length;
};

// Calculate volatility (standard deviation) over a dataset
export const calculateVolatility = (data) => {
  if (!data || data.length < 2) return 0;
  const values = data.map((item) => item.amount || 0);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
};

// Enhanced budget progress calculation with period filtering
export const calculateBudgetProgress = (budget, transactions) => {
  if (!budget || !transactions) return { spent: 0, remaining: 0, progress: 0 };

  // Filter transactions based on budget period
  const now = new Date();
  const filteredTransactions = transactions.filter((t) => {
    if (t.category !== budget.category || t.type !== "expense") return false;

    const transactionDate = new Date(t.date);

    switch (budget.period) {
      case "daily":
        return transactionDate.toDateString() === now.toDateString();
      case "weekly":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return transactionDate >= weekStart;
      case "monthly":
        return (
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        );
      case "yearly":
        return transactionDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const spent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = Math.max(0, budget.amount - spent);
  const progress = budget.amount > 0 ? spent / budget.amount : 0;

  return {
    spent,
    remaining,
    progress,
    isOverBudget: spent > budget.amount,
    percentageUsed: progress * 100,
    daysInPeriod: getDaysInPeriod(budget.period),
    dailyAverage: spent / getDaysInPeriod(budget.period, true),
  };
};

// Helper function to get days in period
const getDaysInPeriod = (period, elapsed = false) => {
  const now = new Date();

  switch (period) {
    case "daily":
      return elapsed ? 1 : 1;
    case "weekly":
      return elapsed ? now.getDay() + 1 : 7;
    case "monthly":
      if (elapsed) {
        return now.getDate();
      }
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    case "yearly":
      if (elapsed) {
        const start = new Date(now.getFullYear(), 0, 1);
        return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
      }
      return 365 + (now.getFullYear() % 4 === 0 ? 1 : 0);
    default:
      return 30;
  }
};

// Enhanced goal progress calculation
export const calculateGoalProgress = (goal, transactions) => {
  if (!goal) {
    return { saved: 0, remaining: 0 };
  }

  const targetAmount = parseFloat(goal.targetAmount) || 0;

  if (targetAmount <= 0) {
    return { saved: 0, remaining: 0 };
  }

  let saved = 0;

  if (goal.currentAmount !== undefined && goal.currentAmount !== null) {
    saved = parseFloat(goal.currentAmount) || 0;
  }

  if (saved === 0 && transactions && Array.isArray(transactions)) {
    const goalTransactions = transactions.filter((t) => {
      if (!t || typeof t !== "object") return false;

      return (
        (t.goalId && t.goalId.toString() === goal._id?.toString()) ||
        (t.goal && t.goal.toString() === goal._id?.toString()) ||
        (t.goalReference &&
          t.goalReference.toString() === goal._id?.toString()) ||
        (t.category === "savings" && t.type === "income") ||
        (t.description &&
          goal.name &&
          t.description.toLowerCase().includes(goal.name.toLowerCase()) &&
          t.type === "income")
      );
    });

    saved = goalTransactions.reduce((sum, t) => {
      const amount = parseFloat(t.amount) || 0;
      return t.type === "income" ? sum + amount : sum - amount;
    }, 0);
  }

  saved = Math.max(0, saved);
  const remaining = Math.max(0, targetAmount - saved);

  return {
    saved,
    remaining,
  };
};

export const updateGoalProgress = async (
  goalId,
  amount,
  transactionType = "income",
  goalService
) => {
  try {
    if (!goalService || !goalId) return null;

    const goalData = {
      currentAmount: amount >= 0 ? amount : 0,
    };

    return await goalService.updateGoal(goalId, goalData);
  } catch (error) {
    console.error("Error updating goal progress:", error);
    return null;
  }
};

export const calculateMilestoneProgress = (goal, transactions) => {
  const { saved } = calculateGoalProgress(goal, transactions);

  if (
    !goal.milestones ||
    !Array.isArray(goal.milestones) ||
    goal.milestones.length === 0
  ) {
    return [];
  }

  return goal.milestones.map((milestone, index) => {
    const milestoneAmount = parseFloat(milestone.amount) || 0;
    const isCompleted = saved >= milestoneAmount;

    return {
      ...milestone,
      isCompleted,
      index,
    };
  });
};

// Enhanced savings recommendations with more intelligent analysis
export const calculateSavingsRecommendations = (budgets, transactions) => {
  const recommendations = [];
  const categoryTotals = calculateCategoryTotals(
    transactions.filter((t) => t.type === "expense")
  );

  budgets.forEach((budget) => {
    const { spent, progress, isOverBudget } = calculateBudgetProgress(
      budget,
      transactions
    );

    // Over budget recommendations
    if (isOverBudget) {
      const excess = spent - budget.amount;
      recommendations.push({
        type: "over_budget",
        category: budget.category,
        message: `You're over budget on ${
          budget.category
        }! Consider reducing spending by ${Math.ceil(
          (excess / spent) * 100
        )}%.`,
        savings: excess,
        priority: "high",
      });
    }

    // High spending warnings (90% threshold)
    else if (progress > 0.9) {
      const potentialSavings = spent * 0.1;
      recommendations.push({
        type: "high_spending",
        category: budget.category,
        message: `You've used ${Math.round(progress * 100)}% of your ${
          budget.category
        } budget. Consider reducing spending by 10%.`,
        savings: potentialSavings,
        priority: "medium",
      });
    }

    // Optimization suggestions for categories with consistent overspending
    const historicalSpending = categoryTotals[budget.category] || 0;
    if (Math.abs(historicalSpending) > budget.amount * 1.2) {
      recommendations.push({
        type: "budget_adjustment",
        category: budget.category,
        message: `Consider increasing your ${budget.category} budget or finding ways to reduce regular expenses.`,
        savings: Math.abs(historicalSpending) - budget.amount,
        priority: "low",
      });
    }
  });

  // Sort by priority and potential savings
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.savings - a.savings;
  });
};

export const calculateBalance = (transactions) => {
  return transactions.reduce((balance, t) => {
    return t.type === "income" ? balance + t.amount : balance - t.amount;
  }, 0);
};

// Calculate budget efficiency score
export const calculateBudgetEfficiency = (budgets, transactions) => {
  if (!budgets.length) return 0;

  let totalEfficiency = 0;
  let validBudgets = 0;

  budgets.forEach((budget) => {
    const { progress } = calculateBudgetProgress(budget, transactions);
    if (progress > 0) {
      // Ideal range is 70-90% budget usage
      let efficiency;
      if (progress <= 0.7) {
        efficiency = (progress / 0.7) * 80; // Scale to 80% max if under-utilizing
      } else if (progress <= 0.9) {
        efficiency = 80 + ((progress - 0.7) / 0.2) * 20; // 80-100% for optimal range
      } else {
        efficiency = Math.max(0, 100 - (progress - 0.9) * 200); // Penalty for overspending
      }

      totalEfficiency += efficiency;
      validBudgets++;
    }
  });

  return validBudgets > 0 ? totalEfficiency / validBudgets : 0;
};

// Get spending trends for budget categories
export const getBudgetTrends = (budgets, transactions, months = 6) => {
  const trends = {};

  budgets.forEach((budget) => {
    const categoryTransactions = transactions
      .filter((t) => t.category === budget.category && t.type === "expense")
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const monthlySpending = {};
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    categoryTransactions
      .filter((t) => new Date(t.date) >= cutoffDate)
      .forEach((t) => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlySpending[key] = (monthlySpending[key] || 0) + t.amount;
      });

    const spendingValues = Object.values(monthlySpending);
    const avgSpending =
      spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length || 0;

    trends[budget.category] = {
      monthlyData: monthlySpending,
      averageSpending: avgSpending,
      trend:
        spendingValues.length > 1
          ? ((spendingValues[spendingValues.length - 1] - spendingValues[0]) /
              spendingValues[0]) *
            100
          : 0,
      budgetUtilization: (avgSpending / budget.amount) * 100,
    };
  });

  return trends;
};
