// controllers/attendanceController.js
const mongoose = require('mongoose');
const AttendanceRecord = require("../models/AttendanceRecord");
const User = require("../models/User");
const Location = require("../models/Location");

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
        return false;
    }
    // **VERY basic placeholder - Euclidean distance on degrees (NOT accurate globally!)**
    // **REPLACE THIS WITH A PROPER HAVERSINE IMPLEMENTATION**
    const R = 6371e3; // Earth radius in meters
    const lat1 = pointCoords[1] * Math.PI/180; // φ, λ in radians
    const lat2 = centerCoords[1] * Math.PI/180;
    const deltaLat = (centerCoords[1]-pointCoords[1]) * Math.PI/180;
    const deltaLon = (centerCoords[0]-pointCoords[0]) * Math.PI/180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // in metres

    console.log(`Distance calculated: ${distance}m, Radius: ${radiusMeters}m`); // For debugging
    return distance <= radiusMeters;
}


// --- Controller Methods ---

/**
 * @desc    Student manually checks in for a class
 * @route   POST /api/attendance/check-in
 * @access  Private (Student)
 */
exports.manualCheckIn = async (req, res) => {
    const studentId = req.user._id;
    const io = req.io; // Get io instance from request object
    const {
        subjectId, professorId, locationId, classDateStr, // Class identifiers
        scheduledStartTime, scheduledEndTime, term, // Schedule details
        currentTimeStr, latitude, longitude, accuracy, // Current state from App
        detectedBSSIDs = [], isMockDetected, deviceId // Validation data from App
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
            return res.status(400).json({ message: `Check-in only allowed between ${scheduledStartTime} and ${checkinEndTime}. Current time: ${currentTimeStr}` });
        }

        // --- Fetch User for Device ID check ---
        const user = await User.findById(studentId).select('+boundDeviceId').lean(); // Use lean for read-only
        if (!user) return res.status(404).json({ message: "Student not found." });

        // --- Fetch Location for Geo/WiFi check ---
        const location = await Location.findById(locationId).lean();
        if (!location || !location.location || !location.location.coordinates) {
            return res.status(404).json({ message: "Classroom location details not found." });
        }

        // --- Perform Validations ---
        const deviceIdMatch = !!user.boundDeviceId && user.boundDeviceId === deviceId;
        const geoPassed = isWithinRadius(
            [longitude, latitude],
            location.location.coordinates,
            location.radiusMeters + LOCATION_CHECK_RADIUS_METERS_BUFFER // Add buffer
        );
        const wifiPassed = location.trustedWifiBSSIDs && location.trustedWifiBSSIDs.length > 0
            ? location.trustedWifiBSSIDs.some(trustedBssid => detectedBSSIDs.includes(trustedBssid))
            : true; // If no trusted BSSIDs are configured, bypass Wi-Fi check (configurable policy)


        // --- Assemble Validation Data ---
        const checkInData = {
            method: 'Manual',
            timestamp: new Date(), // Server time is more reliable
            geoPassed,
            wifiPassed,
            mockDetected: !!isMockDetected, // Ensure boolean
            deviceIdMatch,
            deviceReportedId: deviceId,
            locationAccuracy: accuracy,
            coordinates: { type: 'Point', coordinates: [longitude, latitude] },
            detectedBSSIDs: Array.isArray(detectedBSSIDs) ? detectedBSSIDs : []
        };

        // --- Apply Validation Rules ---
        if (checkInData.mockDetected) {
            return res.status(403).json({ message: "Check-in failed: Mock location detected.", validation: checkInData });
        }
        if (!checkInData.deviceIdMatch) {
             if (!user.boundDeviceId) {
                 return res.status(403).json({ message: "Check-in failed: Device not bound to this account.", validation: checkInData });
             } else {
                 return res.status(403).json({ message: "Check-in failed: Device ID mismatch.", validation: checkInData });
             }
        }
        if (!checkInData.geoPassed) {
            return res.status(403).json({ message: "Check-in failed: Outside designated classroom area.", validation: checkInData });
        }
        if (!checkInData.wifiPassed && location.trustedWifiBSSIDs?.length > 0) { // Only fail if trusted list exists & no match
            return res.status(403).json({ message: "Check-in failed: Classroom Wi-Fi environment mismatch.", validation: checkInData });
        }

        // --- Check if Already Checked In ---
        const classDateObject = new Date(classDateStr); // Assumes YYYY-MM-DD
        classDateObject.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

        const existingRecord = await AttendanceRecord.findOne({
            student: studentId,
            subject: subjectId,
            classDate: classDateObject,
            scheduledStartTime: scheduledStartTime
        });

        // --- Define the Socket.IO Room Name ---
        // Needs to be consistent and specific to the class session
        const classDateObjectForRoom = new Date(classDateStr); // Ensure consistent date formatting for room name
        const formattedDate = classDateObjectForRoom.toISOString().split('T')[0]; // YYYY-MM-DD format
        const room = `session-${professorId}-${subjectId}-${formattedDate}-${scheduledStartTime}`;



        if (existingRecord && existingRecord.status === 'Present') {
            return res.status(200).json({ message: "Already checked in for this class.", record: existingRecord });
        }
         if (existingRecord && existingRecord.checkIn) {
             // Could be 'Late', 'Absent' etc. but has a checkIn attempt maybe? Decide policy.
             // For now, let's overwrite/update if not 'Present'
             console.log(`Existing record found with status ${existingRecord.status}, updating.`);
             existingRecord.checkIn = checkInData;
             existingRecord.status = 'Present'; // Or 'Late' if currentTime > startTime + grace period?
             await existingRecord.save();

             // --- Socket.IO Emission (Placeholder) ---
             // const room = `${professorId}-${subjectId}-${classDateStr}-${scheduledStartTime}`;
             // if (req.io) req.io.to(room).emit('attendanceUpdate', { studentId, status: 'Present', record: existingRecord });

              // --- Socket.IO Emission ---
            if (io) {
                io.to(room).emit('attendanceUpdate', {
                    type: 'UPDATE',
                    studentId: existingRecord.student, // Send student ID
                    status: existingRecord.status,
                    recordId: existingRecord._id,
                    checkInTime: existingRecord.checkIn?.timestamp,
                    // Include other relevant details if needed by frontend
                });
            }

             return res.status(200).json({ message: "Attendance record updated to Present.", record: existingRecord });
        }

        // --- Create New Record ---
        const newRecord = new AttendanceRecord({
            student: studentId,
            subject: subjectId,
            professor: professorId,
            location: locationId,
            classDate: classDateObject,
            scheduledStartTime,
            scheduledEndTime,
            term,
            checkIn: checkInData,
            status: 'Present', // Consider 'Late' logic based on time if needed
        });

        await newRecord.save();

         // --- Socket.IO Emission ---
        if (io) {
             io.to(room).emit('attendanceUpdate', {
                type: 'CREATE', // Indicate a new record was created
                studentId: newRecord.student,
                status: newRecord.status,
                recordId: newRecord._id,
                checkInTime: newRecord.checkIn?.timestamp,
                // Include student name etc. if needed, or let frontend fetch if necessary
            });
        }

        res.status(201).json({ message: "Check-in successful.", record: newRecord });

    } catch (error) {
        console.error("Manual Check-In Error:", error);
        res.status(500).json({ message: "Server error during check-in." });
    }
};

/**
 * @desc    Student manually checks out from a class
 * @route   POST /api/attendance/check-out
 * @access  Private (Student)
 */
exports.manualCheckOut = async (req, res) => {
    const studentId = req.user._id;
    const io = req.io; // Get io instance from request object
     // Need identifiers to find the specific record + validation data
     const {
        attendanceRecordId, // Preferred way to identify the record
        // OR fallback identifiers if ID not sent:
        subjectId, classDateStr, scheduledStartTime,
        // Validation data:
        currentTimeStr, latitude, longitude, accuracy,
        detectedBSSIDs = [], isMockDetected, deviceId
    } = req.body;

    // --- Basic Input Validation ---
     if (!attendanceRecordId && (!subjectId || !classDateStr || !scheduledStartTime)) {
         return res.status(400).json({ message: "Missing attendanceRecordId or subject/date/time to identify the class session." });
     }
     if (!currentTimeStr || latitude == null || longitude == null || isMockDetected == null || !deviceId) {
        return res.status(400).json({ message: "Missing required fields for check-out validation." });
    }


    try {
         // --- Find the Record to Update ---
         let recordToUpdate;
         if (attendanceRecordId && mongoose.Types.ObjectId.isValid(attendanceRecordId)) {
            recordToUpdate = await AttendanceRecord.findOne({ _id: attendanceRecordId, student: studentId });
         } else if (subjectId && classDateStr && scheduledStartTime) {
             const classDateObject = new Date(classDateStr);
             classDateObject.setUTCHours(0, 0, 0, 0);
             recordToUpdate = await AttendanceRecord.findOne({
                student: studentId,
                subject: subjectId,
                classDate: classDateObject,
                scheduledStartTime: scheduledStartTime,
                status: 'Present' // Only allow checkout if currently 'Present'
             });
         }

         if (!recordToUpdate) {
             return res.status(404).json({ message: "No active 'Present' attendance record found for this class session to check out from." });
         }
         if (recordToUpdate.checkOut) {
             return res.status(200).json({ message: "Already checked out for this class.", record: recordToUpdate });
         }

        // --- Time Window Check ---
        const checkoutStartTime = recordToUpdate.scheduledEndTime; // Can checkout exactly at end time
        const checkoutEndTime = addMinutesToTime(recordToUpdate.scheduledEndTime, CHECKOUT_WINDOW_MINUTES);
        if (!checkoutEndTime || !isTimeWithinWindow(currentTimeStr, checkoutStartTime, checkoutEndTime)) {
            return res.status(400).json({ message: `Check-out only allowed between ${checkoutStartTime} and ${checkoutEndTime}. Current time: ${currentTimeStr}` });
        }

         // --- Fetch User & Location for validation (if needed again) ---
         // Optimisation: If check-in data is trusted, maybe skip some re-checks?
         // For robustness, re-validate.
         const user = await User.findById(studentId).select('+boundDeviceId').lean();
         if (!user) return res.status(404).json({ message: "Student not found." });
         const location = await Location.findById(recordToUpdate.location).lean(); // Get location from the record
         if (!location || !location.location || !location.location.coordinates) {
             return res.status(404).json({ message: "Classroom location details not found for validation." });
         }

        // --- Perform Validations (Similar to Check-in) ---
        const deviceIdMatch = !!user.boundDeviceId && user.boundDeviceId === deviceId;
        const geoPassed = isWithinRadius(
            [longitude, latitude],
            location.location.coordinates,
            location.radiusMeters + LOCATION_CHECK_RADIUS_METERS_BUFFER
        );
         const wifiPassed = location.trustedWifiBSSIDs && location.trustedWifiBSSIDs.length > 0
            ? location.trustedWifiBSSIDs.some(trustedBssid => detectedBSSIDs.includes(trustedBssid))
            : true;

        // --- Assemble Validation Data ---
        const checkOutData = {
            method: 'Manual',
            timestamp: new Date(),
            geoPassed,
            wifiPassed,
            mockDetected: !!isMockDetected,
            deviceIdMatch,
            deviceReportedId: deviceId,
            locationAccuracy: accuracy,
            coordinates: { type: 'Point', coordinates: [longitude, latitude] },
            detectedBSSIDs: Array.isArray(detectedBSSIDs) ? detectedBSSIDs : []
        };

        // --- Apply Validation Rules ---
        if (checkOutData.mockDetected) {
            return res.status(403).json({ message: "Check-out failed: Mock location detected.", validation: checkOutData });
        }
        if (!checkOutData.deviceIdMatch) {
             return res.status(403).json({ message: "Check-out failed: Device ID mismatch.", validation: checkOutData });
        }
        if (!checkOutData.geoPassed) {
            return res.status(403).json({ message: "Check-out failed: Must be inside designated area to check out.", validation: checkOutData });
        }
        if (!checkOutData.wifiPassed && location.trustedWifiBSSIDs?.length > 0) {
            return res.status(403).json({ message: "Check-out failed: Classroom Wi-Fi environment mismatch.", validation: checkOutData });
        }

        // --- Update Record ---
        recordToUpdate.checkOut = checkOutData;
        // Optionally update status if needed (e.g., based on check-out time vs scheduled end time)
        // recordToUpdate.status = 'Present'; // Assuming checkout confirms presence for the duration

        await recordToUpdate.save();

        // --- Define Room Name (consistent with check-in) ---
        const classDateObjectForRoom = recordToUpdate.classDate; // Use date from the record
        const formattedDate = classDateObjectForRoom.toISOString().split('T')[0];
        const room = `session-${recordToUpdate.professor}-${recordToUpdate.subject}-${formattedDate}-${recordToUpdate.scheduledStartTime}`;

        // --- Socket.IO Emission ---
        if (io) {
             io.to(room).emit('attendanceUpdate', {
                type: 'UPDATE', // Indicate an existing record was updated
                studentId: recordToUpdate.student,
                status: recordToUpdate.status,
                recordId: recordToUpdate._id,
                checkOutTime: recordToUpdate.checkOut?.timestamp, // Send checkout time
            });
        }

        res.status(200).json({ message: "Check-out successful.", record: recordToUpdate });

    } catch (error) {
        console.error("Manual Check-Out Error:", error);
        res.status(500).json({ message: "Server error during check-out." });
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



/**
 * @desc    Get attendance history for the logged-in student
 * @route   GET /api/attendance/student/history
 * @access  Private (Student)
 */
exports.getStudentAttendanceHistory = async (req, res) => {
    const studentId = req.user._id;
    const { subjectId, term, fromDate, toDate, page = 1, limit = 20 } = req.query;

    const filter = { student: studentId };
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
        filter.subject = subjectId;
    }
    if (term) {
        filter.term = term;
    }
    if (fromDate || toDate) {
        filter.classDate = {};
        if (fromDate) filter.classDate.$gte = new Date(fromDate); // Assumes YYYY-MM-DD
        if (toDate) filter.classDate.$lte = new Date(toDate);
    }

    try {
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { classDate: -1, scheduledStartTime: -1 }, // Sort by date desc, then time
            populate: [ // Populate details
                { path: 'subject', select: 'subjectCode name' },
                { path: 'professor', select: 'firstName lastName' },
                { path: 'location', select: 'name building' }
            ],
            select: '-checkIn.detectedBSSIDs -checkIn.deviceReportedId -checkOut', // Exclude bulky/sensitive validation details
            lean: true // Use lean for faster read-only results
        };

        // Use mongoose-paginate-v2 if installed, otherwise manual skip/limit
        // Manual pagination example:
        const skip = (options.page - 1) * options.limit;
        const records = await AttendanceRecord.find(filter)
            .sort(options.sort)
            .skip(skip)
            .limit(options.limit)
            .populate(options.populate)
            .select(options.select)
            .lean();

        const totalRecords = await AttendanceRecord.countDocuments(filter);

        res.status(200).json({
            docs: records,
            totalDocs: totalRecords,
            limit: options.limit,
            page: options.page,
            totalPages: Math.ceil(totalRecords / options.limit),
            // hasPrevPage, hasNextPage, etc. can be calculated
        });

    } catch (error) {
        console.error("Get Student History Error:", error);
        res.status(500).json({ message: "Server error fetching attendance history." });
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

    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
        return res.status(400).json({ message: "Invalid record ID format." });
    }
    const allowedStatuses = ['Present', 'Absent', 'Late', 'Excused']; // Define modifiable statuses
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}.` });
    }

    try {
        const record = await AttendanceRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({ message: "Attendance record not found." });
        }

        // --- Authorization Check ---
        // Allow if user is admin OR if user is the professor listed on the record
        if (userRole !== 'admin' && !record.professor.equals(userId)) {
             return res.status(403).json({ message: "You are not authorized to modify this attendance record." });
        }

        // --- Update Record ---
        record.status = newStatus;
        if (reason) {
            record.adminOverrideReason = `Changed by ${userRole} (${req.user.email}) on ${new Date().toISOString()}: ${reason}`;
        } else {
             record.adminOverrideReason = `Status changed to ${newStatus} by ${userRole} (${req.user.email}) on ${new Date().toISOString()}.`;
        }

        // Clear check-in/out data if marking absent? (Policy decision)
        // if (newStatus === 'Absent') {
        //    record.checkIn = undefined;
        //    record.checkOut = undefined;
        // }

        await record.save();

         // --- Socket.IO Emission (Placeholder) ---
         // const classDateStr = record.classDate.toISOString().split('T')[0];
         // const room = `${record.professor}-${record.subject}-${classDateStr}-${record.scheduledStartTime}`;
         // if (req.io) req.io.to(room).emit('attendanceUpdate', { studentId: record.student, status: newStatus, record: record });


        res.status(200).json({ message: `Attendance status updated to ${newStatus}.`, record });

    } catch (error) {
        console.error("Update Attendance Status Error:", error);
        res.status(500).json({ message: "Server error updating attendance status." });
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