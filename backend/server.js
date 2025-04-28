// server.js
const express = require("express");
require("dotenv").config(); // Load environment variables early
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");

// Connect to Database
connectDB();

const app = express();

// --- Middleware ---
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies (optional, for form submissions)
// app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Mount Authentication Routes
app.use("/api/auth", authRoutes);

// Mount Protected Routes (ensure this comes AFTER any middleware it depends on)
app.use("/api/protected", protectedRoutes);

// --- Basic Error Handling (Optional but Recommended) ---
// Not Found Handler (if no route matches)
app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// General Error Handler (catches errors passed via next(error))
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    // Provide stack trace only in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000; // Use PORT from .env or default to 5000

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
