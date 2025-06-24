import { useForm } from "react-hook-form";
import { useFinance } from "../../context/FinanceContext";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, getCurrencySymbol } from "../../utils/formatters";

function GoalForm({ setShowForm }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm();
  const { addGoal } = useFinance();
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([{ amount: "", date: "" }]);
  const [currency, setCurrency] = useState(
    user?.preferences?.currency || "USD"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Add this to prevent double submission

  const watchedTargetAmount = watch("targetAmount");

  const onSubmit = async (data) => {
    // Prevent multiple submissions
    if (isSubmitting || hasSubmitted) {
      return;
    }

    setIsSubmitting(true);
    setHasSubmitted(true);

    try {
      // Filter and validate milestones
      const validMilestones = milestones.filter((m) => {
        const amount = parseFloat(m.amount);
        const targetAmount = parseFloat(data.targetAmount);
        return (
          m.amount &&
          m.date &&
          amount > 0 &&
          amount <= targetAmount &&
          new Date(m.date) <= new Date(data.deadline)
        );
      });

      const goalData = {
        ...data,
        targetAmount: parseFloat(data.targetAmount),
        currentAmount: 0,
        deadline: new Date(data.deadline).toISOString(),
        milestones: validMilestones.map((m) => ({
          amount: parseFloat(m.amount),
          date: new Date(m.date).toISOString(),
          isCompleted: false,
        })),
        currency,
        progressNotifications: [],
        isCompleted: false,
      };

      await addGoal(goalData);

      // Reset form and close only after successful submission
      reset();
      setMilestones([{ amount: "", date: "" }]);
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting goal:", error);
      alert("Failed to create goal. Please try again.");
      // Reset submission flags on error so user can try again
      setHasSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { amount: "", date: "" }]);
  };

  const removeMilestone = (index) => {
    if (milestones.length > 1) {
      const newMilestones = milestones.filter((_, i) => i !== index);
      setMilestones(newMilestones);
    }
  };

  const updateMilestone = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="card mb-6 animate-slide-up">
      <h2 className="text-2xl font-display mb-4">Add New Goal</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[var(--text-primary)] mb-1 font-medium">
            Goal Name *
          </label>
          <input
            type="text"
            {...register("name", {
              required: "Goal name is required",
              minLength: {
                value: 2,
                message: "Goal name must be at least 2 characters",
              },
              maxLength: {
                value: 100,
                message: "Goal name cannot exceed 100 characters",
              },
            })}
            className="w-full p-2 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-primary-600 focus:outline-none"
            placeholder="e.g., Emergency Fund, Vacation, New Car"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[var(--text-primary)] mb-1 font-medium">
            Target Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            {...register("targetAmount", {
              required: "Target amount is required",
              min: { value: 0.01, message: "Amount must be positive" },
              max: { value: 1000000, message: "Amount too large" },
            })}
            className="w-full p-2 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-primary-600 focus:outline-none"
            placeholder="0.00"
            disabled={isSubmitting}
          />
          {errors.targetAmount && (
            <p className="text-red-500 text-sm mt-1">
              {errors.targetAmount.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[var(--text-primary)] mb-1 font-medium">
            Deadline *
          </label>
          <input
            type="date"
            min={today}
            {...register("deadline", {
              required: "Deadline is required",
              validate: (v) =>
                new Date(v) > new Date() || "Deadline must be in the future",
            })}
            className="w-full p-2 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-primary-600 focus:outline-none"
            disabled={isSubmitting}
          />
          {errors.deadline && (
            <p className="text-red-500 text-sm mt-1">
              {errors.deadline.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[var(--text-primary)] mb-1 font-medium">
            Milestones (Optional)
          </label>
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Set intermediate targets to track your progress
          </p>
          {milestones.map((milestone, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={watchedTargetAmount || undefined}
                value={milestone.amount}
                onChange={(e) =>
                  updateMilestone(index, "amount", e.target.value)
                }
                className="flex-1 p-2 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-primary-600 focus:outline-none"
                placeholder={`Amount (max: ${
                  watchedTargetAmount || "target amount"
                })`}
                disabled={isSubmitting}
              />
              <input
                type="date"
                min={today}
                max={watch("deadline") || undefined}
                value={milestone.date}
                onChange={(e) => updateMilestone(index, "date", e.target.value)}
                className="flex-1 p-2 rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-primary-600 focus:outline-none"
                disabled={isSubmitting}
              />
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="btn bg-red-500 hover:bg-red-600 px-3"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMilestone}
            className="btn bg-primary-500 hover:bg-primary-600 text-sm"
            disabled={isSubmitting}
          >
            + Add Milestone
          </button>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || hasSubmitted}
            className="btn bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Goal"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={isSubmitting}
            className="btn bg-gray-500 hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default GoalForm;
