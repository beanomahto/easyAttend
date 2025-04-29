// routes/student.js
const express = require('express');
const { getTodayClasses } = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth'); // ensures req.user is available

const router = express.Router();

router.get('/classes/today', authMiddleware, getTodayClasses);

module.exports = router;
