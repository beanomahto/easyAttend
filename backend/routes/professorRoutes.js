// routes/locationRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/locations - Admin creates a location
router.post(
  "/",
  protect,
  restrictTo("admin"),
  userController.registerProfessor
);

// GET /api/locations - Anyone logged in can view locations (adjust if needed)
router.get("/", protect, userController.getAllProfessorList);

// TODO: Add routes for GET /:id, PUT /:id, DELETE /:id (likely admin protected)

module.exports = router;
