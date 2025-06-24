import api from "./api";

const transactionService = {
  getTransactions: async () => {
    return await api.get("/transactions");
  },
  createTransaction: async (data) => {
    return await api.post("/transactions", data);
  },
  updateTransaction: async (id, data) => {
    return await api.put(`/transactions/${id}`, data); // Fixed: Added backticks for template literal
  },
  deleteTransaction: async (id) => {
    return await api.delete(`/transactions/${id}`); // Fixed: Added backticks for template literal
  },
};

export default transactionService;
