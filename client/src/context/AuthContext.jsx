import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { isTokenExpired, getCurrentUser } from "../services/api"; // Changed from auth.js to api.js

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        if (isTokenExpired(storedToken)) {
          console.log("Token expired, clearing auth data");
          clearAuth();
          return;
        }
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
              localStorage.setItem("user", JSON.stringify(currentUser));
            }
          } catch (verifyError) {
            console.log(
              "Token verification failed, but keeping stored user data"
            );
          }
        } catch (parseError) {
          console.error("Error parsing stored user data:", parseError);
          clearAuth();
        }
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setError("Failed to initialize authentication");
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const login = useCallback(
    (userData, userToken) => {
      try {
        if (!userData || !userToken) {
          throw new Error("Invalid user data or token");
        }
        setUser(userData);
        setToken(userToken);
        setError(null);
        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("User logged in successfully:", userData.name);
      } catch (error) {
        console.error("Login error:", error);
        setError("Login failed");
        clearAuth();
      }
    },
    [clearAuth]
  );

  const logout = useCallback(() => {
    console.log("User logged out");
    clearAuth();
    window.location.href = "/login";
  }, [clearAuth]);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const isAuthenticated = Boolean(user && token && !isTokenExpired(token));

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      console.log("Token expired, logging out");
      logout();
    }
  }, [token, logout]);

  useEffect(() => {
    const interval = setInterval(() => {
      const storedToken = localStorage.getItem("token");
      if (storedToken && isTokenExpired(storedToken)) {
        console.log("Token expired during periodic check");
        logout();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    updateUser,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
