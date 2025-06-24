const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

exports.getRecommendations = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    const budgets = await Budget.find({ userId: req.user.id });
    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.type === "expense") {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});
    const recommendations = [];
    budgets.forEach((budget) => {
      const spent = categoryTotals[budget.category] || 0;
      if (spent > budget.amount * 0.9) {
        const excess = spent - budget.amount;
        recommendations.push({
          message: `Reduce spending on ${budget.category} by 10% to stay within budget.`,
          savings: excess * 0.1,
        });
      }
    });
    res.json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Server error" });
  }
};
