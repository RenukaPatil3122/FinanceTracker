import React, { useState, useEffect, useMemo } from "react";
import { useFinance } from "../../context/FinanceContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaSync,
  FaDownload,
  FaFilter,
  FaExpand,
  FaCompress,
  FaArrowUp, // Replace FaTrendingUp with FaArrowUp
  FaArrowDown, // Replace FaTrendingDown with FaArrowDown
} from "react-icons/fa";

// Utility functions
const formatCurrency = (amount, currency = "USD") => {
  const symbols = { USD: "$", EUR: "€", INR: "₹", GBP: "£", JPY: "¥" };
  return `${symbols[currency] || "$"}${Math.abs(amount).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
};

const safeToFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return "0.00";
  return Number(value).toFixed(decimals);
};

const calculateMonthlyTotals = (transactions, type) => {
  const monthlyData = {};

  transactions
    .filter((t) => t && t.type === type && t.date && t.amount)
    .forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { date: monthKey, amount: 0 };
      }
      monthlyData[monthKey].amount += transaction.amount;
    });

  return Object.values(monthlyData).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, currency, isDarkTheme }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-4 rounded-lg shadow-xl border backdrop-blur-sm ${
          isDarkTheme
            ? "bg-gray-800/90 border-gray-600 text-white"
            : "bg-white/90 border-gray-200 text-gray-900"
        }`}
      >
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>
              {entry.name}: {formatCurrency(entry.value || 0, currency)}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart Type Selector
const ChartTypeSelector = ({ chartType, setChartType, isDarkTheme }) => {
  const chartTypes = [
    { value: "line", label: "Line Chart", icon: FaChartLine },
    { value: "area", label: "Area Chart", icon: FaChartLine },
    { value: "bar", label: "Bar Chart", icon: FaChartBar },
    { value: "pie", label: "Pie Chart", icon: FaChartPie },
  ];

  return (
    <div className="flex gap-2">
      {chartTypes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setChartType(value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            chartType === value
              ? "bg-blue-500 text-white"
              : isDarkTheme
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          title={label}
        >
          <Icon className="text-sm" />
          <span className="hidden sm:inline text-sm">
            {label.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  isDarkTheme,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-6 rounded-xl shadow-lg border-l-4 hover:shadow-xl transition-all duration-300 ${
      isDarkTheme ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
    }`}
    style={{ borderLeftColor: color }}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            isDarkTheme ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {title}
        </p>
        <p
          className={`text-2xl font-bold mt-1 ${
            isDarkTheme ? "text-white" : "text-gray-900"
          }`}
        >
          {value}
        </p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" ? (
              <FaArrowUp className="text-green-500 text-sm" />
            ) : trend === "down" ? (
              <FaArrowDown className="text-red-500 text-sm" />
            ) : null}
            <span
              className={`text-sm font-medium ${
                trend === "up"
                  ? "text-green-500"
                  : trend === "down"
                  ? "text-red-500"
                  : isDarkTheme
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {safeToFixed(change, 1)}%
            </span>
          </div>
        )}
      </div>
      <Icon className="text-3xl opacity-80" style={{ color }} />
    </div>
  </motion.div>
);

// Main Component
const IncomeChart = () => {
  const { transactions = [], loading, refreshData } = useFinance();
  const { user } = useAuth();
  const { isDarkTheme } = useTheme(); // Changed from isDarkMode to isDarkTheme

  const [currency, setCurrency] = useState(
    user?.preferences?.currency || "USD"
  );
  const [chartType, setChartType] = useState("line");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dateFilter, setDateFilter] = useState("6months");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh || !refreshData) return;

    const interval = setInterval(() => {
      refreshData();
      setLastUpdated(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshData, autoRefresh]);

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();

    switch (dateFilter) {
      case "1month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        filterDate.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(
      (t) => t && t.date && new Date(t.date) >= filterDate
    );
  }, [transactions, dateFilter]);

  // Calculate chart data
  const chartData = useMemo(() => {
    const incomeData = calculateMonthlyTotals(filteredTransactions, "income");
    const expenseData = calculateMonthlyTotals(filteredTransactions, "expense");

    return incomeData.map((income) => {
      const matchingExpense = expenseData.find(
        (exp) => exp.date === income.date
      ) || { amount: 0 };
      const profit = income.amount - matchingExpense.amount;

      return {
        date: income.date,
        income: income.amount,
        expense: matchingExpense.amount,
        profit,
        margin: income.amount > 0 ? (profit / income.amount) * 100 : 0,
      };
    });
  }, [filteredTransactions]);

  // Calculate category data for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals = filteredTransactions
      .filter((t) => t && t.type === "income" && t.category)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
        return acc;
      }, {});

    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        fill: `hsl(${(index * 45) % 360}, 70%, 50%)`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);
    const totalProfit = totalIncome - totalExpense;
    const avgMargin =
      chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d.margin, 0) / chartData.length
        : 0;

    // Calculate trends (comparing last two periods)
    const getChange = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    const currentPeriod = chartData[chartData.length - 1] || {};
    const previousPeriod = chartData[chartData.length - 2] || {};

    return {
      totalIncome: {
        value: formatCurrency(totalIncome, currency),
        change: getChange(currentPeriod.income, previousPeriod.income),
        trend: currentPeriod.income > previousPeriod.income ? "up" : "down",
      },
      totalExpense: {
        value: formatCurrency(totalExpense, currency),
        change: getChange(currentPeriod.expense, previousPeriod.expense),
        trend: currentPeriod.expense > previousPeriod.expense ? "up" : "down",
      },
      totalProfit: {
        value: formatCurrency(totalProfit, currency),
        change: getChange(currentPeriod.profit, previousPeriod.profit),
        trend: currentPeriod.profit > previousPeriod.profit ? "up" : "down",
      },
      avgMargin: {
        value: `${safeToFixed(avgMargin, 1)}%`,
        change: currentPeriod.margin - previousPeriod.margin,
        trend: currentPeriod.margin > previousPeriod.margin ? "up" : "down",
      },
    };
  }, [chartData, currency]);

  // Theme colors
  const colors = {
    income: isDarkTheme ? "#10b981" : "#059669",
    expense: isDarkTheme ? "#ef4444" : "#dc2626",
    profit: isDarkTheme ? "#3b82f6" : "#2563eb",
    warning: isDarkTheme ? "#f59e0b" : "#d97706",
  };

  // Export functionality
  const handleExport = () => {
    const exportData = chartData.map((item) => ({
      Date: item.date,
      Income: item.income,
      Expense: item.expense,
      Profit: item.profit,
      Margin: `${safeToFixed(item.margin, 2)}%`,
    }));

    const csv = [
      Object.keys(exportData[0]).join(","),
      ...exportData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.income} stopOpacity={0.8} />
                <stop
                  offset="95%"
                  stopColor={colors.income}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.expense}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={colors.expense}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkTheme ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              dataKey="date"
              stroke={isDarkTheme ? "#9ca3af" : "#6b7280"}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, currency)}
              stroke={isDarkTheme ? "#9ca3af" : "#6b7280"}
            />
            <Tooltip
              content={
                <CustomTooltip currency={currency} isDarkTheme={isDarkTheme} />
              }
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              stroke={colors.income}
              fill="url(#incomeGradient)"
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke={colors.expense}
              fill="url(#expenseGradient)"
              name="Expense"
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkTheme ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              dataKey="date"
              stroke={isDarkTheme ? "#9ca3af" : "#6b7280"}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, currency)}
              stroke={isDarkTheme ? "#9ca3af" : "#6b7280"}
            />
            <Tooltip
              content={
                <CustomTooltip currency={currency} isDarkTheme={isDarkTheme} />
              }
            />
            <Legend />
            <Bar dataKey="income" fill={colors.income} name="Income" />
            <Bar dataKey="expense" fill={colors.expense} name="Expense" />
            <Bar dataKey="profit" fill={colors.profit} name="Profit" />
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={120}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={
                <CustomTooltip currency={currency} isDarkTheme={isDarkTheme} />
              }
            />
            <Legend />
          </PieChart>
        );

      default: // line chart
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkTheme ? "#374151" : "#e5e7eb"}
            />
            <XAxis
              dataKey="date"
              stroke={isDarkTheme ? "#9ca3af" : "#6b7280"}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, currency)}
              stroke={isDarkTheme ? "#9ca3af" : "#6b7280"}
            />
            <Tooltip
              content={
                <CustomTooltip currency={currency} isDarkTheme={isDarkTheme} />
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke={colors.income}
              strokeWidth={2}
              name="Income"
              dot={{ fill: colors.income, strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke={colors.expense}
              strokeWidth={2}
              name="Expense"
              dot={{ fill: colors.expense, strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke={colors.profit}
              strokeWidth={2}
              name="Profit"
              dot={{ fill: colors.profit, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkTheme ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkTheme ? "bg-gray-900" : "bg-gray-50"
      } ${isFullscreen ? "fixed inset-0 z-50 overflow-auto" : "p-6"}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1
            className={`text-3xl font-bold ${
              isDarkTheme ? "text-white" : "text-gray-900"
            }`}
          >
            Income Analytics
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span
              className={`text-sm ${
                isDarkTheme ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {autoRefresh ? "Live" : "Paused"} • Last updated:{" "}
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${
              isDarkTheme
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 ${
              isDarkTheme
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="INR">INR (₹)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
          </select>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-500 hover:bg-gray-600 text-white"
            }`}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            <FaSync className={autoRefresh ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleExport}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            title="Export data"
          >
            <FaDownload />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkTheme
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            }`}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Income"
          value={stats.totalIncome.value}
          change={stats.totalIncome.change}
          trend={stats.totalIncome.trend}
          icon={FaChartLine}
          color={colors.income}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpense.value}
          change={stats.totalExpense.change}
          trend={stats.totalExpense.trend}
          icon={FaChartBar}
          color={colors.expense}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          title="Net Profit"
          value={stats.totalProfit.value}
          change={stats.totalProfit.change}
          trend={stats.totalProfit.trend}
          icon={FaArrowUp}
          color={colors.profit}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          title="Profit Margin"
          value={stats.avgMargin.value}
          change={stats.avgMargin.change}
          trend={stats.avgMargin.trend}
          icon={FaChartPie}
          color={colors.warning}
          isDarkTheme={isDarkTheme}
        />
      </div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl shadow-lg p-6 ${
          isDarkTheme ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2
            className={`text-xl font-semibold ${
              isDarkTheme ? "text-white" : "text-gray-900"
            }`}
          >
            {chartType === "pie" ? "Income by Category" : "Financial Trends"}
          </h2>
          <ChartTypeSelector
            chartType={chartType}
            setChartType={setChartType}
            isDarkTheme={isDarkTheme}
          />
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p
              className={`text-xl ${
                isDarkTheme ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No data available for the selected period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isFullscreen ? 600 : 400}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Real-time indicator */}
      <div
        className={`mt-4 text-center text-sm ${
          isDarkTheme ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <p>
          Data refreshes automatically every 30 seconds •{" "}
          {filteredTransactions.length} transactions analyzed
        </p>
      </div>
    </div>
  );
};

export default IncomeChart;
