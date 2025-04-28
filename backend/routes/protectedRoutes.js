// routes/protectedRoutes.js
const express = require("express");
const protectedController = require("../controllers/protectedController");
const { protect /*, restrictTo*/ } = require("../middleware/authMiddleware"); // Import protect middleware

const router = express.Router();

router.get("/data", protect, protectedController.getSomeData);

module.exports = router;
