const mongoose = require("mongoose");

const classSlotSchema = new mongoose.Schema({
  startTime: String, // "10:00"
  endTime: String, // "11:00"
  subjectCode: String, // Refers to Subject.code
  professorId: String, // Refers to Professor._id
  locationId: String, // Refers to Location._id
});

const timetableSchema = new mongoose.Schema({
  branch: { type: String, required: true }, // e.g., "CSE"
  semester: { type: Number, required: true }, // e.g., 6
  weeklySchedule: {
    Monday: [classSlotSchema],
    Tuesday: [classSlotSchema],
    Wednesday: [classSlotSchema],
    Thursday: [classSlotSchema],
    Friday: [classSlotSchema],
    Saturday: [classSlotSchema],
  },
});

module.exports = mongoose.model("Timetable", timetableSchema);
