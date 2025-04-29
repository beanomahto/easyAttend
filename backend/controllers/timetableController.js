const Timetable = require("../models/Timetable");

exports.createTimetable = async (req, res) => {
  try {
    const { branch, semester, weeklySchedule } = req.body;
    const timetable = new Timetable({ branch, semester, weeklySchedule });
    await timetable.save();
    res.status(201).json(timetable);
  } catch (err) {
    res.status(500).json({ error: "Failed to create timetable" });
  }
};
