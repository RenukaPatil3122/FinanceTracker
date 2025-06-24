import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext"; // Add this import
import { FinanceProvider } from "./context/FinanceContext";
import Layout from "./components/common/Layout";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Dashboard from "./components/dashboard/Dashboard";
import TransactionsList from "./components/transactions/TransactionsList";
import BudgetOverview from "./components/budget/BudgetOverview";
import GoalsList from "./components/goals/GoalsList";
import ExpenseChart from "./components/analytics/ExpenseChart";
import IncomeChart from "./components/analytics/IncomeChart";
import CategoryBreakdown from "./components/analytics/CategoryBreakdown";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {" "}
        {/* Add ThemeProvider here */}
        <FinanceProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TransactionsList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BudgetOverview />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GoalsList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/expenses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExpenseChart />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/income"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IncomeChart />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/categories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoryBreakdown />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </FinanceProvider>
      </ThemeProvider>{" "}
      {/* Close ThemeProvider here */}
    </AuthProvider>
  );
}

export default App;
