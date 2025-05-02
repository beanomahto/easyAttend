// routes/subjectRoutes.js
const express = require("express");
const subjectController = require("../controllers/subjectController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/subjects - Admin creates a subject
router.post("/", protect, restrictTo('admin'), subjectController.createSubject);

// GET /api/subjects - Anyone logged in can view subjects (adjust if needed)
router.get("/", protect, subjectController.getAllSubjects);

// TODO: Add routes for GET /:id, PUT /:id, DELETE /:id (likely admin protected)

module.exports = router;