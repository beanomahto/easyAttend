// routes/locationRoutes.js
const express = require("express");
const locationController = require("../controllers/locationController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/locations - Admin creates a location
router.post("/", protect, restrictTo('admin'), locationController.createLocation);

// GET /api/locations - Anyone logged in can view locations (adjust if needed)
router.get("/", protect, locationController.getAllLocations);

// TODO: Add routes for GET /:id, PUT /:id, DELETE /:id (likely admin protected)

module.exports = router;