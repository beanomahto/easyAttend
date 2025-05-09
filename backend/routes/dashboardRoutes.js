// routes/dashboardRoutes.js
const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/dashboard/stats - Admin gets dashboard statistics
router.get(
  "/stats",
  protect,
  restrictTo("admin"),
  dashboardController.getDashboardStats
);

module.exports = router;