const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g., "CS301"
  name: { type: String, required: true }, // e.g., "Database Management Systems"
  branch: { type: String, required: true }, // e.g., "CSE"
  semester: { type: Number, required: true }, // e.g., 6
});

module.exports = mongoose.model("Subject", subjectSchema);
