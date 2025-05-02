// models/Timetable.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Defines one class slot in the schedule
const timeSlotSchema = new Schema({
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true }, // REF Subject
    professor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // REF User (Professor)
    location: { type: Schema.Types.ObjectId, ref: 'Location', required: true }, // REF Location
}, { _id: false });

// Defines schedule for each day
const weeklyScheduleSchema = new Schema({
    Monday: [timeSlotSchema],
    Tuesday: [timeSlotSchema], // Corrected typo
    Wednesday: [timeSlotSchema],
    Thursday: [timeSlotSchema], // Corrected typo
    Friday: [timeSlotSchema],
    Saturday: [timeSlotSchema],
    Sunday: [timeSlotSchema],
}, { _id: false });

// Main Timetable Schema
const timetableSchema = new Schema({
    branch: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    section: { type: String, required: true, trim: true, uppercase: true, default: 'A' },
    term: { type: String, required: true, trim: true }, // CRUCIAL: e.g., "FALL 2024"
    weeklySchedule: { type: weeklyScheduleSchema, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Index for efficient querying
timetableSchema.index({ branch: 1, semester: 1, section: 1, term: 1, isActive: 1 });
timetableSchema.index({ term: 1, isActive: 1 }); // For finding all active in a term

module.exports = mongoose.model('Timetable', timetableSchema);