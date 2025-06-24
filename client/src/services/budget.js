import api from "./api";

const budgetService = {
  getBudgets: async () => {
    try {
      return await api.get("/budgets");
    } catch (error) {
      console.error("Error fetching budgets:", error);
      throw error;
    }
  },

  createBudget: async (data) => {
    try {
      return await api.post("/budgets", data);
    } catch (error) {
      console.error("Error creating budget:", error);
      throw error;
    }
  },

  updateBudget: async (id, data) => {
    try {
      // Fixed: Added backticks for template literal
      return await api.put(`/budgets/${id}`, data);
    } catch (error) {
      console.error("Error updating budget:", error);
      throw error;
    }
  },

  deleteBudget: async (id) => {
    try {
      // Fixed: Added backticks for template literal
      return await api.delete(`/budgets/${id}`);
    } catch (error) {
      console.error("Error deleting budget:", error);
      throw error;
    }
  },

  // Added: Get budget analytics
  getBudgetAnalytics: async (id) => {
    try {
      return await api.get(`/budgets/${id}/analytics`);
    } catch (error) {
      console.error("Error fetching budget analytics:", error);
      throw error;
    }
  },

  // Added: Get budget spending for specific period
  getBudgetSpending: async (id, period) => {
    try {
      return await api.get(`/budgets/${id}/spending?period=${period}`);
    } catch (error) {
      console.error("Error fetching budget spending:", error);
      throw error;
    }
  },

  // Added: Check if budget alerts should be sent
  checkBudgetAlerts: async () => {
    try {
      return await api.get("/budgets/alerts");
    } catch (error) {
      console.error("Error checking budget alerts:", error);
      throw error;
    }
  },
};

export default budgetService;
