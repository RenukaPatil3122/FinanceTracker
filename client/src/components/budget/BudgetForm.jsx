import { useForm } from "react-hook-form";
import { useFinance } from "../../context/FinanceContext";
import { TRANSACTION_CATEGORIES, TIME_PERIODS } from "../../utils/constants";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

function BudgetForm({ setShowForm }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm();
  const { addBudget } = useFinance();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [customCategory, setCustomCategory] = useState("");
  const categoryWatch = watch("category");

  useEffect(() => {
    if (categoryWatch) {
      const filtered = TRANSACTION_CATEGORIES.filter((cat) =>
        cat.toLowerCase().includes(categoryWatch.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [categoryWatch]);

  const onSubmit = async (data) => {
    try {
      const budgetData = {
        ...data,
        amount: parseFloat(data.amount),
        category: customCategory || data.category,
      };
      await addBudget(budgetData);
      reset();
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting budget:", error);
    }
  };

  useEffect(() => {
    if (user?.preferences?.defaultCategory) {
      setValue("category", user.preferences.defaultCategory);
    }
  }, [user, setValue]);

  return (
    <div className="card mb-6 animate-slide-up">
      <h2 className="text-2xl font-display mb-4">Add Budget</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[var(--light-text)] mb-1">
            Category
          </label>
          <input
            list="category-suggestions"
            {...register("category", { required: "Category is required" })}
            className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            placeholder="Type to search or add custom..."
            onBlur={(e) => setCustomCategory(e.target.value)}
          />
          <datalist id="category-suggestions">
            {suggestions.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          {errors.category && (
            <p className="text-red-500 text-sm">{errors.category.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[var(--light-text)] mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            {...register("amount", {
              required: "Amount is required",
              min: { value: 0.01, message: "Amount must be positive" },
              max: { value: 1000000, message: "Amount too high" },
            })}
            className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[var(--light-text)] mb-1">Period</label>
          <select
            {...register("period", { required: "Period is required" })}
            className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          >
            {TIME_PERIODS.map((period) => (
              <option key={period} value={period}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </option>
            ))}
          </select>
          {errors.period && (
            <p className="text-red-500 text-sm">{errors.period.message}</p>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="btn bg-primary-500 hover:bg-primary-600"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="btn bg-red-500 hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default BudgetForm;
