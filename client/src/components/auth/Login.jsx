import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom"; // Corrected Link import
import { motion, useSpring, useTransform } from "framer-motion"; // Only motion-related imports
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react";
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
      [name]: value.trim(), // Trim input to avoid whitespace issues
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 backdrop-blur-3xl"></div>

      <motion.div
        className="max-w-md w-full space-y-8 relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to continue to your dashboard
          </p>
        </motion.div>

        <motion.div
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {errors.general && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
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
                style={{ x: errors.email ? translateX : 0 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-gray-50 ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-indigo-500"
                    }`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    ref={emailInputRef}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p
                    className="mt-1 text-sm text-red-600"
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-gray-50 ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-indigo-500"
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    className="mt-1 text-sm text-red-600"
                    id="password-error"
                    role="alert"
                  >
                    {errors.password}
                  </p>
                )}
              </motion.div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className={`text-sm transition-colors ${
                  errors.password
                    ? "text-red-600 hover:text-red-500 font-medium"
                    : "text-indigo-600 hover:text-indigo-500"
                }`}
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
                disabled={isLoading || !!errors.email || !!errors.password}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Signing you in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Create one now
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
