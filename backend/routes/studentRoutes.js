const express = require("express");
const { createStudent } = require("../controllers/studentController");
const router = express.Router();

router.post("/", createStudent);

module.exports = router;



// controllers/studentController.js
const Timetable = require("../models/Timetable");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Professor = require("../models/Professor");
const Location = require("../models/Location");

exports.getTodayClasses = async (req, res) => {
  try {
    const studentId = req.user.id; // assuming you use JWT and middleware to get user
    const student = await Student.findById(studentId);

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });

    const timetable = await Timetable.findOne({
      branch: student.branch,
      semester: student.semester,
    });

    if (!timetable || !timetable.weeklySchedule[dayOfWeek]) {
      return res.status(200).json([]);
    }

    // Populate each class entry
    const classPromises = timetable.weeklySchedule[dayOfWeek].map(
      async (entry) => {
        const subject = await Subject.findOne({ code: entry.subjectCode });
        const professor = await Professor.findById(entry.professorId);
        const location = await Location.findById(entry.locationId);

        return {
          startTime: entry.startTime,
          endTime: entry.endTime,
          subjectName: subject?.name || "Unknown Subject",
          professorName: professor?.name || "Unknown Professor",
          locationName: location?.name || "Unknown Location",
        };
      }
    );

    const classes = await Promise.all(classPromises);
    res.status(200).json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
