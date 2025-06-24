import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const register = async (userData) => {
  try {
    if (!userData.name || !userData.email || !userData.password) {
      throw new Error("Please fill in all required fields");
    }
    if (userData.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }
    const response = await api.post("/auth/register", {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
    });
    const { token, user } = response.data;
    if (!token || !user) {
      throw new Error("Invalid response from server");
    }
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout. Please try again.");
    }
    if (error.response) {
      throw new Error(
        error.response.data?.msg ||
          error.response.data?.message ||
          "Registration failed. Please check your input."
      );
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error(error.message || "Registration failed");
    }
  }
};

export const login = async (credentials) => {
  try {
    if (!credentials.email || !credentials.password) {
      throw new Error("Please provide both email and password");
    }
    const response = await api.post("/auth/login", {
      email: credentials.email.toLowerCase().trim(),
      password: credentials.password,
    });
    const { token, user } = response.data;
    if (!token || !user) {
      throw new Error("Invalid response from server");
    }
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout. Please try again.");
    }
    if (error.response) {
      throw new Error(
        error.response.data?.msg ||
          error.response.data?.message ||
          "Login failed. Please check your credentials."
      );
    } else if (error.request) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    } else {
      throw new Error(error.message || "Login failed");
    }
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    console.error("Get current user error:", error);
    throw new Error(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        "Failed to get user data"
    );
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error parsing token:", error);
    return true;
  }
};

export default api;
