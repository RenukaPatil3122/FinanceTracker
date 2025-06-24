import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

function Navbar() {
  const { user, logout } = useAuth();
  const { isDarkTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <motion.nav
      className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-4 lg:px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left Section - Dashboard title */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="min-w-0">
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                Dashboard Overview
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5 whitespace-nowrap">
                Welcome back, manage your finances
              </p>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {user && (
              <>
                {/* Theme Toggle */}
                <motion.button
                  onClick={toggleTheme}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`Switch to ${isDarkTheme ? "light" : "dark"} mode`}
                >
                  <AnimatePresence mode="wait">
                    {isDarkTheme ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SunIcon className="w-5 h-5 text-yellow-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MoonIcon className="w-5 h-5 text-slate-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* User Avatar */}
                <div className="flex items-center space-x-2 lg:space-x-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email || "user@example.com"}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all duration-200 flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="hidden sm:block font-medium">Logout</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
