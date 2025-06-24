import { useForm } from "react-hook-form";
import { useFinance } from "../../context/FinanceContext";
import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "../../utils/constants";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function TransactionForm({ setShowForm }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue, // Added missing setValue import
  } = useForm();
  const { addTransaction } = useFinance();
  const { user } = useAuth();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("monthly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceCount, setRecurrenceCount] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [currency, setCurrency] = useState(
    user?.preferences?.currency || "USD"
  );
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [predictedCategory, setPredictedCategory] = useState("");
  const categoryWatch = watch("category");
  const descriptionWatch = watch("description");

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

  useEffect(() => {
    const predictCategory = async () => {
      if (descriptionWatch && descriptionWatch.length > 3) {
        // Added length check to avoid too many API calls
        try {
          const res = await api.post("/predict-category", {
            description: descriptionWatch,
          });
          setPredictedCategory(res.data.category);
        } catch (error) {
          console.error("Error predicting category:", error);
          setPredictedCategory(""); // Reset on error
        }
      }
    };
    const timeoutId = setTimeout(predictCategory, 500); // Added debounce
    return () => clearTimeout(timeoutId);
  }, [descriptionWatch]);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const onSubmit = async (data) => {
    try {
      const transactionData = {
        ...data,
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
        tax: parseFloat(data.amount) * 0.1,
        currency,
        tags,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
        recurrenceEndDate:
          isRecurring && recurrenceEndDate
            ? new Date(recurrenceEndDate).toISOString()
            : null, // Fixed date conversion
        recurrenceCount:
          isRecurring && recurrenceCount ? parseInt(recurrenceCount) : null, // Fixed validation
      };

      await addTransaction(transactionData);

      // Only save prediction if categories differ and prediction exists
      if (predictedCategory && data.category !== predictedCategory) {
        try {
          await api.post("/save-prediction", {
            description: data.description,
            category: data.category,
          });
        } catch (error) {
          console.error("Error saving prediction:", error);
          // Don't fail the whole transaction for this
        }
      }

      reset();
      setTags([]);
      setIsRecurring(false);
      setRecurrenceEndDate("");
      setRecurrenceCount("");
      setPredictedCategory("");
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      alert("Failed to create transaction. Please try again."); // Added user feedback
    }
  };

  return (
    <div className="card mb-6 animate-slide-up">
      <h2 className="text-2xl font-display mb-4">Add Transaction</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[var(--light-text)] mb-1">Type</label>
          <select
            {...register("type", { required: "Type is required" })}
            className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          >
            <option value="">Select Type</option> {/* Added default option */}
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-red-500 text-sm">{errors.type.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[var(--light-text)] mb-1">
            Category
          </label>
          <input
            list="category-suggestions"
            {...register("category", { required: "Category is required" })}
            className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            placeholder="Type to search..."
          />
          <datalist id="category-suggestions">
            {suggestions.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          {predictedCategory && (
            <p className="text-sm text-gray-500">
              Suggested: {predictedCategory}
              <button
                type="button"
                onClick={() =>
                  setValue("category", predictedCategory, {
                    shouldValidate: true,
                  })
                }
                className="ml-2 text-primary-500 hover:underline"
              >
                Apply
              </button>
            </p>
          )}
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
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[var(--light-text)] mb-1">Date</label>
          <input
            type="date"
            {...register("date", { required: "Date is required" })}
            className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            defaultValue={new Date().toISOString().split("T")[0]} // Added default today's date
          />
          {errors.date && (
            <p className="text-red-500 text-sm">{errors.date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-[var(--light-text)] mb-1">
            Description
          </label>
          <input
            type="text"
            {...register("description", { maxLength: 100 })}
            className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
            placeholder="Enter description..."
          />
        </div>
        <div>
          <label className="block text-[var(--light-text)] mb-1">Tags</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTag(e)} // Added Enter key support
              className="flex-1 p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
              placeholder="Add tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn bg-primary-500 hover:bg-primary-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-primary-100 text-primary-500 px-2 py-1 rounded text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center text-[var(--light-text)] mb-1">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="mr-2"
            />
            Recurring Transaction
          </label>
          {isRecurring && (
            <div className="space-y-2 ml-4">
              <div>
                <label className="block text-sm text-[var(--light-text)] mb-1">
                  Frequency
                </label>
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value)}
                  className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--light-text)] mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--light-text)] mb-1">
                  Number of occurrences (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={recurrenceCount}
                  onChange={(e) => setRecurrenceCount(e.target.value)}
                  className="w-full p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
                  placeholder="e.g., 12"
                />
              </div>
            </div>
          )}
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
        <div className="flex space-x-4">
          <button
            type="submit"
            className="btn bg-primary-500 hover:bg-primary-600 flex-1"
          >
            Create Transaction
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="btn bg-gray-500 hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default TransactionForm;
