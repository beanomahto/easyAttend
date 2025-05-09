// controllers/timetableController.js
const Timetable = require("../models/Timetable");
const mongoose = require("mongoose");
const User = require("../models/User"); // Need User model for validation checks

// Helper (consider moving to a config or util file)
function getCurrentTerm() {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  return month >= 7 && month <= 11 ? `FALL ${year}` : `SPRING ${year}`;
}

// --- Create/Update Timetable (Admin Task) ---
// Using PUT for upsert logic: create if not exists, update if exists
exports.upsertTimetable = async (req, res) => {
  try {
    const {
      branch,
      semester,
      section,
      term,
      weeklySchedule,
      isActive = true,
    } = req.body;

    // --- Basic Validation ---
    if (
      !branch ||
      !semester ||
      !term ||
      !weeklySchedule ||
      typeof weeklySchedule !== "object"
    ) {
      return res.status(400).json({
        message:
          "Missing/invalid fields: branch, semester, term, weeklySchedule (must be object).",
      });
    }

    // --- Deep Validation of weeklySchedule (Example for one slot) ---
    // It's good practice to validate ObjectIds and existence of referenced docs
    // --- Deep Validation of weeklySchedule (Example for one slot) ---
    let validationError = null;
    for (const day of Object.keys(weeklySchedule)) {
      if (!Timetable.schema.path(`weeklySchedule.${day}`)) {
        console.warn(`Received schedule data for invalid day: ${day}`);
        continue;
      }
      if (!Array.isArray(weeklySchedule[day])) continue;
      for (const slot of weeklySchedule[day]) {
        if (!slot || typeof slot !== "object") {
          validationError = `Invalid slot format found in schedule for ${day}.`;
          break;
        }
        if (
          !slot.startTime ||
          !slot.endTime ||
          !slot.subject ||
          !slot.professor ||
          !slot.location
        ) {
          validationError = `Slot missing required fields (startTime, endTime, subject, professor, location) for ${day}.`;
          break;
        }
        if (
          !mongoose.Types.ObjectId.isValid(slot.subject) ||
          !mongoose.Types.ObjectId.isValid(slot.professor) ||
          !mongoose.Types.ObjectId.isValid(slot.location)
        ) {
          validationError = `Invalid ObjectId found in schedule for ${day} at ${slot.startTime}.`;
          break;
        }
      }
      if (validationError) break;
    }
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    // --- End Validation ---

    const filter = { branch, semester, section: section.toUpperCase(), term }; // Ensure section format consistency
    const update = { weeklySchedule, isActive };
    const options = {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    };

    const updatedTimetable = await Timetable.findOneAndUpdate(
      filter,
      update,
      options
    );

    res.status(200).json(updatedTimetable);
  } catch (err) {
    console.error("Upsert Timetable Error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          message:
            "A timetable for this Branch, Semester, Section, and Term might already exist.",
        });
    }
    res
      .status(500)
      .json({
        message: "Failed to create or update timetable",
        error: err.message,
      });
  }
};

exports.getStudentTodaySchedule = async (req, res) => {
  try {
    console.log(req.user);

    if (!req.user || req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Access denied. Student role required." });
    }
    const { branch, currentSemester: semester, section } = req.user;
    const term = req.query.term; // Get term from query parameter

    if (!term) {
      console.warn(
        "[getStudentTodaySchedule] Term query parameter is missing."
      );
      return res
        .status(400)
        .json({
          message:
            "Term query parameter is required (e.g., ?term=FALL%202024).",
        });
    }

    if (!branch || !semester || !section) {
      console.warn(
        `[getStudentTodaySchedule] Student details incomplete: Branch=${branch}, Semester=${semester}, Section=${section}`
      );
      return res.status(400).json({
        message:
          "Student details incomplete (branch, semester, section). Cannot fetch schedule.",
      });
    }

    const serverNow = new Date();
    const dayOfWeek = serverNow.toLocaleDateString("en-US", {
      weekday: "long",
    });
    console.log(
      `[getStudentTodaySchedule] Server Time: ${serverNow.toISOString()}, Calculated Day: ${dayOfWeek}`
    );

    console.log(
      `Fetching timetable for: Branch=${branch}, Semester=${semester}, Section=${section}, Term=${term}, Day=${dayOfWeek}`
    );

    const timetable = await Timetable.findOne({
      branch,
      semester,
      section,
      term: term, // Use term from query
      isActive: true,
    })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.subject`,
        // *** FIXED: Include _id ***
        select: "subjectCode name _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.professor`,
        // *** FIXED: Include _id ***
        select: "firstName lastName email _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.location`,
        // *** FIXED: Include _id ***
        select: "name building _id",
      });

    if (!timetable) {
      console.log(
        `No matching timetable found for: Branch=${branch}, Sem=${semester}, Sec=${section}, Term=${term}`
      );
      return res.status(200).json([]); // No timetable found
    }

    console.log(
      `Timetable found (ID: ${timetable._id}). Checking schedule for ${dayOfWeek}.`
    );
    const todaysSchedule = timetable.weeklySchedule?.[dayOfWeek]; // Use optional chaining

    if (!todaysSchedule || todaysSchedule.length === 0) {
      console.log(`No classes scheduled in timetable for ${dayOfWeek}.`);
      return res.status(200).json([]); // No classes for this specific day
    }

    // --- Modification: Add 'term' to each slot object ---
    // *** FIXED: Use correct variable name 'todaysSchedule' ***
    const todaysScheduleWithTerm = todaysSchedule.map((slot) => {
      // Convert Mongoose subdocument to plain object if needed
      const plainSlot =
        typeof slot.toObject === "function" ? slot.toObject() : { ...slot };
      return {
        ...plainSlot,
        term: timetable.term, // Add the term from the parent document
      };
    });
    // --- End Modification ---

    console.log(
      `[getStudentTodaySchedule] Responding with ${todaysScheduleWithTerm.length} classes for ${dayOfWeek}.`
    );
    // *** FIXED: Send the modified array with the term included ***
    res.status(200).json(todaysScheduleWithTerm);
  } catch (err) {
    console.error("[getStudentTodaySchedule] Error:", err);
    res
      .status(500)
      .json({
        message: "Server error fetching student schedule",
        error: err.message,
      });
  }
};

// --- Get Today's Schedule for Logged-in Professor ---
// --- Get Today's Schedule for Logged-in Professor ---
exports.getProfessorTodaySchedule = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "professor") {
      return res
        .status(403)
        .json({ message: "Access denied. Professor role required." });
    }
    const professorId = req.user._id;
    const term = req.query.term || getCurrentTerm(); // Allow query param or fallback
    const dayOfWeek = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    console.log(
      `Fetching professor schedule for ProfID=${professorId}, Term=${term}, Day=${dayOfWeek}`
    );

    const query = {
      term: term,
      isActive: true,
      [`weeklySchedule.${dayOfWeek}.professor`]: professorId,
    };

    const timetables = await Timetable.find(query)
      .select(`branch semester section weeklySchedule.${dayOfWeek}`)
      .populate({
        path: `weeklySchedule.${dayOfWeek}.subject`,
        // *** FIXED: Include _id ***
        select: "subjectCode name _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.professor`, // Populate professor to get their ID easily if needed later
        // *** FIXED: Include _id (though we query by it, good practice) ***
        select: "firstName lastName email _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.location`,
        // *** FIXED: Include _id ***
        select: "name building _id",
      })
      .lean(); // Use lean for performance

    let professorClasses = [];
    timetables.forEach((tt) => {
      if (tt.weeklySchedule?.[dayOfWeek]) {
        tt.weeklySchedule[dayOfWeek].forEach((slot) => {
          // This check might be redundant because of the initial query, but safe
          if (slot.professor && slot.professor._id.equals(professorId)) {
            // Compare IDs after population
            professorClasses.push({
              // Pass plain slot object properties
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: slot.subject, // Includes _id, subjectCode, name
              location: slot.location, // Includes _id, name, building
              professor: slot.professor, // Includes _id, firstName, lastName, email
              // Add context
              branch: tt.branch,
              semester: tt.semester,
              section: tt.section,
              term: term, // Add term
              // Include IDs directly if preferred by client (redundant with nested objects)
              // subjectId: slot.subject?._id,
              // locationId: slot.location?._id,
              // professorId: slot.professor?._id
            });
          }
        });
      }
    });

    professorClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    console.log(
      `Found ${professorClasses.length} classes for professor ${professorId} on ${dayOfWeek}.`
    );
    res.status(200).json(professorClasses);
  } catch (err) {
    console.error("Get Professor Schedule Error:", err);
    res
      .status(500)
      .json({
        message: "Server error fetching professor schedule.",
        error: err.message,
      });
  }
};

// TODO: Add controllers for GET / (all timetables), GET /:id, DELETE /:id (Admin only)

exports.getAllTimetables = async (req, res) => {
  try {
    const { term, branch, semester, section, isActive } = req.query;
    const filter = {};

    if (term) filter.term = term;
    if (branch) filter.branch = branch;
    if (semester) {
      const semNum = parseInt(semester, 10);
      if (!isNaN(semNum)) filter.semester = semNum;
    }
    if (section) filter.section = section.toUpperCase(); // Standardize section

    // Default to active=true if isActive is not specified or invalid
    if (isActive === "true" || isActive === "false") {
      filter.isActive = isActive === "true";
    } else {
      filter.isActive = true; // Default to only active timetables
    }

    console.log("Fetching timetables with filter:", filter);

    // ... inside getAllTimetables ...
    let query = Timetable.find(filter);

    const daysToPopulate = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    daysToPopulate.forEach((day) => {
      query = query
        .populate({
          path: `weeklySchedule.${day}.subject`,
          select: "subjectCode name _id", // Add _id
        })
        .populate({
          path: `weeklySchedule.${day}.professor`,
          select: "firstName lastName email _id", // Add _id
        })
        .populate({
          path: `weeklySchedule.${day}.location`,
          select: "name building _id", // Add _id
        });
    });

    

    const timetables = await Timetable.find(filter)
      .populate("weeklySchedule.Monday.subject", "subjectCode name") // Example of populating if needed for list view
      .populate("weeklySchedule.Monday.professor", "firstName lastName") // Rarely needed for list, but shows how
      .sort({ term: -1, branch: 1, semester: 1, section: 1 })
      .lean();

    res.status(200).json(timetables); // Send as direct array
  } catch (err) {
    console.error("Get All Timetables Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch timetables", error: err.message });
  }
};
