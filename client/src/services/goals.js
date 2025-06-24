import api from "./api";

const goalService = {
  getGoals: async () => {
    return await api.get("/goals");
  },
  createGoal: async (data) => {
    return await api.post("/goals", data);
  },
  updateGoal: async (id, data) => {
    return await api.put(`/goals/${id}`, data);
  },
  deleteGoal: async (id) => {
    return await api.delete(`/goals/${id}`);
  },
};

export default goalService;
