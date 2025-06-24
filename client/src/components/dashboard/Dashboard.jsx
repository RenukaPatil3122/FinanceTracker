import { useState, useEffect, useMemo } from "react";
import StatCard from "./StatCard";
import QuickActions from "./QuickActions";
import { useFinance } from "../../context/FinanceContext";
import { useTheme } from "../../context/ThemeContext";
import { calculateBalance } from "../../utils/calculations";
import { formatCurrency } from "../../utils/formatters";
import LoadingSpinner from "../common/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

function Dashboard() {
  const { transactions, budgets, goals, loading, categories } = useFinance();
  const { isDarkTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showBalances, setShowBalances] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  // Advanced calculations with period filtering
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const periodStart = new Date();

    switch (selectedPeriod) {
      case "week":
        periodStart.setDate(now.getDate() - 7);
        break;
      case "month":
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case "year":
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter((t) => new Date(t.date) >= periodStart);
  }, [transactions, selectedPeriod]);

  const dashboardData = useMemo(() => {
    const balance = calculateBalance(transactions);
    const periodBalance = calculateBalance(filteredTransactions);

    const totalExpenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);

    // Previous period comparison
    const prevPeriodStart = new Date();
    const prevPeriodEnd = new Date();

    switch (selectedPeriod) {
      case "week":
        prevPeriodStart.setDate(prevPeriodStart.getDate() - 14);
        prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 7);
        break;
      case "month":
        prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 2);
        prevPeriodEnd.setMonth(prevPeriodEnd.getMonth() - 1);
        break;
      case "quarter":
        prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 6);
        prevPeriodEnd.setMonth(prevPeriodEnd.getMonth() - 3);
        break;
      case "year":
        prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 2);
        prevPeriodEnd.setFullYear(prevPeriodEnd.getFullYear() - 1);
        break;
    }

    const prevPeriodTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= prevPeriodStart && date <= prevPeriodEnd;
    });

    const prevIncome = prevPeriodTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);

    const prevExpenses = prevPeriodTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    // Calculate percentage changes
    const incomeChange = prevIncome
      ? ((totalIncome - prevIncome) / prevIncome) * 100
      : 0;
    const expenseChange = prevExpenses
      ? ((totalExpenses - prevExpenses) / prevExpenses) * 100
      : 0;
    const savingsRate = totalIncome
      ? ((totalIncome - totalExpenses) / totalIncome) * 100
      : 0;

    // Top spending categories
    const categorySpending = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categorySpending[t.category] =
          (categorySpending[t.category] || 0) + t.amount;
      });

    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Budget analysis
    const budgetAnalysis =
      budgets?.map((budget) => {
        const spent = filteredTransactions
          .filter((t) => t.type === "expense" && t.category === budget.category)
          .reduce((acc, t) => acc + t.amount, 0);

        const percentage = budget.amount ? (spent / budget.amount) * 100 : 0;
        const status =
          percentage > 100 ? "over" : percentage > 80 ? "warning" : "good";

        return { ...budget, spent, percentage, status };
      }) || [];

    return {
      balance,
      periodBalance,
      totalExpenses,
      totalIncome,
      incomeChange,
      expenseChange,
      savingsRate,
      topCategories,
      budgetAnalysis,
      transactionCount: filteredTransactions.length,
      avgTransactionAmount: filteredTransactions.length
        ? filteredTransactions.reduce((acc, t) => acc + t.amount, 0) /
          filteredTransactions.length
        : 0,
    };
  }, [transactions, filteredTransactions, budgets, selectedPeriod]);

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [selectedPeriod]);

  if (loading) return <LoadingSpinner />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const periodOptions = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  return (
    <motion.div
      key={animationKey}
      className="min-h-screen transition-all duration-700 relative overflow-hidden"
      style={{
        background: isDarkTheme
          ? `linear-gradient(135deg, 
              rgb(15, 23, 42) 0%, 
              rgba(99, 102, 241, 0.08) 30%, 
              rgba(139, 92, 246, 0.05) 70%, 
              rgb(15, 23, 42) 100%)`
          : `linear-gradient(135deg, 
              rgb(248, 250, 252) 0%, 
              rgba(99, 102, 241, 0.04) 30%, 
              rgba(139, 92, 246, 0.03) 70%, 
              rgb(248, 250, 252) 100%)`,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${
              isDarkTheme
                ? "rgba(99, 102, 241, 0.3)"
                : "rgba(99, 102, 241, 0.1)"
            } 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${
              isDarkTheme
                ? "rgba(139, 92, 246, 0.3)"
                : "rgba(139, 92, 246, 0.1)"
            } 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Enhanced Header Section */}
        <motion.div className="mb-12" variants={itemVariants}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-2xl ${
                    isDarkTheme
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                      : "bg-gradient-to-br from-indigo-400 to-purple-500"
                  } flex items-center justify-center shadow-lg`}
                >
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1
                  className={`text-4xl md:text-5xl font-extrabold mb-2 ${
                    isDarkTheme
                      ? "bg-gradient-to-r from-white to-slate-300"
                      : "bg-gradient-to-r from-slate-900 to-slate-700"
                  } bg-clip-text text-transparent`}
                >
                  Dashboard
                </h1>
                <p
                  className={`text-lg ${
                    isDarkTheme ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Track, analyze, and optimize your financial journey
                </p>
              </div>
            </div>

            {/* Advanced Controls */}
            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <div
                className={`flex items-center ${
                  isDarkTheme ? "bg-slate-800/50" : "bg-white/70"
                } backdrop-blur-xl rounded-2xl border ${
                  isDarkTheme ? "border-slate-700" : "border-slate-200"
                } shadow-lg overflow-hidden`}
              >
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedPeriod(option.value)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      selectedPeriod === option.value
                        ? `${
                            isDarkTheme
                              ? "bg-indigo-600 text-white"
                              : "bg-indigo-500 text-white"
                          } shadow-md`
                        : `${
                            isDarkTheme
                              ? "text-slate-300 hover:text-white hover:bg-slate-700"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Balance Visibility Toggle */}
              <button
                onClick={() => setShowBalances(!showBalances)}
                className={`p-3 rounded-2xl ${
                  isDarkTheme
                    ? "bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white"
                    : "bg-white/70 border-slate-200 text-slate-600 hover:text-slate-900"
                } backdrop-blur-xl border shadow-lg transition-all duration-300 hover:scale-105`}
              >
                {showBalances ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <StatCard
              title="Total Balance"
              value={
                showBalances ? formatCurrency(dashboardData.balance) : "••••••"
              }
              change={dashboardData.savingsRate}
              icon={<WalletIcon className="w-8 h-8" />}
              color="primary"
              gradient={
                isDarkTheme
                  ? "from-indigo-500 to-purple-600"
                  : "from-indigo-400 to-purple-500"
              }
              subtitle={`Savings Rate: ${dashboardData.savingsRate.toFixed(
                1
              )}%`}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <StatCard
              title={`Income (${selectedPeriod})`}
              value={
                showBalances
                  ? formatCurrency(dashboardData.totalIncome)
                  : "••••••"
              }
              change={dashboardData.incomeChange}
              icon={<ArrowUpIcon className="w-8 h-8" />}
              color="success"
              gradient={
                isDarkTheme
                  ? "from-emerald-500 to-teal-600"
                  : "from-emerald-400 to-teal-500"
              }
              subtitle={`${dashboardData.transactionCount} transactions`}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <StatCard
              title={`Expenses (${selectedPeriod})`}
              value={
                showBalances
                  ? formatCurrency(dashboardData.totalExpenses)
                  : "••••••"
              }
              change={dashboardData.expenseChange}
              icon={<ArrowDownIcon className="w-8 h-8" />}
              color="danger"
              gradient={
                isDarkTheme
                  ? "from-rose-500 to-pink-600"
                  : "from-rose-400 to-pink-500"
              }
              subtitle={`Avg: ${formatCurrency(
                dashboardData.avgTransactionAmount
              )}`}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <StatCard
              title="Net Worth"
              value={
                showBalances
                  ? formatCurrency(
                      dashboardData.balance +
                        (dashboardData.totalIncome -
                          dashboardData.totalExpenses)
                    )
                  : "••••••"
              }
              change={
                ((dashboardData.totalIncome - dashboardData.totalExpenses) /
                  dashboardData.balance) *
                100
              }
              icon={<TrophyIcon className="w-8 h-8" />}
              color="warning"
              gradient={
                isDarkTheme
                  ? "from-amber-500 to-orange-600"
                  : "from-amber-400 to-orange-500"
              }
              subtitle="Growth this period"
            />
          </motion.div>
        </motion.div>

        {/* Enhanced Quick Actions */}
        <motion.div
          className={`${
            isDarkTheme ? "bg-slate-800/40" : "bg-white/60"
          } backdrop-blur-xl rounded-3xl border ${
            isDarkTheme ? "border-slate-700" : "border-slate-200"
          } shadow-2xl p-8 mb-12`}
          variants={itemVariants}
        >
          <div className="flex items-center mb-6">
            <div
              className={`w-12 h-12 ${
                isDarkTheme
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                  : "bg-gradient-to-r from-indigo-400 to-purple-500"
              } rounded-2xl flex items-center justify-center mr-4 shadow-lg`}
            >
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                className={`text-2xl font-bold ${
                  isDarkTheme ? "text-white" : "text-slate-900"
                }`}
              >
                Quick Actions
              </h2>
              <p
                className={`${
                  isDarkTheme ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Streamline your financial management
              </p>
            </div>
          </div>
          <QuickActions />
        </motion.div>

        {/* Advanced Insights Grid - Now 2 columns instead of 3 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          variants={containerVariants}
        >
          {/* Budget Status */}
          <motion.div
            className={`${
              isDarkTheme ? "bg-slate-800/40" : "bg-white/60"
            } backdrop-blur-xl rounded-3xl p-8 border ${
              isDarkTheme ? "border-slate-700" : "border-slate-200"
            } shadow-2xl`}
            variants={itemVariants}
          >
            <div className="flex items-center mb-6">
              <CreditCardIcon
                className={`w-6 h-6 ${
                  isDarkTheme ? "text-indigo-400" : "text-indigo-600"
                } mr-3`}
              />
              <h3
                className={`text-xl font-semibold ${
                  isDarkTheme ? "text-white" : "text-slate-900"
                }`}
              >
                Budget Overview
              </h3>
            </div>
            <div className="space-y-4">
              <AnimatePresence>
                {dashboardData.budgetAnalysis.length > 0 ? (
                  dashboardData.budgetAnalysis
                    .slice(0, 3)
                    .map((budget, index) => (
                      <motion.div
                        key={budget.category}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-2xl ${
                          budget.status === "over"
                            ? isDarkTheme
                              ? "bg-rose-900/30"
                              : "bg-rose-50"
                            : budget.status === "warning"
                            ? isDarkTheme
                              ? "bg-amber-900/30"
                              : "bg-amber-50"
                            : isDarkTheme
                            ? "bg-emerald-900/30"
                            : "bg-emerald-50"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`font-medium ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {budget.category}
                          </span>
                          <div className="flex items-center gap-2">
                            {budget.status === "over" && (
                              <ExclamationTriangleIcon className="w-4 h-4 text-rose-500" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                budget.status === "over"
                                  ? "text-rose-600 dark:text-rose-400"
                                  : budget.status === "warning"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {budget.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span
                            className={
                              isDarkTheme ? "text-slate-300" : "text-slate-600"
                            }
                          >
                            Spent: {formatCurrency(budget.spent)}
                          </span>
                          <span
                            className={
                              isDarkTheme ? "text-slate-300" : "text-slate-600"
                            }
                          >
                            Budget: {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <div
                          className={`w-full ${
                            isDarkTheme ? "bg-slate-700" : "bg-slate-200"
                          } rounded-full h-2`}
                        >
                          <motion.div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              budget.status === "over"
                                ? "bg-gradient-to-r from-rose-500 to-red-600"
                                : budget.status === "warning"
                                ? "bg-gradient-to-r from-amber-500 to-orange-600"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600"
                            }`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(budget.percentage, 100)}%`,
                            }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                      </motion.div>
                    ))
                ) : (
                  <div
                    className={`text-center py-8 ${
                      isDarkTheme ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <CreditCardIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No budgets set yet. Create your first budget!</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Top Categories */}
          <motion.div
            className={`${
              isDarkTheme ? "bg-slate-800/40" : "bg-white/60"
            } backdrop-blur-xl rounded-3xl p-8 border ${
              isDarkTheme ? "border-slate-700" : "border-slate-200"
            } shadow-2xl`}
            variants={itemVariants}
          >
            <div className="flex items-center mb-6">
              <ChartBarIcon
                className={`w-6 h-6 ${
                  isDarkTheme ? "text-purple-400" : "text-purple-600"
                } mr-3`}
              />
              <h3
                className={`text-xl font-semibold ${
                  isDarkTheme ? "text-white" : "text-slate-900"
                }`}
              >
                Top Spending Categories
              </h3>
            </div>
            <div className="space-y-4">
              {dashboardData.topCategories.length > 0 ? (
                dashboardData.topCategories.map(([category, amount], index) => (
                  <motion.div
                    key={category}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 ${
                      isDarkTheme ? "bg-purple-900/30" : "bg-purple-50"
                    } rounded-2xl`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full ${
                          isDarkTheme
                            ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                            : "bg-gradient-to-r from-purple-400 to-indigo-500"
                        } flex items-center justify-center mr-3`}
                      >
                        <span className="text-white text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <span
                        className={`font-medium ${
                          isDarkTheme ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {category}
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        isDarkTheme ? "text-purple-400" : "text-purple-600"
                      }`}
                    >
                      {formatCurrency(amount)}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div
                  className={`text-center py-8 ${
                    isDarkTheme ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <BanknotesIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No expenses in this period</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
