// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
// const { Server } = require('socket.io'); // If using Socket.IO
const connectDB = require("./config/db");

// --- Load Config & Connect DB ---
dotenv.config();
connectDB();

// --- Route Imports ---
// const authRoutes = require("./routes/authRoutes"); // REMOVE or KEEP if it has other routes (e.g., /me, admin auth)
const locationRoutes = require("./routes/locationRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const userRoutes = require("./routes/userRoutes"); // This now handles user management AND student/prof auth
// Add other routes like attendanceRoutes later

const app = express();
const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } }); // If using Socket.IO

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.get("/", (req, res) => res.send("Attendance API Running...")); // Health check route

// REMOVE or KEEP app.use for authRoutes depending on whether it still serves a purpose
// app.use("/api/auth", authRoutes);

// Mount other routes
app.use("/api/locations", locationRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/users", userRoutes); // Mount user routes (including the new auth endpoints)

// Mount other routes here...

// --- Socket.IO Setup (Example - requires implementation) ---
/*
io.on('connection', (socket) => {
  // ... (socket logic)
});
*/

// --- Error Handling Middleware (Place AFTER all routes) ---
// Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Resource not found at ${req.originalUrl}` });
});

// General Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.name, err.message);
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.name}`, err.message);
  // server.close(() => process.exit(1));
});
