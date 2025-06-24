// Fixed FinanceContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import transactionService from "../services/transactions";
import budgetService from "../services/budget";
import goalService from "../services/goals";
import api from "../services/api";

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, budgetRes, goalRes] = await Promise.all([
        transactionService.getTransactions(),
        budgetService.getBudgets(),
        goalService.getGoals(),
      ]);
      setTransactions(transRes.data || []); // Ensure arrays
      setBudgets(budgetRes.data || []);
      setGoals(goalRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Set empty arrays on error to prevent crashes
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTransaction = async (data) => {
    try {
      const res = await transactionService.createTransaction(data);
      setTransactions((prev) => [res.data, ...prev]);
      if (data.goalId) {
        await refreshGoals();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  };

  const updateTransaction = async (id, data) => {
    try {
      const res = await transactionService.updateTransaction(id, data);
      setTransactions((prev) => prev.map((t) => (t._id === id ? res.data : t)));
      if (data.goalId) {
        await refreshGoals();
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await transactionService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      await refreshGoals();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  const addBudget = async (data) => {
    try {
      const res = await budgetService.createBudget(data);
      setBudgets((prev) => [res.data, ...prev]);
    } catch (error) {
      console.error("Error adding budget:", error);
      throw error;
    }
  };

  const updateBudget = async (id, data) => {
    try {
      const res = await budgetService.updateBudget(id, data);
      setBudgets((prev) => prev.map((b) => (b._id === id ? res.data : b)));
    } catch (error) {
      console.error("Error updating budget:", error);
      throw error;
    }
  };

  const deleteBudget = async (id) => {
    try {
      await budgetService.deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw error;
    }
  };

  const addGoal = async (data) => {
    try {
      const res = await goalService.createGoal(data);
      setGoals((prev) => [res.data, ...prev]);
    } catch (error) {
      console.error("Error adding goal:", error);
      throw error;
    }
  };

  const updateGoal = async (id, data) => {
    try {
      const res = await goalService.updateGoal(id, data);
      setGoals((prev) => prev.map((g) => (g._id === id ? res.data : g)));
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  };

  const deleteGoal = async (id) => {
    try {
      await goalService.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  const refreshGoals = async () => {
    try {
      const goalRes = await goalService.getGoals();
      setGoals(goalRes.data || []);
    } catch (error) {
      console.error("Error refreshing goals:", error);
    }
  };

  const getSavingsRecommendations = async () => {
    try {
      const res = await api.get("/recommendations");
      return res.data || [];
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      return [];
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        goals,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        refreshData,
        getSavingsRecommendations,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}

export default FinanceContext;
