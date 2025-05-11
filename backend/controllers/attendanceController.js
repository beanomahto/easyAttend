// controllers/attendanceController.js
const mongoose = require('mongoose');
const AttendanceRecord = require("../models/AttendanceRecord");
const User = require("../models/User");
const Location = require("../models/Location");
const Timetable = require("../models/Timetable");

// --- Configuration ---
const CHECKIN_WINDOW_MINUTES = 10; // Allow check-in 10 mins after start
const CHECKOUT_WINDOW_MINUTES = 5; // Allow check-out 5 mins after end
const LOCATION_CHECK_RADIUS_METERS_BUFFER = 10; // Optional extra buffer for GPS inaccuracy

// --- Helper Functions ---

// Basic HH:mm time comparison
function isTimeWithinWindow(currentTimeStr, startTimeStr, endTimeStr) {
    if (!currentTimeStr || !startTimeStr || !endTimeStr) return false;
    // Simple string comparison works for HH:mm format within the same day
    return currentTimeStr >= startTimeStr && currentTimeStr <= endTimeStr;
}

// Function to add minutes to HH:mm time (simplified)
function addMinutesToTime(timeStr, minutes) {
    if (!timeStr) return null;
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0); // Use Date object for easy addition
    const newHours = String(date.getHours()).padStart(2, '0');
    const newMins = String(date.getMinutes()).padStart(2, '0');
    return `${newHours}:${newMins}`;
}

// Placeholder for actual distance check (replace with Haversine or library)
// Returns true if point [lng, lat] is within radius of center [lng, lat]
function isWithinRadius(pointCoords, centerCoords, radiusMeters) {
    if (!pointCoords || !centerCoords || !radiusMeters || pointCoords.length !== 2 || centerCoords.length !== 2) {
        console.warn("isWithinRadius: Invalid input parameters.");
        return false;
    }
    // **VERY basic placeholder - Euclidean distance on degrees (NOT accurate globally!)**
    // **REPLACE THIS WITH A PROPER HAVERSINE IMPLEMENTATION**
    const R = 6371e3; // Earth radius in meters
    const lat1 = pointCoords[1] * Math.PI / 180; // φ, λ in radians
    const lat2 = centerCoords[1] * Math.PI / 180;
    const deltaLat = (centerCoords[1] - pointCoords[1]) * Math.PI / 180;
    const deltaLon = (centerCoords[0] - pointCoords[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // in metres

    console.log(`[GeoCheck] Distance: ${distance.toFixed(2)}m, Required Radius (with buffer): ${radiusMeters}m, Classroom Radius: ${radiusMeters - LOCATION_CHECK_RADIUS_METERS_BUFFER}m`);
    return distance <= radiusMeters;
}

// --- Populate Helper ---
const populateRecordFields = [
    { path: 'subject', select: 'subjectCode name _id' }, // Make sure _id is selected
    { path: 'professor', select: 'firstName lastName email _id' }, // Make sure _id is selected
    { path: 'location', select: 'name building _id' } // Make sure _id is selected
];

const populateRecordFieldsForSocket = [
    { path: 'student', select: 'firstName lastName studentId _id' }, // Ensure studentId (college ID) is selected
    { path: 'subject', select: 'subjectCode name _id' },
    { path: 'professor', select: 'firstName lastName email _id' },
    { path: 'location', select: 'name building _id' }
];


// --- Controller Methods ---

/**
 * @desc    Student manually checks in for a class
 * @route   POST /api/attendance/check-in
 * @access  Private (Student)
 */
exports.manualCheckIn = async (req, res) => {
    const studentId = req.user._id;
    const io = req.io;
    const {
        subjectId, professorId, locationId, classDateStr,
        scheduledStartTime, scheduledEndTime, term,
        currentTimeStr, latitude, longitude, accuracy,
        detectedBSSIDs = [], isMockDetected, deviceId
    } = req.body;

    // --- Basic Input Validation ---
    if (!subjectId || !professorId || !locationId || !classDateStr || !scheduledStartTime || !scheduledEndTime || !term || !currentTimeStr || latitude == null || longitude == null || isMockDetected == null || !deviceId) {
        return res.status(400).json({ message: "Missing required fields for check-in." });
    }
    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(professorId) || !mongoose.Types.ObjectId.isValid(locationId)) {
        return res.status(400).json({ message: "Invalid ID format provided." });
    }

    try {
        // --- Time Window Check ---
        const checkinEndTime = addMinutesToTime(scheduledStartTime, CHECKIN_WINDOW_MINUTES);
        if (!checkinEndTime || !isTimeWithinWindow(currentTimeStr, scheduledStartTime, checkinEndTime)) {
            return res.status(400).json({ message: `Check-in window: ${scheduledStartTime} - ${checkinEndTime}. Current: ${currentTimeStr}. Check-in closed/not open.` });
        }

        const user = await User.findById(studentId).select('+boundDeviceId').lean();
        if (!user) return res.status(404).json({ message: "Student not found." });

        const classLocation = await Location.findById(locationId).lean(); // Renamed
        if (!classLocation || !classLocation.location || !classLocation.location.coordinates) {
            return res.status(404).json({ message: "Classroom location details not found." });
        }

        // --- Perform Validations ---
        const deviceIdMatch = !!user.boundDeviceId && user.boundDeviceId === deviceId;
        const geoPassed = isWithinRadius([longitude, latitude], classLocation.location.coordinates, classLocation.radiusMeters + LOCATION_CHECK_RADIUS_METERS_BUFFER);
        const wifiPassed = classLocation.trustedWifiBSSIDs && classLocation.trustedWifiBSSIDs.length > 0
            ? classLocation.trustedWifiBSSIDs.some(trustedBssid => detectedBSSIDs.includes(trustedBssid))
            : true;

        const checkInData = {
            method: 'Manual', timestamp: new Date(), geoPassed, wifiPassed,
            mockDetected: !!isMockDetected, deviceIdMatch, deviceReportedId: deviceId,
            locationAccuracy: accuracy,
            coordinates: { type: 'Point', coordinates: [longitude, latitude] },
            detectedBSSIDs: Array.isArray(detectedBSSIDs) ? detectedBSSIDs : []
        };

        // --- Apply Validation Rules ---
        if (checkInData.mockDetected) return res.status(403).json({ message: "Check-in failed: Mock location detected.", validation: checkInData });
        if (!checkInData.deviceIdMatch) {
            return res.status(403).json({ message: user.boundDeviceId ? "Check-in failed: Device ID mismatch." : "Check-in failed: Device not bound to this account.", validation: checkInData });
        }
        if (!checkInData.geoPassed) return res.status(403).json({ message: "Check-in failed: Outside designated classroom area.", validation: checkInData });
        if (!checkInData.wifiPassed && classLocation.trustedWifiBSSIDs?.length > 0) return res.status(403).json({ message: "Check-in failed: Classroom Wi-Fi environment mismatch.", validation: checkInData });

        const classDateObject = new Date(classDateStr);
        classDateObject.setUTCHours(0, 0, 0, 0);

        const formattedDateForRoom = classDateObject.toISOString().split('T')[0];
        const room = `session-${professorId}-${subjectId}-${formattedDateForRoom}-${scheduledStartTime}`;

        let recordToRespond; // Define here to be accessible in all paths
        let httpStatus = 200; // Default to 200 for update
        let actionTypeForSocket = 'UPDATE'; // Default to update

        const existingRecord = await AttendanceRecord.findOne({
            student: studentId, subject: subjectId, classDate: classDateObject, scheduledStartTime: scheduledStartTime, term: term
        });

        if (existingRecord) {
            if (existingRecord.checkIn && (existingRecord.status === 'Pending' || existingRecord.status === 'Present')) {
                recordToRespond = await AttendanceRecord.findById(existingRecord._id).populate(populateRecordFields);
                return res.status(200).json({ message: `Already ${existingRecord.status.toLowerCase()} for this class.`, record: recordToRespond });
            }
            console.log(`Existing record found (status: ${existingRecord.status}), updating check-in and setting to Pending.`);
            existingRecord.checkIn = checkInData;
            existingRecord.status = 'Pending';
            existingRecord.checkOut = undefined;
            await existingRecord.save();
            recordToRespond = existingRecord;
        } else {
            console.log("No existing record, creating new one with status Pending.");
            const newRecord = new AttendanceRecord({
                student: studentId, subject: subjectId, professor: professorId, location: locationId,
                classDate: classDateObject, scheduledStartTime, scheduledEndTime, term,
                checkIn: checkInData, status: 'Pending',
            });
            await newRecord.save();
            recordToRespond = newRecord;
            httpStatus = 201; // Set to 201 for created
            actionTypeForSocket = 'CREATE';
        }

        // *** POPULATE the recordToRespond using its own _id before sending it back ***
        const populatedRecord = await AttendanceRecord.findById(recordToRespond._id).populate(populateRecordFields);

        if (!populatedRecord) { // Should not happen if save was successful
            console.error("Error: Record was saved/updated but could not be found for population immediately after.");
            return res.status(500).json({ message: "Internal server error after processing check-in." });
        }

        if (io) {
            io.to(room).emit('attendanceUpdate', {
                type: actionTypeForSocket, // 'CREATE' or 'UPDATE'
                recordId: populatedRecord._id.toString(), // Send recordId
                student: { // Send student info matching SessionStudentItem.student
                    id: populatedRecord.student.toString(), // User ObjectId
                    firstName: populatedRecord.professor?.firstName, // This should be student's name if populated student directly
                    lastName: populatedRecord.professor?.lastName,  // This should be student's name
                    studentId: "STUDENT_COLLEGE_ID" // You'll need to fetch the student's college ID to send here
                },
                status: populatedRecord.status,
                checkInTimestamp: populatedRecord.checkIn?.timestamp, // Already there
                checkOutTimestamp: populatedRecord.checkOut?.timestamp, // Will be null on check-in
                // subjectName: populatedRecord.subject?.name, // Optional, client might already have this
                // professorName: `${populatedRecord.professor?.firstName} ${populatedRecord.professor?.lastName}`, // Optional
            });
        }

        res.status(httpStatus).json({
            message: `Check-in successful. Status: ${populatedRecord.status}.`,
            record: populatedRecord
        });

    } catch (error) {
        console.error("Manual Check-In Error:", error);
        res.status(500).json({ message: "Server error during check-in.", error: error.message });
    }
};


/**
 * @desc    Student manually checks out from a class
 * @route   POST /api/attendance/check-out
 * @access  Private (Student)
 */
exports.manualCheckOut = async (req, res) => {
    const studentId = req.user._id;
    const io = req.io;
    const {
        attendanceRecordId,
        currentTimeStr, latitude, longitude, accuracy,
        detectedBSSIDs = [], isMockDetected, deviceId
    } = req.body;

    if (!attendanceRecordId || !mongoose.Types.ObjectId.isValid(attendanceRecordId)) {
        return res.status(400).json({ message: "Valid attendanceRecordId is required for check-out." });
    }
    if (!currentTimeStr || latitude == null || longitude == null || isMockDetected == null || !deviceId) {
        return res.status(400).json({ message: "Missing required fields for check-out validation." });
    }

    try {
        const recordToUpdate = await AttendanceRecord.findOne({ _id: attendanceRecordId, student: studentId });

        if (!recordToUpdate) {
            return res.status(404).json({ message: "Attendance record not found or does not belong to you." });
        }
        if (recordToUpdate.status !== 'Pending') {
            const populatedRecordOnError = await AttendanceRecord.findById(recordToUpdate._id).populate(populateRecordFields);
            return res.status(400).json({ message: `Cannot check out. Current status is: ${recordToUpdate.status}.`, record: populatedRecordOnError });
        }
        if (recordToUpdate.checkOut) {
            const populatedRecordOnError = await AttendanceRecord.findById(recordToUpdate._id).populate(populateRecordFields);
            return res.status(200).json({ message: "Already checked out for this class.", record: populatedRecordOnError });
        }

        // --- Time Window Check ---
        const checkoutStartTime = recordToUpdate.scheduledEndTime;
        const checkoutEndTime = addMinutesToTime(recordToUpdate.scheduledEndTime, CHECKOUT_WINDOW_MINUTES);
        if (!checkoutEndTime || !isTimeWithinWindow(currentTimeStr, checkoutStartTime, checkoutEndTime)) {
            return res.status(400).json({ message: `Check-out window: ${checkoutStartTime} - ${checkoutEndTime}. Current: ${currentTimeStr}. Check-out closed.` });
        }

        const user = await User.findById(studentId).select('+boundDeviceId').lean();
        if (!user) return res.status(404).json({ message: "Student not found (internal error)." });

        const classLocation = await Location.findById(recordToUpdate.location).lean(); // Get location from record
        if (!classLocation || !classLocation.location || !classLocation.location.coordinates) {
            return res.status(404).json({ message: "Classroom location details not found for validation." });
        }

        // --- Perform Validations ---
        const deviceIdMatch = !!user.boundDeviceId && user.boundDeviceId === deviceId;
        const geoPassed = isWithinRadius([longitude, latitude], classLocation.location.coordinates, classLocation.radiusMeters + LOCATION_CHECK_RADIUS_METERS_BUFFER);
        const wifiPassed = classLocation.trustedWifiBSSIDs && classLocation.trustedWifiBSSIDs.length > 0
            ? classLocation.trustedWifiBSSIDs.some(trustedBssid => detectedBSSIDs.includes(trustedBssid))
            : true;

        const checkOutData = {
            method: 'Manual', timestamp: new Date(), geoPassed, wifiPassed,
            mockDetected: !!isMockDetected, deviceIdMatch, deviceReportedId: deviceId,
            locationAccuracy: accuracy,
            coordinates: { type: 'Point', coordinates: [longitude, latitude] },
            detectedBSSIDs: Array.isArray(detectedBSSIDs) ? detectedBSSIDs : []
        };

        // --- Apply Validation Rules ---
        if (checkOutData.mockDetected) return res.status(403).json({ message: "Check-out failed: Mock location detected.", validation: checkOutData });
        if (!checkOutData.deviceIdMatch) return res.status(403).json({ message: "Check-out failed: Device ID mismatch.", validation: checkOutData });
        if (!checkOutData.geoPassed) return res.status(403).json({ message: "Check-out failed: Must be inside designated area.", validation: checkOutData });
        if (!checkOutData.wifiPassed && classLocation.trustedWifiBSSIDs?.length > 0) return res.status(403).json({ message: "Check-out failed: Wi-Fi mismatch.", validation: checkOutData });

        // --- Update Record ---
        recordToUpdate.checkOut = checkOutData;
        if (recordToUpdate.checkIn) { // Should be true if status was 'Pending'
            recordToUpdate.status = 'Present';
        } else {
            console.warn(`Check-out performed for record ${recordToUpdate._id} without a prior check-in. Status remains ${recordToUpdate.status}.`);
        }
        await recordToUpdate.save();

        // *** POPULATE before sending response ***
        const populatedRecord = await AttendanceRecord.findById(recordToUpdate._id).populate(populateRecordFields);

        if (!populatedRecord) {
            console.error("Error: Record was saved for checkout but could not be found for population.");
            return res.status(500).json({ message: "Internal server error after processing check-out." });
        }

        const formattedDateForRoom = populatedRecord.classDate.toISOString().split('T')[0];
        const room = `session-${populatedRecord.professor._id}-${populatedRecord.subject._id}-${formattedDateForRoom}-${populatedRecord.scheduledStartTime}`;

        // Inside manualCheckOut, after populating 'populatedRecord'
        if (io) {
            io.to(room).emit('attendanceUpdate', {
                type: 'UPDATE',
                recordId: populatedRecord._id.toString(),
                student: {
                    id: populatedRecord.student.toString(),
                    firstName: populatedRecord.professor?.firstName, // Adjust to send actual student's name
                    lastName: populatedRecord.professor?.lastName,   // Adjust to send actual student's name
                    studentId: "STUDENT_COLLEGE_ID" // Fetch student's college ID
                },
                status: populatedRecord.status,
                checkInTimestamp: populatedRecord.checkIn?.timestamp,
                checkOutTimestamp: populatedRecord.checkOut?.timestamp, // Now available
            });
        }

        res.status(200).json({
            message: `Check-out successful. Attendance marked as ${populatedRecord.status}.`,
            record: populatedRecord
        });

    } catch (error) {
        console.error("Manual Check-Out Error:", error);
        res.status(500).json({ message: "Server error during check-out.", error: error.message });
    }
};

exports.updateAttendanceStatus = async (req, res) => {
    const { recordId } = req.params;
    const { newStatus, reason } = req.body;
    const io = req.io; // Get io instance
    // ... (Validation logic) ...

    try {
        const record = await AttendanceRecord.findById(recordId);
        if (!record) { /* ... */ }

        // ... (Authorization check) ...

        // --- Update Record ---
        record.status = newStatus;
        // ... (update reason) ...
        await record.save();

        // --- Define Room Name ---
        const classDateObjectForRoom = record.classDate;
        const formattedDate = classDateObjectForRoom.toISOString().split('T')[0];
        const room = `session-${record.professor}-${record.subject}-${formattedDate}-${record.scheduledStartTime}`;

        // --- Socket.IO Emission ---
        // Inside updateAttendanceStatus, after populating 'populatedRecord'
        if (io && oldStatus !== newStatus) {
            // ... (room definition)
            io.to(room).emit('attendanceUpdate', { // Use consistent event name 'attendanceUpdate'
                type: 'STATUS_CHANGE', // Or more specific like 'PROFESSOR_OVERRIDE'
                recordId: populatedRecord._id.toString(),
                student: {
                    id: populatedRecord.student.toString(),
                    firstName: populatedRecord.professor?.firstName, // Student's first name
                    lastName: populatedRecord.professor?.lastName,   // Student's last name
                    studentId: "STUDENT_COLLEGE_ID" // Student's college ID
                },
                status: populatedRecord.status,
                checkInTimestamp: populatedRecord.checkIn?.timestamp,
                checkOutTimestamp: populatedRecord.checkOut?.timestamp,
                updatedBy: userRole,
            });
        }



        res.status(200).json({ message: `Attendance status updated to ${newStatus}.`, record });

    } catch (error) {
        console.error("Update Attendance Status Error:", error);
        res.status(500).json({ message: "Server error updating attendance status." });
    }
};


// --- Get student's current session status (NEW Endpoint) ---
exports.getStudentCurrentSessionStatus = async (req, res) => {
    const studentId = req.user._id;
    const { subjectId, classDateStr, scheduledStartTime, term } = req.query;

    if (!subjectId || !classDateStr || !scheduledStartTime || !term) {
        return res.status(400).json({ message: "Missing required query parameters (subjectId, classDateStr, scheduledStartTime, term)." });
    }
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: "Invalid subjectId format." });
    }

    try {
        const classDateObject = new Date(classDateStr); // Expects YYYY-MM-DD from client
        classDateObject.setUTCHours(0, 0, 0, 0);

        const record = await AttendanceRecord.findOne({
            student: studentId,
            subject: subjectId,
            classDate: classDateObject,
            scheduledStartTime: scheduledStartTime,
            term: term
        })
            .populate(populateRecordFields) // Use the helper
            .sort({ createdAt: -1 }); // Get the most recent if somehow multiple exist

        if (!record) {
            // No record found, means not checked-in yet for this specific session
            return res.status(200).json(null);
        }
        res.status(200).json(record); // Send the found record (or null)
    } catch (error) {
        console.error("Get Current Session Status Error:", error);
        res.status(500).json({ message: "Server error fetching current session status.", error: error.message });
    }
};



/**
 * @desc    Get attendance history for the logged-in student
 * @route   GET /api/attendance/student/history
 * @access  Private (Student)
 */
exports.getStudentAttendanceHistory = async (req, res) => {
    const studentId = req.user._id;
    const { subjectId, term, fromDate, toDate, page = 1, limit = 10 } = req.query; // Default limit to 10

    const filter = { student: studentId };
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) filter.subject = subjectId;
    if (term) filter.term = term;
    if (fromDate || toDate) {
        filter.classDate = {};
        if (fromDate) filter.classDate.$gte = new Date(fromDate);
        if (toDate) filter.classDate.$lte = new Date(toDate);
    }

    try {
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const records = await AttendanceRecord.find(filter)
            .sort({ classDate: -1, scheduledStartTime: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10))
            .populate(populateRecordFields) // Use the helper for consistency
            .select('-checkIn.detectedBSSIDs -checkIn.deviceReportedId -checkOut.detectedBSSIDs -checkOut.deviceReportedId') // Be more specific
            .lean();

        const totalRecords = await AttendanceRecord.countDocuments(filter);

        res.status(200).json({
            docs: records, totalDocs: totalRecords, limit: parseInt(limit, 10),
            page: parseInt(page, 10), totalPages: Math.ceil(totalRecords / parseInt(limit, 10)),
        });
    } catch (error) {
        console.error("Get Student History Error:", error);
        res.status(500).json({ message: "Server error fetching attendance history.", error: error.message });
    }
};

/**
 * @desc    Get subject-wise attendance summary (percentages) for logged-in student
 * @route   GET /api/attendance/student/summary
 * @access  Private (Student)
 */
exports.getStudentAttendanceSummary = async (req, res) => {
    const studentId = req.user._id;
    const { term } = req.query; // Term is crucial for calculating percentages

    if (!term) {
        return res.status(400).json({ message: "Term query parameter is required for summary." });
    }

    try {
        const aggregationPipeline = [
            // 1. Match records for the student and term
            {
                $match: {
                    student: studentId,
                    term: term,
                    status: { $in: ['Present', 'Late', 'Absent'] } // Include relevant statuses
                }
            },
            // 2. Group by subject to count statuses
            {
                $group: {
                    _id: "$subject", // Group by subject ObjectId
                    presentCount: {
                        $sum: { $cond: [{ $in: ["$status", ['Present', 'Late']] }, 1, 0] } // Count 'Present' or 'Late' as attended
                    },
                    totalClassesMarked: { $sum: 1 } // Count total records found for this subject
                }
            },
            // 3. Lookup subject details
            {
                $lookup: {
                    from: "subjects", // The actual name of your subjects collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "subjectInfo"
                }
            },
            // 4. Unwind the subjectInfo array (should only be one element)
            {
                $unwind: "$subjectInfo"
            },
            // 5. TODO: Lookup total scheduled classes for this subject in this term from Timetable
            // This part is complex as it requires querying Timetable based on student's branch/sem/section
            // For a hackathon, maybe simplify and use `totalClassesMarked` as the denominator?
            // Or assume a fixed number of classes per subject if timetables aren't fully queryable yet.
            // Let's use totalClassesMarked for now as a proxy total.
            // 6. Project the final output shape
            {
                $project: {
                    _id: 0, // Exclude default _id
                    subjectId: "$_id",
                    subjectCode: "$subjectInfo.subjectCode",
                    subjectName: "$subjectInfo.name",
                    presentCount: 1,
                    totalClasses: "$totalClassesMarked", // Using marked count as total FOR NOW
                    attendancePercentage: {
                        $cond: [ // Avoid division by zero
                            { $eq: ["$totalClassesMarked", 0] },
                            0, // Percentage is 0 if no classes marked
                            { $round: [{ $multiply: [{ $divide: ["$presentCount", "$totalClassesMarked"] }, 100] }, 0] } // Calculate percentage rounded
                        ]
                    }
                }
            },
            // 7. Sort by subject name
            { $sort: { subjectName: 1 } }
        ];

        const summary = await AttendanceRecord.aggregate(aggregationPipeline);

        res.status(200).json(summary);

    } catch (error) {
        console.error("Get Student Summary Error:", error);
        res.status(500).json({ message: "Server error fetching attendance summary." });
    }
};


/**
 * @desc    Get attendance for a specific class session (for professor view)
 * @route   GET /api/attendance/professor/session
 * @access  Private (Professor)
 */
exports.getProfessorSessionAttendance = async (req, res) => {
    const professorId = req.user._id;
    const { subjectId, locationId, classDateStr, scheduledStartTime, term } = req.query;

    // --- Validation ---
    if (!subjectId || !locationId || !classDateStr || !scheduledStartTime || !term) {
        return res.status(400).json({ message: "Missing required query parameters: subjectId, locationId, classDateStr, scheduledStartTime, term." });
    }
    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(locationId)) {
        return res.status(400).json({ message: "Invalid ID format provided." });
    }

    try {
        const classDateObject = new Date(classDateStr);
        classDateObject.setUTCHours(0, 0, 0, 0);


        // 1. Find the specific timetable entry to get branch, semester, section
        //    We need to find which class this session corresponds to in the timetables.
        //    This query assumes a professor teaches a specific subject at a specific time/location
        //    in only one branch/sem/section combo for a given term.
        const dayOfWeek = classDateObject.toLocaleDateString("en-US", { weekday: "long" });

        const timetableEntry = await Timetable.findOne({
            term: term.toUpperCase(), // Ensure consistent casing
            isActive: true,
            [`weeklySchedule.${dayOfWeek}`]: {
                $elemMatch: {
                    subject: subjectId,
                    professor: professorId,
                    location: locationId,
                    startTime: scheduledStartTime
                }
            }
        }).select('branch semester section').lean();

        if (!timetableEntry) {
            console.warn(`No timetable entry found for prof ${professorId}, subj ${subjectId}, loc ${locationId}, time ${scheduledStartTime}, day ${dayOfWeek}, term ${term}`);
            return res.status(404).json({ message: "Class session details not found in timetable. Cannot determine student enrollment." });
        }

        const { branch, semester, section } = timetableEntry;

        // 2. Get all students enrolled in that class (branch, semester, section)
        const enrolledStudents = await User.find({
            role: 'student',
            branch: branch, // Use branch from timetable
            currentSemester: semester, // Use semester from timetable
            section: section, // Use section from timetable
            isActive: true
        }).select('firstName lastName studentId _id').lean(); // studentId here is the User's _id

        if (!enrolledStudents || enrolledStudents.length === 0) {
            return res.status(200).json([]); // No students enrolled in this class
        }

        // 3. Get existing attendance records for this specific session for these students
        const studentIds = enrolledStudents.map(s => s._id);
        const attendanceRecords = await AttendanceRecord.find({
            student: { $in: studentIds },
            subject: subjectId,
            // professor: professorId, // Not strictly needed if filtering by student list from prof's class
            // location: locationId,   // Not strictly needed
            classDate: classDateObject,
            scheduledStartTime: scheduledStartTime,
            term: term.toUpperCase()
        })
            // Populate only the necessary fields from subdocuments for the response
            .select('student status checkIn.timestamp checkOut.timestamp adminOverrideReason')
            .lean();

        // 4. Map records for easier lookup
        const attendanceMap = new Map();
        attendanceRecords.forEach(record => {
            attendanceMap.set(record.student.toString(), record);
        });

        // 5. Combine enrolled students with their attendance data
        const sessionStudentList = enrolledStudents.map(student => {
            const record = attendanceMap.get(student._id.toString());
            return {
                recordId: record ? record._id.toString() : null,
                student: { // Matches StudentInfoForSession on Android
                    id: student._id.toString(),
                    firstName: student.firstName,
                    lastName: student.lastName,
                    studentId: student.studentId // This is the college ID (e.g., "S101")
                },
                status: record ? record.status : 'Absent', // Default to Absent if no record
                checkInTimestamp: record && record.checkIn ? record.checkIn.timestamp : null,
                checkOutTimestamp: record && record.checkOut ? record.checkOut.timestamp : null,
                adminOverrideReason: record ? record.adminOverrideReason : null
            };
        });


        // Sort by student name (optional, can also be done on client)
        sessionStudentList.sort((a, b) => {
            const nameA = `${a.student.lastName} ${a.student.firstName}`.toLowerCase();
            const nameB = `${b.student.lastName} ${b.student.firstName}`.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        res.status(200).json(sessionStudentList);




        // const filter = {
        //     professor: professorId, // Ensure it's the correct professor
        //     subject: subjectId,
        //     location: locationId,
        //     classDate: classDateObject,
        //     scheduledStartTime: scheduledStartTime,
        //     term: term
        // };

        // const sessionAttendance = await AttendanceRecord.find(filter)
        //     .populate({ path: 'student', select: 'firstName lastName studentId' }) // Get student details
        //     .select('student status checkIn.timestamp checkOut.timestamp createdAt') // Select relevant fields
        //     .sort({ 'student.lastName': 1, 'student.firstName': 1 }) // Sort by student name
        //     .lean();

        // // TODO: Augment this list with students who are *expected* but have NO record yet (Absent)
        // // This requires knowing the enrollment list for the class (e.g., query User based on branch/sem/section matching the timetable entry)

        // res.status(200).json(sessionAttendance);

    } catch (error) {
        console.error("Get Professor Session Attendance Error:", error);
        res.status(500).json({ message: "Server error fetching session attendance." });
    }
};


/**
 * @desc    Update attendance status (Admin/Professor override)
 * @route   PUT /api/attendance/:recordId/status
 * @access  Private (Admin, Professor)
 */
exports.updateAttendanceStatus = async (req, res) => {
    const { recordId } = req.params;
    const { newStatus, reason } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
    const io = req.io;

    if (!mongoose.Types.ObjectId.isValid(recordId)) { /* ... */ }
    const allowedStatuses = ['Present', 'Absent', 'Late', 'Excused'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) { /* ... */ }

    try {
        const record = await AttendanceRecord.findById(recordId);
        if (!record) return res.status(404).json({ message: "Attendance record not found." });

        if (userRole !== 'admin' && !record.professor.equals(userId)) {
            return res.status(403).json({ message: "You are not authorized to modify this record." });
        }

        const oldStatus = record.status;
        record.status = newStatus;
        record.adminOverrideReason = reason ? `Changed by ${userRole} (${req.user.email}) on ${new Date().toISOString()}: ${reason}` : `Status changed to ${newStatus} by ${userRole} (${req.user.email}) on ${new Date().toISOString()}.`;
        await record.save();

        const populatedRecord = await AttendanceRecord.findById(record._id).populate(populateRecordFields);

        if (io && oldStatus !== newStatus) { // Only emit if status actually changed
            const classDateObjectForRoom = populatedRecord.classDate;
            const formattedDate = classDateObjectForRoom.toISOString().split('T')[0];
            const room = `session-${populatedRecord.professor._id}-${populatedRecord.subject._id}-${formattedDate}-${populatedRecord.scheduledStartTime}`;
            io.to(room).emit('attendanceUpdate', {
                type: 'STATUS_CHANGE', studentId: populatedRecord.student, status: populatedRecord.status,
                recordId: populatedRecord._id, updatedBy: userRole,
                subjectName: populatedRecord.subject?.name,
                professorName: `${populatedRecord.professor?.firstName} ${populatedRecord.professor?.lastName}`,
            });
        }
        res.status(200).json({ message: `Attendance status updated to ${newStatus}.`, record: populatedRecord });
    } catch (error) {
        console.error("Update Attendance Status Error:", error);
        res.status(500).json({ message: "Server error updating attendance status.", error: error.message });
    }
};


/**
 * @desc    Get overall attendance analytics (Admin view)
 * @route   GET /api/attendance/admin/analytics
 * @access  Private (Admin)
 */
exports.getAdminAnalytics = async (req, res) => {
    // TODO: Implement complex aggregation pipelines based on desired analytics
    // Examples:
    // - Overall attendance % by term
    // - Attendance % by branch/semester
    // - Attendance % by subject
    // - Attendance % by professor
    // - List of students below a certain threshold

    try {
        // Example: Count total present vs total records in a term
        const { term } = req.query;
        if (!term) return res.status(400).json({ message: "Term is required for analytics." });

        const pipeline = [
            { $match: { term: term, status: { $in: ['Present', 'Late', 'Absent'] } } },
            {
                $group: {
                    _id: null, // Group all together
                    presentCount: { $sum: { $cond: [{ $in: ["$status", ['Present', 'Late']] }, 1, 0] } },
                    totalRecords: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    term: term,
                    presentCount: 1,
                    totalRecords: 1,
                    overallPercentage: {
                        $cond: [
                            { $eq: ["$totalRecords", 0] },
                            0,
                            { $round: [{ $multiply: [{ $divide: ["$presentCount", "$totalRecords"] }, 100] }, 1] } // Percentage with 1 decimal place
                        ]
                    }
                }
            }
        ];
        const analytics = await AttendanceRecord.aggregate(pipeline);

        res.status(200).json(analytics.length > 0 ? analytics[0] : { term: term, presentCount: 0, totalRecords: 0, overallPercentage: 0 });

    } catch (error) {
        console.error("Get Admin Analytics Error:", error);
        res.status(500).json({ message: "Server error fetching admin analytics." });
    }
};