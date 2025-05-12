// models/ActiveClassSession.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const activeClassSessionSchema = new Schema({
    // Link to the scheduled class details
    timetableId: { type: Schema.Types.ObjectId, ref: 'Timetable', required: true },
    dayOfWeek: { type: String, required: true }, // e.g., "Monday"
    scheduledStartTime: { type: String, required: true }, // e.g., "09:00" from timetable

    professor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    classDate: { type: Date, required: true, index: true }, // Actual date of the class
    term: { type: String, required: true },

    // Dynamic Geofence Details
    geofenceCenter: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: { // [longitude, latitude]
            type: [Number],
            required: true
        }
    },
    radiusMeters: { type: Number, required: true, default: 30 },
    sessionStartTime: { type: Date, default: Date.now, required: true },
    sessionEndTime: { type: Date }, // Set when professor ends session
    expectedEndTime: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    professorReportedBSSIDs: [{ type: String }],
}, { timestamps: true });

activeClassSessionSchema.index({ geofenceCenter: '2dsphere' });
activeClassSessionSchema.index({ professor: 1, classDate: 1, isActive: 1 });
activeClassSessionSchema.index({ professor: 1, subject: 1, classDate: 1, scheduledStartTime: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } }); // Prevent multiple active sessions for same class by same prof

module.exports = mongoose.model('ActiveClassSession', activeClassSessionSchema);