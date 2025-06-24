import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  CreditCardIcon,
  ChartPieIcon,
  FlagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

function Sidebar({ onCollapseChange, collapsed, isMobile }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(collapsed || false);
  const [expandedGroups, setExpandedGroups] = useState(new Set(["analytics"]));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const navItems = [
    {
      path: "/",
      icon: HomeIcon,
      label: "Dashboard",
      color: "from-blue-500 to-indigo-600",
    },
    {
      path: "/transactions",
      icon: CreditCardIcon,
      label: "Transactions",
      color: "from-emerald-500 to-teal-600",
    },
    {
      path: "/budget",
      icon: ChartPieIcon,
      label: "Budget",
      color: "from-purple-500 to-pink-600",
    },
    {
      path: "/goals",
      icon: FlagIcon,
      label: "Goals",
      color: "from-orange-500 to-red-600",
    },
  ];

  const analyticsItems = [
    {
      path: "/analytics/expenses",
      icon: ChartPieIcon,
      label: "Expense Analytics",
      color: "from-rose-500 to-pink-600",
    },
    {
      path: "/analytics/income",
      icon: ChartPieIcon,
      label: "Income Analytics",
      color: "from-emerald-500 to-green-600",
    },
    {
      path: "/analytics/categories",
      icon: ChartPieIcon,
      label: "Category Breakdown",
      color: "from-violet-500 to-purple-600",
    },
  ];

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const NavItem = ({ item, isActive, isSubItem = false }) => (
    <Link
      to={item.path}
      onClick={() => isMobile && setMobileOpen(false)}
      className="group relative block"
    >
      <motion.div
        className={`flex items-center p-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
          isSubItem ? "ml-6" : ""
        } ${
          isActive
            ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-400/25"
            : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-white"
        }`}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        {isActive && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        <div
          className={`p-2 rounded-xl ${
            isActive
              ? `bg-gradient-to-r ${item.color}`
              : "bg-slate-100 dark:bg-slate-700"
          } transition-all duration-300 flex items-center justify-center flex-shrink-0`}
        >
          <item.icon
            className={`w-5 h-5 ${
              isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
            }`}
          />
        </div>

        <AnimatePresence>
          {(!isCollapsed || isMobile) && (
            <motion.span
              className="ml-4 font-medium text-sm whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {isActive && (
          <motion.div
            className="absolute right-2 w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          />
        )}
      </motion.div>
    </Link>
  );

  const AnalyticsGroup = () => {
    const isExpanded = expandedGroups.has("analytics");
    const hasActiveAnalytics = analyticsItems.some(
      (item) => location.pathname === item.path
    );

    return (
      <div className="space-y-1">
        <motion.button
          onClick={() => toggleGroup("analytics")}
          className={`w-full flex items-center p-3 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
            hasActiveAnalytics
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-400/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-white"
          }`}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {hasActiveAnalytics && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 opacity-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          <div
            className={`p-2 rounded-xl ${
              hasActiveAnalytics
                ? "bg-gradient-to-r from-violet-500 to-purple-600"
                : "bg-slate-100 dark:bg-slate-700"
            } transition-all duration-300 flex items-center justify-center flex-shrink-0`}
          >
            <ChartPieIcon
              className={`w-5 h-5 ${
                hasActiveAnalytics
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            />
          </div>

          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                className="ml-4 font-medium text-sm whitespace-nowrap flex-1 text-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                Analytics
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                className="ml-2 flex-shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {hasActiveAnalytics && (
            <motion.div
              className="absolute right-2 w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            />
          )}
        </motion.button>

        <AnimatePresence>
          {isExpanded && (!isCollapsed || isMobile) && (
            <motion.div
              className="space-y-1 ml-4 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {analyticsItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  isSubItem={true}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0"
                >
                  <h2 className="font-bold text-lg text-slate-800 dark:text-white truncate">
                    Finance
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1 truncate">
                    Tracker Pro
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isMobile && (
            <motion.button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <Bars3Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </motion.div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
          />
        ))}

        <div className="pt-4">
          <AnalyticsGroup />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <motion.div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
              <QuestionMarkCircleIcon className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <h4 className="font-semibold text-sm">Need Help?</h4>
                  <p className="text-xs opacity-90 mb-3">
                    Get support from our team
                  </p>
                  <motion.button
                    className="w-full bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                    <span>Contact Support</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <motion.button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bars3Icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </motion.button>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-900 z-50 shadow-2xl"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <div className="absolute top-4 right-4 z-10">
                  <motion.button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-500" />
                  </motion.button>
                </div>
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside
      className="fixed top-0 left-0 h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 shadow-2xl shadow-indigo-500/5 dark:shadow-indigo-400/5 z-20"
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <SidebarContent />
    </motion.aside>
  );
}

export default Sidebar;
