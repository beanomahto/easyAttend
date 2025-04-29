const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  branch: { type: String, required: true }, // e.g., "CSE"
  semester: { type: Number, required: true }, // e.g., 6
  attendance: [
    {
      date: String, // "2025-04-29"
      subjectCode: String,
      status: { type: String, enum: ["Present", "Absent"] },
    },
  ],
});

module.exports = mongoose.model("Student", studentSchema);
