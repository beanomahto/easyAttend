const express = require("express");
const attendanceController = require("../controllers/attendanceController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/attendance/check-in - Student manual check-in
router.post("/check-in", protect, restrictTo('student'), attendanceController.manualCheckIn);

// POST /api/attendance/check-out - Student manual check-out
router.post("/check-out", protect, restrictTo('student'), attendanceController.manualCheckOut);

// --- GET /api/attendance/student/current-session-status - Student gets their current session status ---
router.get(
    "/student/current-session-status",
    protect,
    restrictTo('student'),
    attendanceController.getStudentCurrentSessionStatus
);

// GET /api/attendance/student/history - Student gets their history (filtered by query params)
router.get("/student/history", protect, restrictTo('student'), attendanceController.getStudentAttendanceHistory);

// GET /api/attendance/student/summary - Student gets subject-wise percentages
router.get("/student/summary", protect, restrictTo('student'), attendanceController.getStudentAttendanceSummary);

 // GET /api/attendance/professor/session - Professor gets attendance for a live/past session
 router.get("/professor/session", protect, restrictTo('professor'), attendanceController.getProfessorSessionAttendance);

 // GET /api/attendance/admin/analytics - Admin analytics endpoint
 router.get("/admin/analytics", protect, restrictTo('admin'), attendanceController.getAdminAnalytics);

// PUT /api/attendance/:recordId/status - Admin/Professor override status
router.put("/:recordId/status", protect, restrictTo('admin', 'professor'), attendanceController.updateAttendanceStatus);
router.put(
    "/session/update-location",
    protect,
    restrictTo('professor'),
    attendanceController.updateSessionLocation
);

module.exports = router;