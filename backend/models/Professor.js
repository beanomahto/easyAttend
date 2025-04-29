const mongoose = require("mongoose");

const professorSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Prof. Sharma"
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true }, // e.g., "CSE"
  subjects: [{ type: String }], // Array of subject codes
});

module.exports = mongoose.model("Professor", professorSchema);
