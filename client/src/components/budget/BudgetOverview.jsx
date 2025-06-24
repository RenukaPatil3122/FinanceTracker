import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Target,
  Settings,
  X,
  Check,
} from "lucide-react";
import api from "../../services/api"; // Import your API functions

const BudgetOverview = () => {
  const [budgets, setBudgets] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly",
    alertThreshold: 0.8,
    description: "",
  });

  // Check for dark mode preference
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(darkMode);
    };

    checkDarkMode();

    // Listen for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  // Load budgets from API
  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch budgets from API
      const response = await api.get("/budgets");
      let budgetsData = response.data || [];

      setBudgets(budgetsData);

      // Calculate basic summary
      const totalBudgets = budgetsData.length;
      const totalBudgetAmount = budgetsData.reduce(
        (sum, budget) => sum + budget.amount,
        0
      );

      setSummary({
        totalBudgets,
        totalBudgetAmount,
      });
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setError("Failed to load budgets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      amount: "",
      period: "monthly",
      alertThreshold: 0.8,
      description: "",
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.category.trim() ||
      !formData.amount ||
      parseFloat(formData.amount) <= 0
    ) {
      alert("Please fill in all required fields with valid values.");
      return;
    }

    try {
      setError("");

      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category: formData.category.trim(),
      };

      if (editingBudget) {
        // Update existing budget
        await api.put(`/budgets/${editingBudget._id}`, budgetData);
      } else {
        // Create new budget
        await api.post("/budgets", budgetData);
      }

      // Refresh budgets list
      await fetchBudgets();

      resetForm();
      setShowCreateForm(false);
      setEditingBudget(null);
    } catch (error) {
      console.error("Error saving budget:", error);
      setError(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Failed to save budget. Please try again."
      );
    }
  };

  const handleEdit = (budget) => {
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      alertThreshold: budget.alertThreshold,
      description: budget.description || "",
    });
    setEditingBudget(budget);
    setShowCreateForm(true);
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      try {
        setError("");
        await api.delete(`/budgets/${budgetId}`);
        await fetchBudgets(); // Refresh the list
      } catch (error) {
        console.error("Error deleting budget:", error);
        setError("Failed to delete budget. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-300 dark:bg-gray-700 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError("")}
                className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
              >
                <X size={16} className="text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Budget Overview
          </h1>
          <button
            onClick={() => {
              resetForm();
              setEditingBudget(null);
              setShowCreateForm(true);
            }}
            className="px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Create Budget
          </button>
        </div>

        {/* Summary Cards */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Budgets
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {summary.totalBudgets}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Budget
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    ${summary.totalBudgetAmount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Your Budgets
            </h2>
          </div>

          {budgets.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                No budgets found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create your first budget to start tracking your spending
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Create Your First Budget
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {budgets.map((budget) => (
                <div
                  key={budget._id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {budget.category}
                        </h3>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full flex items-center gap-1">
                          <Calendar size={12} />
                          {budget.period}
                        </span>
                      </div>

                      {budget.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {budget.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Budget Amount
                          </p>
                          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            ${budget.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Alert Threshold
                          </p>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">
                            {Math.round(budget.alertThreshold * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(budget._id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Budget Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {editingBudget ? "Edit Budget" : "Create New Budget"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingBudget(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Food & Dining, Transportation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Period *
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) =>
                      setFormData({ ...formData, period: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alert Threshold ({Math.round(formData.alertThreshold * 100)}
                    %)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={formData.alertThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alertThreshold: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add a description for this budget..."
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingBudget(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    {editingBudget ? "Update Budget" : "Create Budget"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;
