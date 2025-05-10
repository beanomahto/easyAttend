// routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// --- User Management Routes ---
// GET /api/users - Admin gets all users (or filters by role query param)
router.get("/", protect, restrictTo("admin"), userController.getAllUsers);
// TODO: Add routes for GET /:id, PUT /:id, DELETE /:id (Admin protected)

// --- Authentication Routes (Now using userController) ---

// Student Auth
router.post("/register/student", userController.registerStudent);
router.post("/login/student", userController.loginStudent);

// Professor Auth
router.post("/register/professor", userController.registerProfessor);
router.post("/login/professor", userController.loginProfessor);

router.get("/students", protect, userController.getAllStudentList);

module.exports = router;
