// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

// --- Utility function to generate JWT ---
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload: typically user ID, maybe role
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// --- Registration Controller ---
exports.register = async (req, res) => {
  const { name, email, password, registrationNumber, branch, role } = req.body;

  // Basic validation
  if (!name || !email || !password || !registrationNumber || !branch || !role) {
    return res.status(400).json({
      message:
        "Please provide name, email, and password and registrationNumber and  and role",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create new user (password hashing handled by pre-save hook in model)
    const newUser = new User({
      name,
      email,
      password,
      registrationNumber,
      branch,
      role,
    });
    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id);

    // Respond with token and user info (excluding password)
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        registrationNumber: newUser.registrationNumber,
        branch: newUser.branch,
        role: newUser.role, // Include role if needed
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    // Handle potential validation errors from Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    res.status(500).json({ message: "Server error during registration" });
  }
};

// --- Login Controller ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    // Find user by email - crucially, select the password field which is normally excluded
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and if password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Respond with token and user info (excluding password)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registrationNumber: user.registrationNumber,
        branch: user.branch,
        role: user.role, // Include role if needed
        // Add other non-sensitive fields if needed
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
