import { useState } from "react";
import { useFinance } from "../../context/FinanceContext";
import TransactionCard from "./TransactionCard";
import TransactionForm from "./TransactionForm";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatCurrency, formatDate } from "../../utils/formatters";

function TransactionsList() {
  const { transactions, loading } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  if (loading) return <LoadingSpinner />;

  const allTags = [...new Set(transactions.flatMap((t) => t.tags || []))];
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? t.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn bg-primary-500 hover:bg-primary-600"
        >
          {showForm ? "Cancel" : "Add Transaction"}
        </button>
      </div>
      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          placeholder="Search transactions..."
        />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
      {showForm && <TransactionForm setShowForm={setShowForm} />}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <p className="text-center text-[var(--light-text)]">
            No transactions found. Add one to get started!
          </p>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionCard key={transaction._id} transaction={transaction} />
          ))
        )}
      </div>
    </div>
  );
}

export default TransactionsList;
