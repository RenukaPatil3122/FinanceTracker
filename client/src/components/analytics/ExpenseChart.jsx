import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { useFinance } from "../../context/FinanceContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  Activity,
  AlertCircle,
} from "lucide-react";

// Utility functions
const formatCurrency = (amount, currency = "USD") => {
  const symbols = { USD: "$", EUR: "€", INR: "₹", GBP: "£", JPY: "¥" };
  return `${symbols[currency] || "$"}${Math.abs(amount).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
};

// Helper function to process transactions into monthly data
const processTransactionsData = (transactions, budgets) => {
  if (!transactions || !Array.isArray(transactions)) return [];

  // Group transactions by month
  const monthlyData = {};
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const fullMonthKey = `${date.getFullYear()}-${date.getMonth()}`;

    monthlyData[fullMonthKey] = {
      month: monthKey,
      income: 0,
      expenses: 0,
      savings: 0,
      categories: {
        Food: 0,
        Transport: 0,
        Entertainment: 0,
        Bills: 0,
        Shopping: 0,
        Other: 0,
      },
    };
  }

  // Process transactions
  transactions.forEach((transaction) => {
    if (!transaction.date) return;

    const transactionDate = new Date(transaction.date);
    const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;

    if (!monthlyData[monthKey]) return;

    const amount = Math.abs(Number(transaction.amount) || 0);
    const category = transaction.category || "Other";

    if (transaction.type === "income") {
      monthlyData[monthKey].income += amount;
    } else if (transaction.type === "expense") {
      monthlyData[monthKey].expenses += amount;

      // Categorize expenses
      if (monthlyData[monthKey].categories.hasOwnProperty(category)) {
        monthlyData[monthKey].categories[category] += amount;
      } else {
        monthlyData[monthKey].categories.Other += amount;
      }
    }
  });

  // Calculate savings (income - expenses)
  Object.values(monthlyData).forEach((month) => {
    month.savings = Math.max(0, month.income - month.expenses);
  });

  return Object.values(monthlyData);
};

const ExpenseChart = () => {
  const { isDarkTheme } = useTheme();
  const { transactions, budgets, loading, refreshData } = useFinance();
  const [chartType, setChartType] = useState("area");
  const [currency, setCurrency] = useState("USD");
  const [timeRange, setTimeRange] = useState("6m");
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Process real data from FinanceContext
  const data = useMemo(() => {
    return processTransactionsData(transactions, budgets);
  }, [transactions, budgets]);

  // Theme colors
  const colors = {
    primary: isDarkTheme ? "#3b82f6" : "#2563eb",
    success: isDarkTheme ? "#10b981" : "#059669",
    danger: isDarkTheme ? "#ef4444" : "#dc2626",
    warning: isDarkTheme ? "#f59e0b" : "#d97706",
    background: isDarkTheme ? "#1f2937" : "#ffffff",
    surface: isDarkTheme ? "#374151" : "#f8fafc",
    text: isDarkTheme ? "#f3f4f6" : "#1f2937",
    textSecondary: isDarkTheme ? "#9ca3af" : "#6b7280",
    border: isDarkTheme ? "#4b5563" : "#e5e7eb",
    gradient: isDarkTheme
      ? "from-gray-900 via-gray-800 to-gray-900"
      : "from-blue-50 via-white to-purple-50",
  };

  // Auto-refresh data
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      refreshData();
      setLastUpdated(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isLive, refreshData]);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
    const totalSavings = data.reduce((sum, item) => sum + item.savings, 0);
    const netProfit = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    // Calculate expense growth (comparing first and last month)
    const expenseGrowth =
      data.length > 1 && data[0].expenses > 0
        ? ((data[data.length - 1].expenses - data[0].expenses) /
            data[0].expenses) *
          100
        : 0;

    return {
      totalExpenses,
      totalIncome,
      totalSavings,
      netProfit,
      savingsRate,
      expenseGrowth,
    };
  }, [data]);

  // Category data for pie chart from real data
  const categoryData = useMemo(() => {
    const categories = data.reduce((acc, month) => {
      Object.entries(month.categories).forEach(([category, amount]) => {
        if (amount > 0) {
          acc[category] = (acc[category] || 0) + amount;
        }
      });
      return acc;
    }, {});

    return Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value,
        fill: `hsl(${(index * 60) % 360}, 70%, ${isDarkTheme ? 60 : 50}%)`,
      }));
  }, [data, isDarkTheme]);

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div
      className={`p-6 rounded-xl shadow-lg border ${
        isDarkTheme
          ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
          : "bg-white border-gray-200 hover:bg-gray-50"
      } transition-all duration-300 hover:shadow-xl hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${
            color === "success"
              ? "bg-green-100 dark:bg-green-900"
              : color === "danger"
              ? "bg-red-100 dark:bg-red-900"
              : color === "warning"
              ? "bg-yellow-100 dark:bg-yellow-900"
              : "bg-blue-100 dark:bg-blue-900"
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              color === "success"
                ? "text-green-600 dark:text-green-400"
                : color === "danger"
                ? "text-red-600 dark:text-red-400"
                : color === "warning"
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-blue-600 dark:text-blue-400"
            }`}
          />
        </div>
        {change !== undefined && !isNaN(change) && (
          <div
            className={`flex items-center ${
              change >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium ml-1">
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <h3 className={`text-sm font-medium ${colors.textSecondary}`}>{title}</h3>
      <p className={`text-2xl font-bold ${colors.text} mt-1`}>{value}</p>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-4 rounded-lg shadow-xl border ${
            isDarkTheme
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-200"
          }`}
        >
          <p className={`font-semibold ${colors.text} mb-2`}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle
              className={`w-12 h-12 ${colors.textSecondary} mx-auto mb-4`}
            />
            <p className={`${colors.textSecondary}`}>
              No transaction data available
            </p>
            <p className={`text-sm ${colors.textSecondary} mt-2`}>
              Add some transactions to see your financial trends
            </p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.success}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={colors.success}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.danger} stopOpacity={0.8} />
                <stop
                  offset="95%"
                  stopColor={colors.danger}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="month" stroke={colors.textSecondary} />
            <YAxis stroke={colors.textSecondary} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              stroke={colors.success}
              fill="url(#incomeGradient)"
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={colors.danger}
              fill="url(#expenseGradient)"
              name="Expenses"
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="month" stroke={colors.textSecondary} />
            <YAxis stroke={colors.textSecondary} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="income"
              fill={colors.success}
              name="Income"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              fill={colors.danger}
              name="Expenses"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="savings"
              fill={colors.warning}
              name="Savings"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      case "pie":
        return categoryData.length > 0 ? (
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
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className={`${colors.textSecondary}`}>
              No expense categories to display
            </p>
          </div>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="month" stroke={colors.textSecondary} />
            <YAxis stroke={colors.textSecondary} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke={colors.success}
              strokeWidth={3}
              name="Income"
              dot={{ fill: colors.success, strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke={colors.danger}
              strokeWidth={3}
              name="Expenses"
              dot={{ fill: colors.danger, strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke={colors.warning}
              strokeWidth={3}
              name="Savings"
              dot={{ fill: colors.warning, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} p-6`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw
              className={`w-12 h-12 ${colors.textSecondary} mx-auto mb-4 animate-spin`}
            />
            <p className={`${colors.textSecondary}`}>
              Loading financial data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} p-6`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${colors.text} mb-2`}>
            Financial Analytics
          </h1>
          <p className={`${colors.textSecondary} flex items-center`}>
            <Calendar className="w-4 h-4 mr-2" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              isLive
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-500 hover:bg-gray-600 text-white"
            }`}
          >
            {isLive ? (
              <Activity className="w-4 h-4 mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isLive ? "Live" : "Paused"}
          </button>

          <button
            onClick={() => {
              refreshData();
              setLastUpdated(new Date());
            }}
            className={`flex items-center px-4 py-2 rounded-lg transition-all bg-blue-500 hover:bg-blue-600 text-white`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkTheme
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
          </select>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkTheme
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="INR">INR (₹)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Income"
          value={formatCurrency(stats.totalIncome, currency)}
          change={stats.totalIncome > 0 ? 5.2 : undefined}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses, currency)}
          change={stats.expenseGrowth}
          icon={TrendingDown}
          color="danger"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(stats.netProfit, currency)}
          change={stats.netProfit >= 0 ? 12.3 : -8.5}
          icon={DollarSign}
          color={stats.netProfit >= 0 ? "success" : "danger"}
        />
        <StatCard
          title="Savings Rate"
          value={`${stats.savingsRate.toFixed(1)}%`}
          change={stats.savingsRate > 0 ? 2.1 : undefined}
          icon={BarChart3}
          color="warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div
          className={`lg:col-span-2 p-6 rounded-xl shadow-lg ${
            colors.background
          } border ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${colors.text}`}>
              Financial Trends
            </h2>
            <div className={`flex items-center ${colors.textSecondary}`}>
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span className="text-sm">{isLive ? "Live Data" : "Static"}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <div
            className={`p-6 rounded-xl shadow-lg ${colors.background} border ${
              isDarkTheme ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
              Expense Categories
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              {categoryData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className={`text-center ${colors.textSecondary}`}>
                    No expense data available
                  </p>
                </div>
              )}
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div
            className={`p-6 rounded-xl shadow-lg ${colors.background} border ${
              isDarkTheme ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
              Smart Insights
            </h3>
            <div className="space-y-3">
              <div
                className={`p-3 rounded-lg ${
                  isDarkTheme ? "bg-blue-900/20" : "bg-blue-50"
                } border-l-4 border-blue-500`}
              >
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${colors.text}`}>
                      Spending Pattern
                    </p>
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>
                      {stats.expenseGrowth >= 0
                        ? `Your expenses increased by ${Math.abs(
                            stats.expenseGrowth
                          ).toFixed(1)}% this period`
                        : `Your expenses decreased by ${Math.abs(
                            stats.expenseGrowth
                          ).toFixed(1)}% this period`}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg ${
                  isDarkTheme ? "bg-green-900/20" : "bg-green-50"
                } border-l-4 border-green-500`}
              >
                <div className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${colors.text}`}>
                      Savings Goal
                    </p>
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>
                      You're saving {stats.savingsRate.toFixed(1)}% of your
                      income
                    </p>
                  </div>
                </div>
              </div>

              {transactions.length > 0 && (
                <div
                  className={`p-3 rounded-lg ${
                    isDarkTheme ? "bg-purple-900/20" : "bg-purple-50"
                  } border-l-4 border-purple-500`}
                >
                  <div className="flex items-start">
                    <BarChart3 className="w-5 h-5 text-purple-500 mr-2 mt-0.5" />
                    <div>
                      <p className={`text-sm font-medium ${colors.text}`}>
                        Transaction Activity
                      </p>
                      <p className={`text-xs ${colors.textSecondary} mt-1`}>
                        You have {transactions.length} transactions recorded
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;
