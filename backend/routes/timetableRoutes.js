const express = require("express");
const { createTimetable } = require("../controllers/timetableController");
const router = express.Router();

router.post("/", createTimetable);

module.exports = router;
