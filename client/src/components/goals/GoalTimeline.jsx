import { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import GoalForm from "./GoalForm";
import GoalCard from "./GoalCard";
// REMOVED: import GoalTimeline from "./GoalTimeline";
import LoadingSpinner from "../common/LoadingSpinner";
import { FaDownload, FaFilter } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, getCurrencySymbol } from "../../utils/formatters";

// Alternative PDF generation using a more reliable approach
const generatePDF = async (goals, currency) => {
  try {
    // Method 1: Try standard dynamic import
    let jsPDF, doc;

    try {
      const jsPDFModule = await import("jspdf");
      jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

      // Import autoTable
      await import("jspdf-autotable");

      doc = new jsPDF();

      // Test if autoTable is available
      if (typeof doc.autoTable !== "function") {
        throw new Error("autoTable not available");
      }
    } catch (importError) {
      console.log("Dynamic import failed, trying alternative method");

      // Method 2: Fallback to creating CSV instead of PDF
      const csvContent = createCSVReport(goals, currency);
      downloadCSV(
        csvContent,
        `goals_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      return true;
    }

    // Add title
    doc.setFontSize(20);
    doc.text("Goals Report", 20, 20);

    // Add metadata
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Goals: ${goals.length}`, 20, 40);

    // Prepare table data
    const tableData = goals.map((goal) => {
      return [
        goal.name,
        formatCurrency(
          goal.targetAmount,
          getCurrencySymbol(goal.currency || currency)
        ),
        formatCurrency(
          goal.currentAmount || 0,
          getCurrencySymbol(goal.currency || currency)
        ),
        new Date(goal.deadline).toLocaleDateString(),
        goal.currency || currency,
      ];
    });

    // Add table using autoTable
    doc.autoTable({
      startY: 50,
      head: [
        ["Name", "Target Amount", "Current Amount", "Deadline", "Currency"],
      ],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 10 },
      margin: { top: 50 },
    });

    // Save the PDF
    doc.save(`goals_report_${new Date().toISOString().split("T")[0]}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Final fallback: Generate CSV
    try {
      const csvContent = createCSVReport(goals, currency);
      downloadCSV(
        csvContent,
        `goals_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      return true;
    } catch (csvError) {
      console.error("Error generating CSV:", csvError);
      return false;
    }
  }
};

// Fallback CSV generation function
const createCSVReport = (goals, currency) => {
  const headers = [
    "Name",
    "Target Amount",
    "Current Amount",
    "Deadline",
    "Currency",
  ];

  const rows = goals.map((goal) => {
    return [
      `"${goal.name}"`,
      goal.targetAmount,
      goal.currentAmount || 0,
      new Date(goal.deadline).toLocaleDateString(),
      goal.currency || currency,
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
};

// CSV download function
const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function GoalsList() {
  const { goals, loading, refreshData, transactions } = useFinance();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState("deadline");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [currency, setCurrency] = useState(
    user?.preferences?.currency || "USD"
  );
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [refreshData]);

  if (loading) return <LoadingSpinner />;

  // Simplified filtering and sorting logic without progress calculations
  const sortedGoals = [...goals]
    .filter((goal) => {
      // Filter by status (completed vs active)
      if (filterStatus !== "all") {
        const isCompleted = goal.isCompleted || false;
        if (filterStatus === "completed" && !isCompleted) return false;
        if (filterStatus === "active" && isCompleted) return false;
      }

      // Filter by currency
      if (filterCurrency !== "all") {
        const goalCurrency = goal.currency || currency;
        if (goalCurrency !== filterCurrency) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "deadline")
        return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "amount") return b.targetAmount - a.targetAmount;
      return 0;
    });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const success = await generatePDF(sortedGoals, currency);
      if (!success) {
        alert("Failed to generate report. Please try again.");
      } else {
        console.log("Report generated successfully!");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const completedGoals = goals.filter((goal) => goal.isCompleted || false);
  const activeGoals = goals.filter((goal) => !(goal.isCompleted || false));

  // Get unique currencies from goals for filter dropdown
  const availableCurrencies = [
    ...new Set(goals.map((goal) => goal.currency || currency)),
  ];

  return (
    <div className="card animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-display">Financial Goals</h2>
        <div className="text-sm text-[var(--light-text)]">
          Total: {goals.length} | Completed: {completedGoals.length} | Active:{" "}
          {activeGoals.length}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn bg-primary-500 hover:bg-primary-600"
        >
          {showForm ? "Cancel" : "Add Goal"}
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isExporting || goals.length === 0}
          className="btn bg-primary-500 hover:bg-primary-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaDownload className="mr-2" />
          {isExporting ? "Exporting..." : "Export Report"}
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
        >
          <option value="deadline">Sort by Deadline</option>
          <option value="name">Sort by Name</option>
          <option value="amount">Sort by Amount</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
        >
          <option value="all">All Goals</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
        </select>

        <select
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
          className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          title="Filter by Currency"
        >
          <option value="all">All Currencies</option>
          {availableCurrencies.map((curr) => (
            <option key={curr} value={curr}>
              {curr} ({getCurrencySymbol(curr)})
            </option>
          ))}
        </select>

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="p-2 rounded bg-[var(--light-bg)] text-[var(--light-text)] border border-primary-500"
          title="Default Currency"
        >
          <option value="USD">Default: USD ($)</option>
          <option value="EUR">Default: EUR (€)</option>
          <option value="INR">Default: INR (₹)</option>
        </select>
      </div>

      {showForm && <GoalForm setShowForm={setShowForm} />}

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--light-text)] mb-4">
            No goals found. Start by creating your first financial goal!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn bg-primary-500 hover:bg-primary-600"
          >
            Create Your First Goal
          </button>
        </div>
      ) : sortedGoals.length === 0 ? (
        <p className="text-center text-[var(--light-text)] py-8">
          No goals match your current filter criteria.
        </p>
      ) : (
        <div className="space-y-4">
          {sortedGoals.map((goal) => (
            <div
              key={goal._id}
              className="border-b border-primary-200 pb-4 last:border-b-0"
            >
              <GoalCard goal={goal} />
              {/* REMOVED: <GoalTimeline goal={goal} /> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GoalsList;
