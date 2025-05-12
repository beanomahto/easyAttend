// controllers/classSessionController.js
const ActiveClassSession = require('../models/ActiveClassSession');
const Timetable = require('../models/Timetable');
const mongoose = require('mongoose');

exports.startClassSession = async (req, res) => {
    const professorId = req.user._id;
    const {
        latitude, longitude, radiusMeters = 30, professorReportedBSSIDs = [],
        timetableId, dayOfWeek, scheduledStartTime, // Identifiers for the scheduled class slot
    } = req.body;

    if (latitude == null || longitude == null || !timetableId || !dayOfWeek || !scheduledStartTime) {
        return res.status(400).json({ message: "Missing required fields: latitude, longitude, timetableId, dayOfWeek, scheduledStartTime." });
    }
    if (!mongoose.Types.ObjectId.isValid(timetableId)) {
        return res.status(400).json({ message: "Invalid timetableId format." });
    }

    try {
        const classDateObject = new Date(); // Use current date for the session
        classDateObject.setUTCHours(0,0,0,0); // Normalize to midnight UTC

        // Check for existing active session for this specific class slot by this professor today
        const existingActiveForThisSlot = await ActiveClassSession.findOne({
            professor: professorId,
            timetableId: timetableId, // Assuming professor app sends this
            dayOfWeek: dayOfWeek,
            scheduledStartTime: scheduledStartTime,
            classDate: classDateObject, // Check for today
            isActive: true
        });

        if (existingActiveForThisSlot) {
            return res.status(400).json({
                message: "A session for this specific class slot is already active. End it first or it might be a duplicate attempt.",
                activeSession: existingActiveForThisSlot
            });
        }

        // Also check if professor has ANY other class active (might be a business rule)
        const anyOtherActiveSession = await ActiveClassSession.findOne({ professor: professorId, isActive: true });
        if (anyOtherActiveSession) {
            // Depending on rules, you might allow multiple concurrent *different* classes, or only one.
            // For now, let's assume only one active class at a time for simplicity.
             console.warn(`Professor ${professorId} tried to start a new session while another session (ID: ${anyOtherActiveSession._id}) is active.`);
            // return res.status(400).json({
            //     message: "You already have another class session active. Please end it before starting a new one.",
            //     activeSession: anyOtherActiveSession
            // });
        }

        const timetable = await Timetable.findById(timetableId).lean();
        if (!timetable) {
            return res.status(404).json({ message: "Associated Timetable not found." });
        }

        const daySchedule = timetable.weeklySchedule[dayOfWeek];
        if (!daySchedule || daySchedule.length === 0) {
            return res.status(404).json({ message: `No schedule found for ${dayOfWeek} in this timetable.` });
        }

        const classSlot = daySchedule.find(slot =>
            slot.startTime === scheduledStartTime &&
            slot.professor.equals(professorId) // Ensure professor is assigned to this slot
        );

        if (!classSlot) {
            return res.status(404).json({ message: `You are not scheduled for a class at ${scheduledStartTime} on ${dayOfWeek} in timetable ${timetableId}.` });
        }

        const newSession = new ActiveClassSession({
            timetableId, dayOfWeek, scheduledStartTime,
            professor: professorId,
            subject: classSlot.subject,
            classDate: classDateObject,
            term: timetable.term,
            geofenceCenter: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            radiusMeters: parseInt(radiusMeters, 10),
            expectedEndTime: classSlot.endTime,
            professorReportedBSSIDs,
            isActive: true,
            sessionStartTime: new Date()
        });

        await newSession.save();
        // TODO: Emit socket event
        res.status(201).json({ message: "Class session started and geofence set.", session: newSession });

    } catch (error) {
        console.error("Start Class Session Error:", error);
        if (error.code === 11000) { // Duplicate key error for the unique index
            return res.status(400).json({ message: "An active session for this exact class slot, by you, on this day already exists or was attempted simultaneously. Please check active sessions or try again." });
        }
        res.status(500).json({ message: "Server error starting class session.", error: error.message });
    }
};

exports.endClassSession = async (req, res) => {
    const professorId = req.user._id;
    // Professor app should send the _id of the ActiveClassSession to end
    const { activeClassSessionId } = req.body;

    if (!activeClassSessionId || !mongoose.Types.ObjectId.isValid(activeClassSessionId)) {
        return res.status(400).json({ message: "Valid activeClassSessionId is required." });
    }

    try {
        const session = await ActiveClassSession.findOneAndUpdate(
            { _id: activeClassSessionId, professor: professorId, isActive: true },
            { isActive: false, sessionEndTime: new Date() },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ message: "Active session not found or already ended." });
        }
        // TODO: Emit socket event
        res.status(200).json({ message: "Class session ended.", session });
    } catch (error) {
        console.error("End Class Session Error:", error);
        res.status(500).json({ message: "Server error ending class session.", error: error.message });
    }
};

exports.getMyActiveSession = async (req, res) => {
    const professorId = req.user._id;
    try {
        const activeSession = await ActiveClassSession.findOne({ professor: professorId, isActive: true })
            .populate('subject', 'name subjectCode _id')
            .populate({ // Populate timetable to get section/branch for display
                path: 'timetableId',
                select: 'branch semester section _id',
            })
            .lean();

        if (!activeSession) {
            return res.status(200).json(null);
        }
        res.status(200).json(activeSession);
    } catch (error) {
        console.error("Get My Active Session Error:", error);
        res.status(500).json({ message: "Server error fetching active session.", error: error.message });
    }
};