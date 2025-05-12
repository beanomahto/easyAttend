// controllers/attendanceController.js
const mongoose = require('mongoose');
const AttendanceRecord = require("../models/AttendanceRecord");
const User = require("../models/User");
const Location = require("../models/Location");

const Timetable = require("../models/Timetable");
const ActiveClassSession = require('../models/ActiveClassSession');

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



function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

function isWithinRadius(pointCoords, centerCoords, radiusMeters) {
    if (!pointCoords || pointCoords.length !== 2 || !centerCoords || centerCoords.length !== 2 || !radiusMeters) {
        console.warn("isWithinRadius: Invalid input parameters.");
        return false;
    }
    // pointCoords = [longitude, latitude], centerCoords = [longitude, latitude]
    const distance = getDistanceFromLatLonInMeters(pointCoords[1], pointCoords[0], centerCoords[1], centerCoords[0]);
    const effectiveRadius = radiusMeters; // Buffer is added on client or professor specifies total radius
    console.log(`[GeoCheck] Student Distance: ${distance.toFixed(2)}m, Effective Session Radius: ${effectiveRadius}m`);
    return distance <= effectiveRadius;
}



// --- Populate Helper ---
const populateRecordFields = [
    { path: 'subject', select: 'subjectCode name _id' }, // Make sure _id is selected
    { path: 'professor', select: 'firstName lastName email _id' }, // Make sure _id is selected
    { path: 'location', select: 'name building _id' } // Make sure _id is selected
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
        // Student still sends these to identify the class they *think* they are checking into
        subjectId, professorId, /* locationId (optional, for scheduled loc) */
        classDateStr, scheduledStartTime, scheduledEndTime, term,

        // Student's current context
        currentTimeStr, latitude, longitude, accuracy,
        detectedBSSIDs = [], isMockDetected, deviceId
    } = req.body;

    // --- Basic Input Validation (as before) ---
    if (!subjectId || !professorId || !classDateStr || !scheduledStartTime || !scheduledEndTime || !term || !currentTimeStr || latitude == null || longitude == null || isMockDetected == null || !deviceId) {
        return res.status(400).json({ message: "Missing required fields for check-in." });
    }
    // ... other validations ...

    try {
        // --- 1. Find the Professor's Active Class Session for this class ---
        const classDateObjectForQuery = new Date(classDateStr);
        classDateObjectForQuery.setUTCHours(0, 0, 0, 0);

        const activeSession = await ActiveClassSession.findOne({
            professor: professorId,
            subject: subjectId,
            classDate: classDateObjectForQuery,
            scheduledStartTime: scheduledStartTime,
            // term: term, // Optional: if professor teaches same subject in multiple terms concurrently
            isActive: true
        }).lean(); // .lean() for performance if not modifying activeSession doc

        if (!activeSession) {
            return res.status(404).json({ message: "Professor has not started this class session, or it has ended. Please wait or contact your professor." });
        }
        if (!activeSession.geofenceCenter || !activeSession.geofenceCenter.coordinates) {
            return res.status(500).json({ message: "Active session found, but geofence center is missing. Contact admin." });
        }

        // --- 2. Time Window Check (using activeSession's scheduledStartTime and configured window) ---
        const checkinEndTime = addMinutesToTime(activeSession.scheduledStartTime, CHECKIN_WINDOW_MINUTES);
        if (!checkinEndTime || !isTimeWithinWindow(currentTimeStr, activeSession.scheduledStartTime, checkinEndTime)) {
            return res.status(400).json({ message: `Check-in window: ${activeSession.scheduledStartTime} - ${checkinEndTime}. Current: ${currentTimeStr}. Check-in closed/not open.` });
        }

        const user = await User.findById(studentId).select('+boundDeviceId').lean();
        if (!user) return res.status(404).json({ message: "Student not found." });

        // --- 3. Perform Validations using DYNAMIC Geofence from activeSession ---
        const deviceIdMatch = !!user.boundDeviceId && user.boundDeviceId === deviceId;
        const geoPassed = isWithinRadius(
            [parseFloat(longitude), parseFloat(latitude)],
            activeSession.geofenceCenter.coordinates,
            activeSession.radiusMeters + LOCATION_CHECK_RADIUS_METERS_BUFFER // Use radius from active session + buffer
        );
        const wifiPassed = activeSession.professorReportedBSSIDs && activeSession.professorReportedBSSIDs.length > 0
            ? activeSession.professorReportedBSSIDs.some(trustedBssid => detectedBSSIDs.includes(trustedBssid))
            : true; // If professor didn't report BSSIDs, Wi-Fi check passes

        const checkInData = {
            method: 'Manual', timestamp: new Date(), geoPassed, wifiPassed,
            mockDetected: !!isMockDetected, deviceIdMatch, deviceReportedId: deviceId,
            locationAccuracy: accuracy,
            coordinates: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            detectedBSSIDs: Array.isArray(detectedBSSIDs) ? detectedBSSIDs : []
        };

        // --- 4. Apply Validation Rules ---
        // --- Apply Validation Rules ---
        if (checkInData.mockDetected) return res.status(403).json({ message: "Check-in failed: Mock location detected.", validation: checkInData });
        if (!checkInData.deviceIdMatch) {
            return res.status(403).json({ message: user.boundDeviceId ? "Check-in failed: Device ID mismatch." : "Check-in failed: Device not bound to this account.", validation: checkInData });
        }
        if (!checkInData.geoPassed) return res.status(403).json({ message: "Check-in failed: Outside designated classroom area.", validation: checkInData });
        if (!checkInData.wifiPassed && activeSession.professorReportedBSSIDs?.length > 0) return res.status(403).json({ message: "Check-in failed: Wi-Fi environment mismatch with professor's location.", validation: checkInData });

        // --- 5. Create or Update AttendanceRecord ---
        // The 'location' field in AttendanceRecord will store the *scheduled* location ID.
        // We need to get this from the original Timetable referenced by activeSession.timetableId
        let scheduledStaticLocationId = null;
        const timetableDoc = await Timetable.findById(activeSession.timetableId).lean();
        if (timetableDoc) {
            const daySchedule = timetableDoc.weeklySchedule[activeSession.dayOfWeek];
            const classSlot = daySchedule?.find(s => s.startTime === activeSession.scheduledStartTime && s.professor.equals(activeSession.professor));
            if (classSlot) {
                scheduledStaticLocationId = classSlot.location;
            }
        }

        const classDateObjectForRecord = new Date(classDateStr); // Ensure this is normalized UTC midnight
        classDateObjectForRecord.setUTCHours(0, 0, 0, 0);

        const room = `session-${activeSession.professor}-${activeSession.subject}-${classDateStr}-${activeSession.scheduledStartTime}`;
        let recordToRespond;
        let httpStatus = 200;
        let actionTypeForSocket = 'UPDATE';

        const existingRecord = await AttendanceRecord.findOne({
            student: studentId,
            subject: activeSession.subject, // Use from activeSession
            classDate: classDateObjectForRecord,
            scheduledStartTime: activeSession.scheduledStartTime, // Use from activeSession
            term: activeSession.term          // Use from activeSession
        });

        if (existingRecord) {
            // ... (same logic for handling existing record as before)
            if (existingRecord.checkIn && (existingRecord.status === 'Pending' || existingRecord.status === 'Present')) {
                recordToRespond = await AttendanceRecord.findById(existingRecord._id).populate(populateRecordFields);
                return res.status(200).json({ message: `Already ${existingRecord.status.toLowerCase()} for this class.`, record: recordToRespond });
            }
            console.log(`Existing record found (status: ${existingRecord.status}), updating check-in and setting to Pending.`);
            existingRecord.checkIn = checkInData;
            existingRecord.status = 'Pending';
            existingRecord.checkOut = undefined;
            // Ensure these denormalized fields are from the activeSession
            existingRecord.professor = activeSession.professor;
            existingRecord.scheduledEndTime = activeSession.expectedEndTime;
            existingRecord.timetableRef = activeSession.timetableId;
            if (scheduledStaticLocationId) existingRecord.location = scheduledStaticLocationId; else delete existingRecord.location;

            await existingRecord.save();
            recordToRespond = existingRecord;
        } else {
            console.log("No existing record, creating new one with status Pending.");
            const newRecordData = {
                student: studentId,
                subject: activeSession.subject,
                professor: activeSession.professor,
                // Location here is the *scheduled* static location
                ...(scheduledStaticLocationId && { location: scheduledStaticLocationId }),
                timetableRef: activeSession.timetableId,
                classDate: classDateObjectForRecord,
                scheduledStartTime: activeSession.scheduledStartTime,
                scheduledEndTime: activeSession.expectedEndTime,
                term: activeSession.term,
                checkIn: checkInData,
                status: 'Pending',
            };
            if (!scheduledStaticLocationId) {
                // Handle case where static location couldn't be found - either make location optional or error out
                console.warn("Scheduled static location ID not found for new attendance record. 'location' field will be omitted.");
                
                // Let's re-introduce locationId from req.body for the scheduled location
                const studentProvidedScheduledLocationId = req.body.locationId;
                if (studentProvidedScheduledLocationId && mongoose.Types.ObjectId.isValid(studentProvidedScheduledLocationId)) {
                    newRecordData.location = studentProvidedScheduledLocationId;
                } else {
                    
                    console.warn("No valid scheduled location ID available from timetable or student request body for new attendance record.");
                    
                }
            }

            const newRecord = new AttendanceRecord(newRecordData);
            await newRecord.save();
            recordToRespond = newRecord;
            httpStatus = 201;
            actionTypeForSocket = 'CREATE';
        }

        const populatedRecord = await AttendanceRecord.findById(recordToRespond._id).populate(populateRecordFields);
        if (!populatedRecord) {
            console.error("Error: Record was saved for checkout but could not be found for population.");
            return res.status(500).json({ message: "Internal server error after processing check-out." });
        }

        // Socket.IO emission
        if (io) {
            io.to(room).emit('attendanceUpdate', {
                type: actionTypeForSocket, studentId: populatedRecord.student,
                status: populatedRecord.status, recordId: populatedRecord._id,
                checkInTime: populatedRecord.checkIn?.timestamp,
                // Populate with names for socket if possible
                subjectName: populatedRecord.subject?.name,
                professorName: `${populatedRecord.professor?.firstName} ${populatedRecord.professor?.lastName}`,
            });
        }

        res.status(httpStatus).json({ message: `Check-in successful. Status: ${populatedRecord.status}.`, record: populatedRecord });

    } catch (error) {
        console.error("Manual Check-In Error (Dynamic):", error);
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
        attendanceRecordId, // Student app must send this
        currentTimeStr, latitude, longitude, accuracy,
        detectedBSSIDs = [], isMockDetected, deviceId
    } = req.body;

    // ... (Basic validations as before) ...
    if (!attendanceRecordId || !mongoose.Types.ObjectId.isValid(attendanceRecordId)) { /* ... */ }
    if (!currentTimeStr || latitude == null || longitude == null || isMockDetected == null || !deviceId) { /* ... */ }


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

        // --- 1. Find the Active Class Session for this class for validation ---
        const classDateObjectForQuery = new Date(recordToUpdate.classDate); // Use date from record
        classDateObjectForQuery.setUTCHours(0, 0, 0, 0);

        const activeSession = await ActiveClassSession.findOne({
            professor: recordToUpdate.professor, // From existing attendance record
            subject: recordToUpdate.subject,     // From existing attendance record
            classDate: classDateObjectForQuery,
            scheduledStartTime: recordToUpdate.scheduledStartTime, // From existing record
            isActive: true
        }).lean();

        if (!activeSession) {
            // This is tricky. If session ended, should checkout still be allowed based on last known geofence?
            // Or should it fail? For now, let's assume checkout requires an active session for validation.
            // Alternatively, professor could "end session and mark remaining pending as present/absent".
            console.warn(`No active session found for class during checkout attempt for record ${recordToUpdate._id}. Checkout might proceed without dynamic geofence validation or fail.`);
            // If you want to allow checkout even if session ended, you might need to store the last geofence center
            // somewhere accessible, or relax validation.
            // For now, let's assume it's a validation failure if session isn't active.
            return res.status(404).json({ message: "Professor's class session seems to have ended. Checkout validation cannot be performed against live geofence." });
        }
        if (!activeSession.geofenceCenter || !activeSession.geofenceCenter.coordinates) {
            return res.status(500).json({ message: "Active session found, but geofence center is missing. Contact admin." });
        }


        // --- 2. Time Window Check (using record's scheduledEndTime) ---
        const checkoutStartTime = recordToUpdate.scheduledEndTime;
        const checkoutEndTime = addMinutesToTime(recordToUpdate.scheduledEndTime, CHECKOUT_WINDOW_MINUTES);
        if (!checkoutEndTime || !isTimeWithinWindow(currentTimeStr, checkoutStartTime, checkoutEndTime)) {
            return res.status(400).json({ message: `Check-out window: ${checkoutStartTime} - ${checkoutEndTime}. Current: ${currentTimeStr}. Check-out closed.` });
        }

        const user = await User.findById(studentId).select('+boundDeviceId').lean();
        if (!user) return res.status(404).json({ message: "Student not found (internal error)." });

        // --- 3. Perform Validations using DYNAMIC Geofence from activeSession ---
        const deviceIdMatch = !!user.boundDeviceId && user.boundDeviceId === deviceId;
        const geoPassed = isWithinRadius(
            [parseFloat(longitude), parseFloat(latitude)],
            activeSession.geofenceCenter.coordinates,
            activeSession.radiusMeters + LOCATION_CHECK_RADIUS_METERS_BUFFER // Buffer can be smaller or zero for checkout
        );
        const wifiPassed = activeSession.professorReportedBSSIDs && activeSession.professorReportedBSSIDs.length > 0
            ? activeSession.professorReportedBSSIDs.some(trustedBssid => detectedBSSIDs.includes(trustedBssid))
            : true;

            const checkOutData = {
                method: 'Manual', timestamp: new Date(), geoPassed, wifiPassed,
                mockDetected: !!isMockDetected, deviceIdMatch, deviceReportedId: deviceId,
                locationAccuracy: accuracy,
                coordinates: { type: 'Point', coordinates: [longitude, latitude] },
                detectedBSSIDs: Array.isArray(detectedBSSIDs) ? detectedBSSIDs : []
            };

        // --- 4. Apply Validation Rules ---
        if (checkOutData.mockDetected) return res.status(403).json({ message: "Check-out failed: Mock location detected.", validation: checkOutData });
        if (!checkOutData.deviceIdMatch) return res.status(403).json({ message: "Check-out failed: Device ID mismatch.", validation: checkOutData });
        if (!checkOutData.geoPassed) return res.status(403).json({ message: "Check-out failed: Must be inside designated area.", validation: checkOutData });
        if (!checkInData.wifiPassed && activeSession.professorReportedBSSIDs?.length > 0) return res.status(403).json({ message: "Check-ouuut failed: Wi-Fi environment mismatch with professor's location.", validation: checkInData });

        // --- 5. Update Record ---
        recordToUpdate.checkOut = checkOutData;
        if (recordToUpdate.checkIn) {
            recordToUpdate.status = 'Present';
        } else {
            console.warn(`Check-out performed for record ${recordToUpdate._id} without a prior check-in. Status remains ${recordToUpdate.status}.`);
        }
        await recordToUpdate.save();

        const populatedRecord = await AttendanceRecord.findById(recordToUpdate._id).populate(populateRecordFields);
        if (!populatedRecord) {
                console.error("Error: Record was saved for checkout but could not be found for population.");
                return res.status(500).json({ message: "Internal server error after processing check-out." });
            }

        // Socket.IO emission
        const room = `session-${populatedRecord.professor._id}-${populatedRecord.subject._id}-${populatedRecord.classDate.toISOString().split('T')[0]}-${populatedRecord.scheduledStartTime}`;
        if (io) {
                        io.to(room).emit('attendanceUpdate', {
                            type: 'UPDATE', studentId: populatedRecord.student, status: populatedRecord.status,
                            recordId: populatedRecord._id,
                            checkInTime: populatedRecord.checkIn?.timestamp,
                            checkOutTime: populatedRecord.checkOut?.timestamp,
                            subjectName: populatedRecord.subject?.name,
                            professorName: `${populatedRecord.professor?.firstName} ${populatedRecord.professor?.lastName}`,
                        });
                    }

        res.status(200).json({ message: `Check-out successful. Attendance marked as ${populatedRecord.status}.`, record: populatedRecord });

    } catch (error) {
        console.error("Manual Check-Out Error (Dynamic):", error);
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
        if (io) {
            io.to(room).emit('attendanceUpdate', {
                type: 'UPDATE',
                studentId: record.student,
                status: newStatus, // Send the new status
                recordId: record._id,
                updatedBy: req.user.role, // Optionally send who updated it
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

        const filter = {
            professor: professorId, // Ensure it's the correct professor
            subject: subjectId,
            location: locationId,
            classDate: classDateObject,
            scheduledStartTime: scheduledStartTime,
            term: term
        };

        const sessionAttendance = await AttendanceRecord.find(filter)
            .populate({ path: 'student', select: 'firstName lastName studentId' }) // Get student details
            .select('student status checkIn.timestamp checkOut.timestamp createdAt') // Select relevant fields
            .sort({ 'student.lastName': 1, 'student.firstName': 1 }) // Sort by student name
            .lean();

        // TODO: Augment this list with students who are *expected* but have NO record yet (Absent)
        // This requires knowing the enrollment list for the class (e.g., query User based on branch/sem/section matching the timetable entry)

        res.status(200).json(sessionAttendance);

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