const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const attendanceValidationSchema = new Schema({ // Store validation results
    method: { type: String, enum: ['Manual', 'Auto-Geo', 'Admin'], required: true },
    timestamp: { type: Date, required: true },
    geoPassed: { type: Boolean, default: false },
    wifiPassed: { type: Boolean, default: false },
    mockDetected: { type: Boolean, default: false },
    deviceIdMatch: { type: Boolean, default: false }, // Added
    deviceReportedId: { type: String }, // Added
    locationAccuracy: { type: Number },
    coordinates: { // Store actual coordinates used for check
         type: { type: String, enum: ['Point'], default: 'Point'},
         coordinates: { type: [Number] } // [longitude, latitude]
    },
    detectedBSSIDs: [{ type: String }]
}, { _id: false });

const attendanceRecordSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Denormalize key Timetable info for easier querying & if timetable changes later
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    professor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    // timetableRef: { type: Schema.Types.ObjectId, ref: 'Timetable' }, // Link back if needed
    timetableRef: { type: Schema.Types.ObjectId, ref: 'Timetable' , require: true }, // Link back if needed

    activeSessionRef: { type: Schema.Types.ObjectId, ref: 'ActiveClassSession'}, // Optional link

    classDate: { type: Date, required: true, index: true }, // Store Date only (midnight UTC)
    scheduledStartTime: { type: String, required: true }, // e.g., "09:00"
    scheduledEndTime: { type: String, required: true }, // e.g., "10:00"
    term: { type: String, required: true, index: true }, // e.g., "FALL 2024"


    checkIn: { type: attendanceValidationSchema },
    checkOut: { type: attendanceValidationSchema }, // Optional check-out

    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Excused', 'Pending'], // Add states as needed
        default: 'Pending', // Default until check-in confirmed
        index: true
    },
    // Optional fields
    markedAbsentBySystem: { type: Boolean, default: false }, // If system marks absent after window closes
    adminOverrideReason: { type: String } // If admin manually changes status

}, { timestamps: true }); // Adds createdAt, updatedAt

// Compound index for common student history queries
attendanceRecordSchema.index({ student: 1, term: 1, subject: 1, classDate: -1 });
// Index for finding records for a specific class session
attendanceRecordSchema.index({ classDate: 1, subject: 1, professor: 1, location: 1, scheduledStartTime: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);