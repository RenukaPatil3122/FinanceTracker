import { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import {
  formatCurrency,
  formatDate,
  getCurrencySymbol,
} from "../../utils/formatters";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

function TransactionCard({ transaction }) {
  const { updateTransaction, deleteTransaction, refreshData } = useFinance();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    amount: transaction.amount,
    description: transaction.description || "",
    date: new Date(transaction.date).toISOString().split("T")[0],
    category: transaction.category,
    type: transaction.type,
    notes: transaction.notes || "",
    currency: transaction.currency || user?.preferences?.currency || "USD",
  });
  const [editHistory, setEditHistory] = useState(transaction.editHistory || []);

  useEffect(() => {
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedTransaction = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        tax: parseFloat(formData.amount) * 0.1, // 10% tax
        editHistory: [
          ...editHistory,
          {
            date: new Date(),
            changes: { ...formData, tax: parseFloat(formData.amount) * 0.1 },
          },
        ],
      };
      await updateTransaction(transaction._id, updatedTransaction);
      setIsEditing(false);
      setEditHistory(updatedTransaction.editHistory);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transaction._id);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  return (
    <div className="card flex justify-between items-center animate-slide-up">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="flex-1 space-y-2">
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
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
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          />
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            placeholder="Description..."
          />
          <input
            type="text"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            placeholder="Add notes..."
          />
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="INR">INR (₹)</option>
          </select>
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
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--light-text)]">
              {transaction.description || "No description"}
            </h3>
            <p className="text-sm">Type: {transaction.type}</p>
            <p className="text-sm">Category: {transaction.category}</p>
            <p className="text-sm">
              Amount:{" "}
              {formatCurrency(
                transaction.amount,
                getCurrencySymbol(transaction.currency)
              )}
            </p>
            <p className="text-sm">
              Tax:{" "}
              {formatCurrency(
                transaction.tax || transaction.amount * 0.1,
                getCurrencySymbol(transaction.currency)
              )}
            </p>
            <p className="text-sm">Date: {formatDate(transaction.date)}</p>
            {transaction.notes && (
              <p className="text-sm italic">Notes: {transaction.notes}</p>
            )}
            {editHistory.length > 0 && (
              <p className="text-sm italic">
                Last Edited:{" "}
                {new Date(
                  editHistory[editHistory.length - 1].date
                ).toLocaleDateString()}
              </p>
            )}
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
        </>
      )}
    </div>
  );
}

export default TransactionCard;
