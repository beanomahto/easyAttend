// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Single registration endpoint, controller determines type based on 'role' field
router.post('/register', authController.register);

// Single login endpoint
router.post('/login', authController.login);

// Optional: Route to get current logged-in user details
// router.get('/me', protect, (req, res) => { res.status(200).json(req.user); });

module.exports = router;