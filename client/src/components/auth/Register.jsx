import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Check } from "lucide-react";
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
        return { text: "Weak", color: "text-red-500" };
      case 2:
        return { text: "Fair", color: "text-yellow-500" };
      case 3:
        return { text: "Good", color: "text-blue-500" };
      case 4:
        return { text: "Strong", color: "text-green-500" };
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 backdrop-blur-3xl"></div>

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
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="mt-2 text-gray-600">
            Join us and start your journey today
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
                style={{ x: errors.name ? translateX : 0 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-gray-50 ${
                      errors.name
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-purple-500"
                    }`}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    ref={nameInputRef}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p
                    className="mt-1 text-sm text-red-600"
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-gray-50 ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-purple-500"
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
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-gray-50 ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-purple-500"
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
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-2 w-6 rounded-full ${
                              level <= passwordStrength
                                ? level <= 1
                                  ? "bg-red-500"
                                  : level <= 2
                                  ? "bg-yellow-500"
                                  : level <= 3
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                                : "bg-gray-200"
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
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be 6+ characters, include uppercase,
                      lowercase, number, and special character.
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
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 hover:bg-gray-50 ${
                      formData.confirmPassword
                        ? passwordsMatch
                          ? "border-green-200 focus:ring-green-500"
                          : "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-purple-500"
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.confirmPassword && (
                  <p
                    className="mt-1 text-sm text-red-600"
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
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className={`font-medium transition-colors ${
                  errors.email
                    ? "text-red-600 hover:text-red-500"
                    : "text-purple-600 hover:text-purple-500"
                }`}
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Register;
