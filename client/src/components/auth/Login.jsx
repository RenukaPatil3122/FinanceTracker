import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, TrendingUp, Shield, Zap } from "lucide-react";
import { login } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Shake animation for invalid fields
  const shake = useSpring(0, { stiffness: 1000, damping: 50 });
  const translateX = useTransform(shake, [0, 1], [0, 10]);

  // Real-time email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value.trim(),
    });

    // Clear field-specific errors on change
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));

    // Validate email in real-time
    if (name === "email" && value.trim() && !validateEmail(value.trim())) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // Client-side validation
    let newErrors = { email: "", password: "", general: "" };
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      shake.set(1);
      setTimeout(() => shake.set(0), 300);
      if (newErrors.email) {
        emailInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(formData);
      authLogin(response.user, response.token);
      toast.success("Welcome back! 🎉");
      navigate("/dashboard");
    } catch (error) {
      let errorMessage =
        error.response?.data?.msg || "Login failed. Please try again.";
      let newErrors = { email: "", password: "", general: "" };

      if (error.response?.data?.msg === "Invalid credentials") {
        newErrors.general = "Incorrect email or password";
        if (error.response.data.errorField === "email") {
          newErrors.email = "Email not found";
        } else if (error.response.data.errorField === "password") {
          newErrors.password = "Incorrect password";
          newErrors.general += ". Try resetting your password.";
        }
      } else if (error.response?.data?.msg) {
        newErrors.general = error.response.data.msg;
        if (error.response.data.errorField === "email") {
          newErrors.email = error.response.data.msg;
        } else if (error.response.data.errorField === "password") {
          newErrors.password = error.response.data.msg;
        }
      } else if (error.code === "ECONNABORTED") {
        newErrors.general = "Request timed out. Please try again.";
      } else if (!error.response) {
        newErrors.general = "Network error. Please check your connection.";
      }

      setErrors(newErrors);
      toast.error(errorMessage);
      shake.set(1);
      setTimeout(() => shake.set(0), 300);
      if (newErrors.email) {
        emailInputRef.current?.focus();
      } else if (newErrors.password) {
        passwordInputRef.current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      <div className="w-full max-w-6xl mx-auto flex items-center justify-center relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Side - Branding */}
          <motion.div
            className="hidden lg:block text-white space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Finance Tracker Pro
                  </h1>
                  <p className="text-slate-400">
                    Your financial journey starts here
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl font-bold leading-tight">
                  Welcome back to your{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    financial dashboard
                  </span>
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Track expenses, analyze spending patterns, and achieve your
                  financial goals with our powerful analytics platform.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    icon: Shield,
                    title: "Secure & Encrypted",
                    desc: "Bank-level security for your data",
                  },
                  {
                    icon: TrendingUp,
                    title: "Smart Analytics",
                    desc: "AI-powered insights and recommendations",
                  },
                  {
                    icon: Zap,
                    title: "Real-time Sync",
                    desc: "Instant updates across all devices",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            className="w-full max-w-md mx-auto"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Glassmorphism Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-white/5" />

              <div className="relative z-10">
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-slate-300">
                    Continue to your financial dashboard
                  </p>
                </motion.div>

                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                  {errors.general && (
                    <motion.div
                      className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-2xl text-sm backdrop-blur-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      role="alert"
                    >
                      {errors.general}
                    </motion.div>
                  )}

                  <div className="space-y-5">
                    <motion.div
                      style={{ x: errors.email ? translateX : 0 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-slate-200 mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className={`w-full pl-12 pr-4 py-4 border rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-white/10 ${
                            errors.email
                              ? "border-red-500/50 focus:ring-red-500/50"
                              : "border-white/20 focus:ring-blue-500/50"
                          }`}
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          ref={emailInputRef}
                          aria-describedby={
                            errors.email ? "email-error" : undefined
                          }
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && (
                        <p
                          className="mt-2 text-sm text-red-300"
                          id="email-error"
                          role="alert"
                        >
                          {errors.email}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      style={{ x: errors.password ? translateX : 0 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-200 mb-2"
                      >
                        Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          className={`w-full pl-12 pr-14 py-4 border rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-white/10 ${
                            errors.password
                              ? "border-red-500/50 focus:ring-red-500/50"
                              : "border-white/20 focus:ring-blue-500/50"
                          }`}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          ref={passwordInputRef}
                          aria-describedby={
                            errors.password ? "password-error" : undefined
                          }
                          disabled={isLoading}
                        />
                        <motion.button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </motion.button>
                      </div>
                      {errors.password && (
                        <p
                          className="mt-2 text-sm text-red-300"
                          id="password-error"
                          role="alert"
                        >
                          {errors.password}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-white/20 rounded bg-white/5"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-slate-300"
                      >
                        Remember me
                      </label>
                    </div>

                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={
                        isLoading || !!errors.email || !!errors.password
                      }
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform"
                      whileHover={{ scale: isLoading ? 1 : 1.02, y: -2 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          Signing you in...
                        </div>
                      ) : (
                        "Sign In to Dashboard"
                      )}
                    </motion.button>
                  </motion.div>
                </form>

                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <p className="text-slate-300">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Create one now
                    </Link>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white\\/\\[0\\.02\\] {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3e%3cpath d='m0 .5h32m0 0v32m-32-32v32'/%3e%3c/svg%3e");
        }
      `}</style>
    </div>
  );
}

export default Login;
