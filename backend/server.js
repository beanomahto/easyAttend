// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
// Remove socket.io for now unless implemented
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// --- Load Config & Connect DB ---
dotenv.config();
connectDB();

// --- Route Imports ---
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const professorRoutes = require("./routes/professorRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
// Add other routes like attendanceRoutes later

const app = express();
const server = http.createServer(app); // Create HTTP server

// --- Initialize Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: "*", // Restrict this in production (e.g., your frontend URL)
    methods: ["GET", "POST"],
  },
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Middleware to make io accessible in routes ---
// This attaches the `io` instance to the `req` object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- API Routes ---
// --- API Routes ---
app.get("/", (req, res) => res.send("Attendance API Running...")); // Health check route
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/dashboard", dashboardRoutes);
// Mount other routes here...

// --- Socket.IO Setup (Example - requires implementation) ---
// --- Socket.IO Connection Logic (Optional: Can be in a separate file) ---
io.on("connection", (socket) => {
  console.log("Socket.IO user connected:", socket.id);

  // Listen for clients joining specific session rooms
  socket.on("joinSessionRoom", (roomName) => {
    console.log(socket.id, "joining room", roomName);
    socket.join(roomName);
    // You could potentially emit current attendance state to the joining client here
  });

  socket.on("leaveSessionRoom", (roomName) => {
    console.log(socket.id, "leaving room", roomName);
    socket.leave(roomName);
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO user disconnected:", socket.id);
    // Optional: Handle cleanup if needed (e.g., remove from all rooms)
  });
});

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

//socket
// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.name}`, err.message);
  // server.close(() => process.exit(1));
});