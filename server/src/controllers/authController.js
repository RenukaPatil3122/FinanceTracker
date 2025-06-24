const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Received registration data:", { name, email, password });

    // Validation
    if (!name || !email || !password) {
      console.log("Validation failed: Missing fields");
      return res
        .status(400)
        .json({ msg: "Please provide name, email, and password" });
    }

    if (password.length < 6) {
      console.log("Validation failed: Password too short");
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Validation failed: User exists");
      return res
        .status(400)
        .json({ msg: "User already exists with this email" });
    }

    // Create new user with plain password (hook will hash it)
    const user = new User({ name, email, password });
    await user.save();
    console.log("User saved successfully:", { name, email, id: user._id });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
      msg: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error details:", error.message, error.stack);
    res
      .status(500)
      .json({ msg: "Server error during registration", error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Received login data:", { email, password });

    if (!email || !password) {
      console.log("Validation failed: Missing credentials");
      return res.status(400).json({
        msg: "Please provide email and password",
        errorField: !email ? "email" : "password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("Validation failed: User not found");
      return res.status(400).json({
        msg: "Invalid credentials",
        errorField: "email", // Hint to focus on email
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Validation failed: Password mismatch");
      return res.status(400).json({
        msg: "Invalid credentials",
        errorField: "password", // Hint to focus on password
      });
    }

    console.log("User logged in:", { name: user.name, email, id: user._id });
    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
      msg: "Login successful",
    });
  } catch (error) {
    console.error("Login error details:", error.message, error.stack);
    res
      .status(500)
      .json({ msg: "Server error during login", error: error.message });
  }
};

module.exports = { register, login };
