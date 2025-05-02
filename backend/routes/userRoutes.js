// routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/users - Admin gets all users (or filters by role query param)
router.get("/", protect, restrictTo('admin'), userController.getAllUsers);

// TODO: Add routes for GET /:id, PUT /:id, DELETE /:id (Admin protected)

module.exports = router;