// controllers/timetableController.js
const Timetable = require("../models/Timetable");
const mongoose = require('mongoose');
const User = require('../models/User'); // Need User model for validation checks

// Helper (consider moving to a config or util file)
function getCurrentTerm() {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return (month >= 7 && month <= 11) ? `FALL ${year}` : `SPRING ${year}`;
}

// --- Create/Update Timetable (Admin Task) ---
// Using PUT for upsert logic: create if not exists, update if exists
exports.upsertTimetable = async (req, res) => {
    try {
        const { branch, semester, section = 'A', term, weeklySchedule, isActive = true } = req.body;

        // --- Basic Validation ---
        if (!branch || !semester || !term || !weeklySchedule || typeof weeklySchedule !== 'object') {
            return res.status(400).json({ message: "Missing/invalid fields: branch, semester, term, weeklySchedule (must be object)." });
        }

        // --- Deep Validation of weeklySchedule (Example for one slot) ---
        // It's good practice to validate ObjectIds and existence of referenced docs
        let validationError = null;
        for (const day of Object.keys(weeklySchedule)) {
            if (!Array.isArray(weeklySchedule[day])) continue; // Skip if day not an array
            for (const slot of weeklySchedule[day]) {
                if (!mongoose.Types.ObjectId.isValid(slot.subject) ||
                    !mongoose.Types.ObjectId.isValid(slot.professor) ||
                    !mongoose.Types.ObjectId.isValid(slot.location)) {
                    validationError = `Invalid ObjectId found in schedule for ${day} at ${slot.startTime}.`;
                    break;
                }
                 // Optional: Check if referenced professor actually has 'professor' role
                 // const prof = await User.findOne({ _id: slot.professor, role: 'professor' });
                 // if (!prof) validationError = `User ${slot.professor} is not a valid professor.`
                 // break;
                 // Similar checks for Subject and Location existence can be added
            }
            if (validationError) break;
        }
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        // --- End Validation ---

        const filter = { branch, semester, section, term };
        const update = { weeklySchedule, isActive }; // Fields to set/update
        const options = {
            new: true, // Return the modified document rather than the original
            upsert: true, // Create a document if one doesn't match the filter
            runValidators: true, // Ensure schema validations are run on update
            setDefaultsOnInsert: true // Apply default values if inserting
        };

        const updatedTimetable = await Timetable.findOneAndUpdate(filter, update, options);

        res.status(200).json(updatedTimetable); // 200 OK for update/upsert

    } catch (err) {
        console.error("Upsert Timetable Error:", err);
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(". ") });
        }
        res.status(500).json({ error: "Failed to create or update timetable" });
    }
};

// --- Get Today's Schedule for Logged-in Student ---
exports.getStudentTodaySchedule = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'student') {
            return res.status(403).json({ message: "Access denied. Student role required." });
        }
        const { branch, currentSemester: semester, section } = req.user;
        const term = req.query.term || getCurrentTerm();

        if (!branch || !semester || !section) {
            return res.status(400).json({ message: "Student details incomplete (branch, semester, section)." });
        }

        const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

        const timetable = await Timetable.findOne({ branch, semester, section, term, isActive: true })
            .populate({ path: `weeklySchedule.${dayOfWeek}.subject`, select: 'subjectCode name -_id' })
            .populate({ path: `weeklySchedule.${dayOfWeek}.professor`, select: 'firstName lastName email -_id' }) // Fetch needed prof details
            .populate({ path: `weeklySchedule.${dayOfWeek}.location`, select: 'name building -_id' }); // Fetch needed loc details

        if (!timetable || !timetable.weeklySchedule?.[dayOfWeek]) {
            return res.status(200).json([]); // No classes today
        }

        res.status(200).json(timetable.weeklySchedule[dayOfWeek]);

    } catch (err) {
        console.error("Get Student Schedule Error:", err);
        res.status(500).json({ error: "Server error fetching student schedule" });
    }
};

// --- Get Today's Schedule for Logged-in Professor ---
exports.getProfessorTodaySchedule = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'professor') {
            return res.status(403).json({ message: "Access denied. Professor role required." });
        }
        const professorId = req.user._id;
        const term = req.query.term || getCurrentTerm();
        const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

        // Find timetables where this professor teaches on this day in this term
        const query = {
            term: term,
            isActive: true,
            [`weeklySchedule.${dayOfWeek}.professor`]: professorId // Query nested array
        };

        const timetables = await Timetable.find(query)
            .select(`branch semester section weeklySchedule.${dayOfWeek}`) // Select relevant parts
            .populate({ path: `weeklySchedule.${dayOfWeek}.subject`, select: 'subjectCode name -_id' })
            .populate({ path: `weeklySchedule.${dayOfWeek}.location`, select: 'name building -_id' })
            // No need to populate professor, we know it's the logged-in one
            .lean(); // Use lean for performance

        let professorClasses = [];
        timetables.forEach(tt => {
            if (tt.weeklySchedule?.[dayOfWeek]) {
                tt.weeklySchedule[dayOfWeek].forEach(slot => {
                    // Double check the professor ID matches (though query should ensure this)
                    if (slot.professor && slot.professor.equals(professorId)) {
                        professorClasses.push({
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            subject: slot.subject, // Already populated object
                            location: slot.location, // Already populated object
                            // Add context
                            branch: tt.branch,
                            semester: tt.semester,
                            section: tt.section,
                            term: term,
                        });
                    }
                });
            }
        });

        professorClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
        res.status(200).json(professorClasses);

    } catch (err) {
        console.error("Get Professor Schedule Error:", err);
        res.status(500).json({ error: "Server error fetching professor schedule" });
    }
};

// TODO: Add controllers for GET / (all timetables), GET /:id, DELETE /:id (Admin only)