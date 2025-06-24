import { useFinance } from "../../context/FinanceContext";
import { calculateBudgetProgress } from "../../utils/calculations";
import {
  formatCurrency,
  formatPercentage,
  getCurrencySymbol,
} from "../../utils/formatters";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

function BudgetProgress({ budget }) {
  const { transactions, updateBudget, deleteBudget, refreshData } =
    useFinance();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    amount: budget.amount,
    period: budget.period,
    category: budget.category,
    alertThreshold: budget.alertThreshold || 0.8, // Default 80%
  });
  const [currency, setCurrency] = useState(
    user?.preferences?.currency || "USD"
  );
  const { spent, remaining, progress } = calculateBudgetProgress(
    budget,
    transactions
  );
  const [editHistory, setEditHistory] = useState(
    budget.analytics?.editHistory || []
  );

  useEffect(() => {
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    if (
      progress > formData.alertThreshold &&
      !isEditing &&
      Notification.permission === "granted"
    ) {
      new Notification(`Budget Alert: ${budget.category}`, {
        body: `You've spent ${formatPercentage(
          progress
        )} of your ${formatCurrency(
          budget.amount,
          getCurrencySymbol(currency)
        )} budget!`,
      });
    }
  }, [
    progress,
    budget.category,
    budget.amount,
    currency,
    formData.alertThreshold,
  ]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedBudget = {
        ...formData,
        amount: parseFloat(formData.amount),
        analytics: {
          ...budget.analytics,
          lastUpdated: new Date(),
          editHistory: [
            ...editHistory,
            { date: new Date(), changes: formData },
          ],
        },
      };
      await updateBudget(budget._id, updatedBudget);
      setIsEditing(false);
      setEditHistory(updatedBudget.analytics.editHistory);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      try {
        await deleteBudget(budget._id);
      } catch (error) {
        console.error("Error deleting budget:", error);
      }
    }
  };

  return (
    <div className="card animate-slide-up">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            >
              {[
                "Food",
                "Transportation",
                "Housing",
                "Utilities",
                "Entertainment",
                "Healthcare",
                "Savings",
                "Other",
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            />
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Period
            </label>
            <select
              value={formData.period}
              onChange={(e) =>
                setFormData({ ...formData, period: e.target.value })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            >
              {["weekly", "monthly", "yearly"].map((period) => (
                <option key={period} value={period}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Alert Threshold (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              max="1"
              value={formData.alertThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  alertThreshold: parseFloat(e.target.value),
                })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            />
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          <div className="space-x-2">
            <button
              type="submit"
              className="btn bg-primary-500 hover:bg-primary-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn bg-red-500 hover:bg-red-600"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-bold text-[var(--light-text)]">
              {budget.category}
            </h3>
            <p className="text-sm">
              {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
            </p>
            <p className="text-sm">
              Spent: {formatCurrency(spent, getCurrencySymbol(currency))}
            </p>
            <p className="text-sm">
              Remaining:{" "}
              {formatCurrency(remaining, getCurrencySymbol(currency))}
            </p>
            <p className="text-sm">
              Alert Threshold: {formatPercentage(formData.alertThreshold)}
            </p>
            <p className="text-sm">
              Last Updated:{" "}
              {new Date(
                budget.analytics?.lastUpdated || budget.createdAt
              ).toLocaleDateString()}
            </p>
            {editHistory.length > 0 && (
              <p className="text-sm italic">
                Last Edit:{" "}
                {new Date(
                  editHistory[editHistory.length - 1].date
                ).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="w-1/2">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-accent-500 bg-accent-100">
                    {formatPercentage(progress)}
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-100">
                <div
                  style={{ width: `${Math.min(progress * 100, 100)}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    progress > formData.alertThreshold
                      ? "bg-red-500"
                      : "bg-primary-500"
                  }`}
                ></div>
              </div>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary-500 hover:text-primary-600"
              >
                <FaEdit />
              </button>
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BudgetProgress;
