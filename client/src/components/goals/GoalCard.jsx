import { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { calculateGoalProgress } from "../../utils/calculations";
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  getCurrencySymbol,
} from "../../utils/formatters";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Confetti from "react-confetti";
import { motion } from "framer-motion";

function GoalCard({ goal }) {
  const { transactions, updateGoal, deleteGoal, refreshData } = useFinance();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState({
    name: goal.name,
    targetAmount: goal.targetAmount,
    deadline: new Date(goal.deadline).toISOString().split("T")[0],
    milestones: goal.milestones || [{ amount: "", date: "" }],
    currency: goal.currency || user?.preferences?.currency || "USD",
  });
  const [editLog, setEditLog] = useState(goal.progressNotifications || []);
  const { saved, remaining } = calculateGoalProgress(goal, transactions);

  useEffect(() => {
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    const nextMilestone = formData.milestones.find(
      (m) => new Date(m.date) > new Date() && parseFloat(m.amount) <= saved
    );
    if (nextMilestone && !isEditing && Notification.permission === "granted") {
      new Notification(`Milestone Reached: ${goal.name}`, {
        body: `You've reached ${formatCurrency(
          nextMilestone.amount,
          getCurrencySymbol(formData.currency)
        )} by ${formatDate(nextMilestone.date)}!`,
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
    if (saved >= goal.targetAmount && !isEditing) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [
    saved,
    formData.milestones,
    goal.name,
    formData.currency,
    goal.targetAmount,
  ]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedGoal = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        deadline: new Date(formData.deadline).toISOString(),
        milestones: formData.milestones.filter(
          (m) =>
            m.amount &&
            m.date &&
            parseFloat(m.amount) <= parseFloat(formData.targetAmount)
        ),
        progressNotifications: [
          ...editLog,
          {
            date: new Date(),
            message: `Updated on ${new Date().toLocaleDateString()}`,
          },
        ],
      };
      await updateGoal(goal._id, updatedGoal);
      setIsEditing(false);
      setEditLog(updatedGoal.progressNotifications);
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        await deleteGoal(goal._id);
      } catch (error) {
        console.error("Error deleting goal:", error);
      }
    }
  };

  return (
    <motion.div
      className="card animate-slide-up"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showConfetti && <Confetti />}
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-[var(--light-text)] mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            />
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Target Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: e.target.value })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            />
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            />
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-[var(--light-text)] mb-1">
              Milestones
            </label>
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="number"
                  step="0.01"
                  value={milestone.amount}
                  onChange={(e) => {
                    const newMilestones = [...formData.milestones];
                    newMilestones[index].amount = e.target.value;
                    setFormData({ ...formData, milestones: newMilestones });
                  }}
                  className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
                  placeholder="Amount"
                />
                <input
                  type="date"
                  value={milestone.date}
                  onChange={(e) => {
                    const newMilestones = [...formData.milestones];
                    newMilestones[index].date = e.target.value;
                    setFormData({ ...formData, milestones: newMilestones });
                  }}
                  className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
                  placeholder="Date"
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newMilestones = formData.milestones.filter(
                        (_, i) => i !== index
                      );
                      setFormData({ ...formData, milestones: newMilestones });
                    }}
                    className="btn bg-red-500 hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  milestones: [
                    ...formData.milestones,
                    { amount: "", date: "" },
                  ],
                })
              }
              className="btn bg-primary-500 hover:bg-primary-600"
            >
              Add Milestone
            </button>
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
              {goal.name}
            </h3>
            <p className="text-sm">Deadline: {formatDate(goal.deadline)}</p>
            <p className="text-sm">
              Saved: {formatCurrency(saved, getCurrencySymbol(goal.currency))}
            </p>
            <p className="text-sm">
              Target:{" "}
              {formatCurrency(
                goal.targetAmount,
                getCurrencySymbol(goal.currency)
              )}
            </p>
            <p className="text-sm">
              Remaining:{" "}
              {formatCurrency(remaining, getCurrencySymbol(goal.currency))}
            </p>
            {goal.milestones && goal.milestones.length > 0 && (
              <div className="text-sm">
                <p>
                  Next Milestone:{" "}
                  {formatCurrency(
                    goal.milestones[0].amount,
                    getCurrencySymbol(goal.currency)
                  )}{" "}
                  by {formatDate(goal.milestones[0].date)}
                </p>
              </div>
            )}
            {editLog.length > 0 && (
              <p className="text-sm italic">
                Last Update: {editLog[editLog.length - 1].message}
              </p>
            )}
          </div>
          <div className="w-1/2">
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
    </motion.div>
  );
}

export default GoalCard;
