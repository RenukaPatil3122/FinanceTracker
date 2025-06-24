import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  TrendingUp,
  Shield,
  Zap,
  Check,
} from "lucide-react";
import { register } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

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

    // Calculate password strength
    if (name === "password") {
      let strength = 0;
      if (value.length >= 6) strength++;
      if (value.match(/[a-z]/) && value.match(/[A-Z]/)) strength++;
      if (value.match(/\d/)) strength++;
      if (value.match(/[^a-zA-Z\d]/)) strength++;
      setPasswordStrength(strength);
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: "Weak", color: "text-red-300" };
      case 2:
        return { text: "Fair", color: "text-yellow-300" };
      case 3:
        return { text: "Good", color: "text-blue-300" };
      case 4:
        return { text: "Strong", color: "text-green-300" };
      default:
        return { text: "", color: "" };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // Client-side validation
    let newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };
    if (!formData.name) {
      newErrors.name = "Name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (Object.values(newErrors).some((error) => error)) {
      setErrors(newErrors);
      shake.set(1);
      setTimeout(() => shake.set(0), 300);
      if (newErrors.name) {
        nameInputRef.current?.focus();
      } else if (newErrors.email) {
        emailInputRef.current?.focus();
      } else if (newErrors.password) {
        passwordInputRef.current?.focus();
      } else if (newErrors.confirmPassword) {
        confirmPasswordInputRef.current?.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      login(response.user, response.token);
      toast.success("Account created successfully! 🎉");
      navigate("/dashboard");
    } catch (error) {
      let errorMessage =
        error.response?.data?.msg || "Registration failed. Please try again.";
      let newErrors = {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        general: "",
      };

      if (error.response?.data?.msg === "User already exists with this email") {
        newErrors.email = "This email is already registered";
        newErrors.general = "Email already in use. Try logging in instead.";
      } else if (
        error.response?.data?.msg ===
        "Password must be at least 6 characters long"
      ) {
        newErrors.password = error.response.data.msg;
      } else if (error.response?.data?.msg) {
        newErrors.general = error.response.data.msg;
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

  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

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
                    Start your financial journey today
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl font-bold leading-tight">
                  Join thousands who trust{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    our platform
                  </span>
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Create your account and start tracking expenses, analyzing
                  spending patterns, and achieving your financial goals with our
                  powerful analytics platform.
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

          {/* Right Side - Register Form */}
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
                    Create Account
                  </h2>
                  <p className="text-slate-300">
                    Join us and start your financial journey
                  </p>
                </motion.div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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

                  <div className="space-y-4">
                    <motion.div
                      style={{ x: errors.name ? translateX : 0 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-slate-200 mb-2"
                      >
                        Full Name
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          className={`w-full pl-12 pr-4 py-4 border rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-white/10 ${
                            errors.name
                              ? "border-red-500/50 focus:ring-red-500/50"
                              : "border-white/20 focus:ring-blue-500/50"
                          }`}
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                          ref={nameInputRef}
                          aria-describedby={
                            errors.name ? "name-error" : undefined
                          }
                          disabled={isLoading}
                        />
                      </div>
                      {errors.name && (
                        <p
                          className="mt-2 text-sm text-red-300"
                          id="name-error"
                          role="alert"
                        >
                          {errors.name}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      style={{ x: errors.email ? translateX : 0 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
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
                      transition={{ delay: 0.6, duration: 0.5 }}
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
                          placeholder="Create a password"
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
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-2 w-6 rounded-full transition-colors ${
                                    level <= passwordStrength
                                      ? level <= 1
                                        ? "bg-red-500"
                                        : level <= 2
                                        ? "bg-yellow-500"
                                        : level <= 3
                                        ? "bg-blue-500"
                                        : "bg-green-500"
                                      : "bg-slate-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                getPasswordStrengthText().color
                              }`}
                            >
                              {getPasswordStrengthText().text}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            Use 6+ characters with uppercase, lowercase, number
                            & symbol
                          </p>
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      style={{ x: errors.confirmPassword ? translateX : 0 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-slate-200 mb-2"
                      >
                        Confirm Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          className={`w-full pl-12 pr-14 py-4 border rounded-2xl bg-white/5 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-white/10 ${
                            formData.confirmPassword
                              ? passwordsMatch
                                ? "border-green-500/50 focus:ring-green-500/50"
                                : "border-red-500/50 focus:ring-red-500/50"
                              : errors.confirmPassword
                              ? "border-red-500/50 focus:ring-red-500/50"
                              : "border-white/20 focus:ring-blue-500/50"
                          }`}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          ref={confirmPasswordInputRef}
                          aria-describedby={
                            errors.confirmPassword
                              ? "confirm-password-error"
                              : undefined
                          }
                          disabled={isLoading}
                        />
                        <motion.button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </motion.button>
                        {passwordsMatch && (
                          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                            <Check className="h-5 w-5 text-green-400" />
                          </div>
                        )}
                      </div>
                      {errors.confirmPassword && (
                        <p
                          className="mt-2 text-sm text-red-300"
                          id="confirm-password-error"
                          role="alert"
                        >
                          {errors.confirmPassword}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={
                        isLoading ||
                        !passwordsMatch ||
                        Object.values(errors).some((e) => e)
                      }
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform"
                      whileHover={{ scale: isLoading ? 1 : 1.02, y: -2 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          Creating your account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </motion.button>
                  </motion.div>
                </form>

                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <p className="text-slate-300">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Sign in here
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

export default Register;
