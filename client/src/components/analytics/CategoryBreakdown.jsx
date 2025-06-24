import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  FaSync,
  FaChartPie,
  FaChartBar,
  FaCalendarAlt,
  FaChartLine,
  FaCog,
  FaFileExport,
  FaSave,
  FaChartArea,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import { useFinance } from "../../context/FinanceContext";

// Utility functions
const calculateCategoryTotals = (transactions) => {
  const totals = {};
  transactions.forEach((t) => {
    if (!totals[t.category]) totals[t.category] = 0;
    totals[t.category] += Math.abs(t.amount);
  });
  return totals;
};

const calculateBudgetProgress = (budget, transactions) => {
  const spent = transactions
    .filter((t) => t.category === budget.category)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const progress = budget.amount > 0 ? spent / budget.amount : 0;
  return { spent, progress };
};

const formatCurrency = (amount, symbol = "$") => {
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
};

function CategoryBreakdown() {
  const { isDarkTheme } = useTheme();
  const { transactions, budgets, loading, refreshData } = useFinance();

  const [viewMode, setViewMode] = useState("dashboard");
  const [dateRange, setDateRange] = useState([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chartSize, setChartSize] = useState("medium");
  const [colorScheme, setColorScheme] = useState("default");
  const [showTooltips, setShowTooltips] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [chartAnimations, setChartAnimations] = useState(true);

  const fullscreenRef = useRef();
  const lastUpdated = new Date().toISOString();

  const getColors = useCallback(() => {
    const schemes = {
      default: isDarkTheme
        ? ["#60A5FA", "#F87171", "#34D399", "#FBBF24"]
        : ["#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
      vibrant: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
      pastel: ["#AED6F1", "#F1948A", "#A9DFBF", "#F9E79F"],
    };
    return schemes[colorScheme] || schemes.default;
  }, [isDarkTheme, colorScheme]);

  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const { startDate, endDate } = dateRange[0];
      if (startDate && transactionDate < new Date(startDate)) return false;
      if (endDate && transactionDate > new Date(endDate)) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, dateRange, typeFilter]);

  const categoryTotals = useMemo(
    () => calculateCategoryTotals(filteredTransactions),
    [filteredTransactions]
  );

  const pieData = useMemo(() => {
    const data = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.abs(value),
      percentage: 0,
      transactions: filteredTransactions.filter((t) => t.category === name)
        .length,
    }));
    const total = data.reduce((sum, item) => sum + item.value, 0);
    data.forEach((item) => {
      item.percentage = total > 0 ? (item.value / total) * 100 : 0;
    });
    return data.sort((a, b) => b.value - a.value);
  }, [categoryTotals, filteredTransactions]);

  const barData = useMemo(() => {
    if (!budgets || !Array.isArray(budgets)) return [];
    return budgets.map((budget) => {
      const { spent, progress } = calculateBudgetProgress(
        budget,
        filteredTransactions
      );
      const remaining = Math.max(0, budget.amount - Math.abs(spent));
      return {
        name: budget.category,
        budgeted: budget.amount,
        spent: Math.abs(spent),
        remaining,
        progress: progress * 100,
      };
    });
  }, [budgets, filteredTransactions]);

  const timeSeriesData = useMemo(() => {
    const grouped = {};
    filteredTransactions.forEach((t) => {
      const date = new Date(t.date).toISOString().split("T")[0];
      if (!grouped[date])
        grouped[date] = { date, income: 0, expenses: 0, net: 0 };
      if (t.type === "income") grouped[date].income += t.amount;
      else grouped[date].expenses += Math.abs(t.amount);
      grouped[date].net = grouped[date].income - grouped[date].expenses;
    });
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [filteredTransactions]);

  const COLORS = getColors();

  const themeClasses = {
    background: isDarkTheme
      ? "bg-slate-900 text-white"
      : "bg-slate-50 text-slate-900",
    card: isDarkTheme
      ? "bg-slate-800 border-slate-700 text-white"
      : "bg-white border-slate-200 text-slate-900",
    button: isDarkTheme
      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
      : "bg-indigo-500 hover:bg-indigo-600 text-white",
    buttonSecondary: isDarkTheme
      ? "bg-slate-700 hover:bg-slate-600 text-white"
      : "bg-slate-200 hover:bg-slate-300 text-slate-900",
    select: isDarkTheme
      ? "bg-slate-700 border-slate-600 text-white"
      : "bg-white border-slate-300 text-slate-900",
  };

  const getChartHeight = () => {
    const sizes = { small: 250, medium: 350, large: 450, xlarge: 550 };
    return sizes[chartSize] || sizes.medium;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${themeClasses.card}`}>
          <p className="font-semibold text-left">{data.name || label}</p>
          <p className="text-sm text-left">
            Amount: {formatCurrency(data.value || payload[0].value)}
          </p>
          {data.percentage && (
            <p className="text-sm text-left">
              Percentage: {data.percentage.toFixed(1)}%
            </p>
          )}
          {data.transactions && (
            <p className="text-sm text-left">
              Transactions: {data.transactions}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const stats = useMemo(() => {
    // Ensure pieData contains valid entries
    const validPieData = pieData.filter(
      (item) => typeof item.value === "number" && !isNaN(item.value)
    );
    const totalAmount = validPieData.reduce((sum, item) => sum + item.value, 0);
    const totalTransactions = validPieData.reduce(
      (sum, item) => sum + (item.transactions || 0),
      0
    );
    const categoriesCount = validPieData.length;
    const avgPerCategory =
      categoriesCount > 0 ? totalAmount / categoriesCount : 0;
    const avgPerTransaction =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    return {
      totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
      totalTransactions: isNaN(totalTransactions) ? 0 : totalTransactions,
      avgPerCategory: isNaN(avgPerCategory) ? 0 : avgPerCategory,
      avgPerTransaction: isNaN(avgPerTransaction) ? 0 : avgPerTransaction,
      categoriesCount: isNaN(categoriesCount) ? 0 : categoriesCount,
    };
  }, [pieData]);

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {[
        { label: "Total Amount", key: "totalAmount" },
        { label: "Categories", key: "categoriesCount" },
        { label: "Total Transactions", key: "totalTransactions" },
        { label: "Avg per Category", key: "avgPerCategory" },
        { label: "Avg per Transaction", key: "avgPerTransaction" },
      ].map(({ label, key }, i) => (
        <div
          key={label}
          className={`p-4 rounded-lg border ${themeClasses.card}`}
        >
          <div className="flex items-start justify-between">
            <div className="text-left">
              <p className="text-sm opacity-75 text-left">{label}</p>
              <p className="text-xl font-bold text-left">
                {formatCurrency(stats[key])}
              </p>
            </div>
            <div className="text-2xl opacity-50">
              {["💰", "📊", "🔢", "📈", "💳"][i]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPieChart = () => (
    <div className={`p-6 rounded-lg border ${themeClasses.card}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-left">
        <FaChartPie /> Category Distribution
      </h3>
      <ResponsiveContainer width="100%" height={getChartHeight()}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              name,
              percentage,
            }) => {
              const RADIAN = Math.PI / 180;
              const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
              const x = cx + radius * Math.cos(-midAngle * RADIAN) * 0.6;
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill={isDarkTheme ? "#FFFFFF" : "#000000"}
                  textAnchor="start"
                  dominantBaseline="central"
                  className="text-xs"
                >
                  {`${name}: ${percentage.toFixed(1)}%`}
                </text>
              );
            }}
            outerRadius={100}
            dataKey="value"
            animationBegin={0}
            animationDuration={chartAnimations ? 800 : 0}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          {showTooltips && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const renderBarChart = () => (
    <div className={`p-6 rounded-lg border ${themeClasses.card}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-left">
        <FaChartBar /> Budget vs Spending
      </h3>
      <ResponsiveContainer width="100%" height={getChartHeight()}>
        <BarChart data={barData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkTheme ? "#475569" : "#E2E8F0"}
          />
          <XAxis dataKey="name" stroke={isDarkTheme ? "#94A3B8" : "#64748B"} />
          <YAxis stroke={isDarkTheme ? "#94A3B8" : "#64748B"} />
          {showTooltips && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend />}
          <Bar dataKey="budgeted" fill={COLORS[0]} name="Budgeted" />
          <Bar dataKey="spent" fill={COLORS[1]} name="Spent" />
          <Bar dataKey="remaining" fill={COLORS[2]} name="Remaining" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderLineChart = () => (
    <div className={`p-6 rounded-lg border ${themeClasses.card}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-left">
        <FaChartLine /> Spending Trends
      </h3>
      <ResponsiveContainer width="100%" height={getChartHeight()}>
        <LineChart data={timeSeriesData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkTheme ? "#475569" : "#E2E8F0"}
          />
          <XAxis dataKey="date" stroke={isDarkTheme ? "#94A3B8" : "#64748B"} />
          <YAxis stroke={isDarkTheme ? "#94A3B8" : "#64748B"} />
          {showTooltips && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="income"
            stroke={COLORS[2]}
            strokeWidth={2}
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke={COLORS[1]}
            strokeWidth={2}
            name="Expenses"
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke={COLORS[0]}
            strokeWidth={2}
            name="Net"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderAreaChart = () => (
    <div className={`p-6 rounded-lg border ${themeClasses.card}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-left">
        <FaChartArea /> Cumulative Analysis
      </h3>
      <ResponsiveContainer width="100%" height={getChartHeight()}>
        <AreaChart data={timeSeriesData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkTheme ? "#475569" : "#E2E8F0"}
          />
          <XAxis dataKey="date" stroke={isDarkTheme ? "#94A3B8" : "#64748B"} />
          <YAxis stroke={isDarkTheme ? "#94A3B8" : "#64748B"} />
          {showTooltips && <Tooltip content={<CustomTooltip />} />}
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey="income"
            stackId="1"
            stroke={COLORS[2]}
            fill={COLORS[2]}
            fillOpacity={0.6}
            name="Income"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stackId="1"
            stroke={COLORS[1]}
            fill={COLORS[1]}
            fillOpacity={0.6}
            name="Expenses"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {renderStatsCards()}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderPieChart()}
        {renderBarChart()}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderLineChart()}
        {renderAreaChart()}
      </div>
    </div>
  );

  const renderView = () => {
    switch (viewMode) {
      case "pie":
        return renderPieChart();
      case "bar":
        return renderBarChart();
      case "line":
        return renderLineChart();
      case "area":
        return renderAreaChart();
      case "all":
        return (
          <div className="space-y-6">
            {renderPieChart()} {renderBarChart()} {renderLineChart()}{" "}
            {renderAreaChart()}
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = (format) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const data =
      format === "csv"
        ? pieData
            .map(
              (item) =>
                `${item.name},${item.value},${item.percentage.toFixed(2)}%`
            )
            .join("\n")
        : JSON.stringify(pieData, null, 2);
    const blob = new Blob([data], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `category_breakdown_${timestamp}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={fullscreenRef}
      className={`min-h-screen p-6 ${themeClasses.background} transition-colors duration-300`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
        <div className="flex items-center gap-4 text-left">
          <h1 className="text-3xl font-bold text-left">Category Breakdown</h1>
          <span className="text-sm opacity-75 text-left">
            Last Updated: {new Date(lastUpdated).toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-left">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className={`${themeClasses.button} flex items-center gap-2 px-4 py-2 rounded-lg`}
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />{" "}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => handleExport("csv")}
            className={`${themeClasses.button} flex items-center gap-2 px-4 py-2 rounded-lg`}
          >
            <FaFileExport /> Export CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            className={`${themeClasses.button} flex items-center gap-2 px-4 py-2 rounded-lg`}
          >
            <FaSave /> Export JSON
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`${themeClasses.buttonSecondary} flex items-center gap-2 px-4 py-2 rounded-lg`}
          >
            <FaCog /> Settings
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 items-center text-left">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`${themeClasses.select} p-2 rounded-lg border`}
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className={`${themeClasses.select} p-2 rounded-lg border`}
        >
          <option value="dashboard">Dashboard</option>
          <option value="pie">Pie Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="area">Area Chart</option>
          <option value="all">All Charts</option>
        </select>
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`${themeClasses.button} flex items-center gap-2 px-4 py-2 rounded-lg`}
        >
          <FaCalendarAlt /> Filter Dates
        </button>
      </div>

      {showDatePicker && (
        <div className={`mb-6 ${themeClasses.card} p-4 rounded-lg`}>
          <DateRangePicker
            ranges={dateRange}
            onChange={(item) => setDateRange([item.selection])}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            months={1}
            direction="horizontal"
            className="rdrCalendarWrapper"
            dayDisplayFormat="dd/MM/yyyy"
            monthDisplayFormat="MMMM yyyy"
            style={{
              background: isDarkTheme ? "#4B5563" : "#FFFFFF",
              color: isDarkTheme ? "#D1D5DB" : "#374151",
              border: "none",
            }}
          />
          <button
            onClick={() => setShowDatePicker(false)}
            className={`${themeClasses.button} mt-2 px-4 py-2 rounded-lg`}
          >
            Close
          </button>
        </div>
      )}

      {showSettings && (
        <div className={`mb-6 ${themeClasses.card} p-4 rounded-lg`}>
          <h3 className="text-lg font-semibold mb-4 text-left">Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-left">
                Chart Size
              </label>
              <select
                value={chartSize}
                onChange={(e) => setChartSize(e.target.value)}
                className={`${themeClasses.select} w-full p-2 rounded border`}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xlarge">X-Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-left">
                Color Scheme
              </label>
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
                className={`${themeClasses.select} w-full p-2 rounded border`}
              >
                <option value="default">Default</option>
                <option value="vibrant">Vibrant</option>
                <option value="pastel">Pastel</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-left">
                <input
                  type="checkbox"
                  checked={showTooltips}
                  onChange={(e) => setShowTooltips(e.target.checked)}
                />{" "}
                Show Tooltips
              </label>
              <label className="flex items-center gap-2 text-left">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                />{" "}
                Show Legend
              </label>
              <label className="flex items-center gap-2 text-left">
                <input
                  type="checkbox"
                  checked={chartAnimations}
                  onChange={(e) => setChartAnimations(e.target.checked)}
                />{" "}
                Animations
              </label>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : pieData.length === 0 ? (
        <p className="text-center py-6 opacity-75">
          No data available for the selected filters.
        </p>
      ) : (
        renderView()
      )}
    </div>
  );
}

export default CategoryBreakdown;
