const Student = require("../models/Student");

exports.createStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, branch, semester } = req.body;
    const student = new Student({ name, email, rollNumber, branch, semester });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: "Failed to create student" });
  }
};
