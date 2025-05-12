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

    const filter = { branch, semester: parseInt(semester, 10), section: section.toUpperCase(), term: term.toUpperCase() };
    const update = { weeklySchedule, isActive, branch, semester: parseInt(semester, 10), section: section.toUpperCase(), term: term.toUpperCase() };
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
            "A timetable for this Branch, Semester, Section, and Term might already exist (unique index violation).",
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
    if (!req.user || req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Access denied. Student role required." });
    }
    const { branch, currentSemester: semester, section } = req.user;
    const term = req.query.term; 

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
    
    const timetable = await Timetable.findOne({
      branch,
      semester,
      section,
      term: term, 
      isActive: true,
    })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.subject`,
        select: "subjectCode name _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.professor`,
        select: "firstName lastName email _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.location`,
        select: "name building coordinates radiusMeters _id",
      });

    if (!timetable) {
      return res.status(200).json([]); 
    }

    const todaysSchedule = timetable.weeklySchedule?.[dayOfWeek]; 

    if (!todaysSchedule || todaysSchedule.length === 0) {
      return res.status(200).json([]); 
    }

    const todaysScheduleWithTerm = todaysSchedule.map((slot) => {
      const plainSlot =
        typeof slot.toObject === "function" ? slot.toObject() : { ...slot };
      return {
        ...plainSlot,
        term: timetable.term, 
      };
    });

    const todaysScheduleWithTermAndTimetableId = todaysSchedule.map((slot) => {
      const plainSlot = typeof slot.toObject === 'function' ? slot.toObject() : { ...slot };
      return {
          ...plainSlot,
          term: timetable.term,
          timetableId: timetable._id // <<< ADD THIS
      };
    });

    res.status(200).json(todaysScheduleWithTermAndTimetableId);
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

exports.getProfessorTodaySchedule = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "professor") {
      return res
        .status(403)
        .json({ message: "Access denied. Professor role required." });
    }
    const professorId = req.user._id;
    const term = req.query.term || getCurrentTerm(); 
    const dayOfWeek = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const query = {
      term: term,
      isActive: true,
      [`weeklySchedule.${dayOfWeek}.professor`]: professorId,
    };

    const timetables = await Timetable.find(query)
      .select(`branch semester section weeklySchedule.${dayOfWeek} term`) // Added term
      .populate({
        path: `weeklySchedule.${dayOfWeek}.subject`,
        select: "subjectCode name _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.professor`,
        select: "firstName lastName email _id",
      })
      .populate({
        path: `weeklySchedule.${dayOfWeek}.location`,
        select: "name building _id",
      })
      .lean(); 

    let professorClasses = [];
    timetables.forEach((tt) => {
      if (tt.weeklySchedule?.[dayOfWeek]) {
        tt.weeklySchedule[dayOfWeek].forEach((slot) => {
          if (slot.professor && slot.professor._id.equals(professorId)) {
            professorClasses.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: slot.subject, 
              location: slot.location, 
              professor: slot.professor, 
              branch: tt.branch,
              semester: tt.semester,
              section: tt.section,
              term: tt.term, // Use term from the timetable document itself
              timetableId: tt._id // Added timetableId
            });
          }
        });
      }
    });

    professorClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
    if (section) filter.section = section.toUpperCase(); 

    if (isActive === "true" || isActive === "false") {
      filter.isActive = isActive === "true";
    } else {
      filter.isActive = true; 
    }

    console.log("Fetching timetables with filter:", filter);

    let query = Timetable.find(filter);

    const daysToPopulate = [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    ];

    // Chain population for all days and all slot types (subject, professor, location)
    daysToPopulate.forEach((day) => {
      query = query
        .populate({
          path: `weeklySchedule.${day}.subject`,
          model: 'Subject', // Explicitly provide model name
          select: "subjectCode name _id",
        })
        .populate({
          path: `weeklySchedule.${day}.professor`,
          model: 'User', // Explicitly provide model name
          select: "firstName lastName email facultyId _id", // Added facultyId for completeness
        })
        .populate({
          path: `weeklySchedule.${day}.location`,
          model: 'Location', // Explicitly provide model name
          select: "name building _id",
        });
    });
    
    // Add sort and lean to the main query chain, then await it
    const timetables = await query.sort({ term: -1, branch: 1, semester: 1, section: 1 }).lean();

    res.status(200).json(timetables);
  } catch (err) {
    console.error("Get All Timetables Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch timetables", error: err.message });
  }
};