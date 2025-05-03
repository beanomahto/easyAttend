// routes/timetableRoutes.js
const express = require("express");
const timetableController = require("../controllers/timetableController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// PUT /api/timetables - Admin creates or updates a timetable (Upsert)
router.put("/", protect, restrictTo('admin'), timetableController.upsertTimetable);

// GET /api/timetables/student/today - Logged-in student gets their schedule
router.get("/student/today", timetableController.getStudentTodaySchedule);

// GET /api/timetables/professor/today - Logged-in professor gets their schedule
router.get("/professor/today", protect, timetableController.getProfessorTodaySchedule);

// TODO: Add routes for GET / (all), GET /:id, DELETE /:id (Admin only)

module.exports = router;