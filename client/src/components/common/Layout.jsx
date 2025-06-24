import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { ArrowUpIcon, WifiIcon, CloudIcon } from "@heroicons/react/24/outline";

function Layout({ children }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const syncInterval = setInterval(() => {
      if (isOnline) {
        setLastSynced(new Date());
      }
    }, 30000);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      x: 20,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  // Calculate sidebar width based on state
  const sidebarWidth = isMobile ? 0 : sidebarCollapsed ? 80 : 280;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-500">
      <div className="fixed inset-0 opacity-30 dark:opacity-20">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-slate-900 dark:via-transparent dark:to-transparent"></div>
      </div>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <Sidebar
          onCollapseChange={setSidebarCollapsed}
          collapsed={sidebarCollapsed}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <motion.div
          className="flex-1 flex flex-col min-h-screen"
          style={{
            marginLeft: isMobile ? 0 : sidebarWidth,
            width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
          }}
          animate={{ marginLeft: isMobile ? 0 : sidebarWidth }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Navbar />

          <main className="flex-1 relative">
            {/* Status Bar */}
            <div className="sticky top-0 z-30 px-6 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? "bg-green-500" : "bg-red-500"
                      } animate-pulse`}
                    ></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>

                  {isOnline && (
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                      <CloudIcon className="w-3 h-3" />
                      <span>
                        Last synced: {lastSynced.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="hidden md:flex items-center space-x-4 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1">
                    <WifiIcon className="w-3 h-3" />
                    <span>Secure Connection</span>
                  </div>
                  <span>•</span>
                  <span>Version 2.1.0</span>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="relative">
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="min-h-screen p-6"
              >
                {children}
              </motion.div>

              {/* Floating Elements */}
              <AnimatePresence>
                {showScrollTop && (
                  <motion.button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 z-50 group"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <ArrowUpIcon className="w-6 h-6 group-hover:animate-bounce" />
                  </motion.button>
                )}

                {!isOnline && (
                  <motion.div
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-red-500 text-white rounded-full shadow-lg z-50"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        You're offline
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Background Decorations */}
              <div className="fixed top-1/4 -right-32 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
              <div className="fixed bottom-1/4 -left-32 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
            </div>
          </main>
        </motion.div>
      </div>
    </div>
  );
}

export default Layout;
