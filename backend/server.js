// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
// Remove socket.io for now unless implemented
// const { Server } = require('socket.io');
const connectDB = require('./config/db');

// --- Load Config & Connect DB ---
dotenv.config();
connectDB();

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const userRoutes = require('./routes/userRoutes');
// Add other routes like attendanceRoutes later

const app = express();
const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } }); // If using Socket.IO

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// --- API Routes ---
app.get('/', (req, res) => res.send('Attendance API Running...')); // Health check route
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/users', userRoutes);
// Mount other routes here...

// --- Socket.IO Setup (Example - requires implementation) ---
/*
io.on('connection', (socket) => {
  console.log('Socket.IO user connected:', socket.id);

  // Example: Join room based on class session ID
  socket.on('joinSessionRoom', (sessionId) => {
      console.log(socket.id, "joining room", sessionId);
      socket.join(sessionId);
  });

  // Example: Handling attendance updates (to be emitted from backend logic)
  // Emitted like: io.to(sessionId).emit('attendanceUpdate', { studentId, status });

  socket.on('disconnect', () => {
    console.log('Socket.IO user disconnected:', socket.id);
  });
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
    console.error(err.stack); // Log stack trace for debugging
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error',
        // Only show stack in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});


// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));

// Handle unhandled promise rejections (optional but good practice)
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.name}`, err.message);
  // Close server & exit process gracefully (optional)
  // server.close(() => process.exit(1));
});