// controllers/userController.js
const User = require("../models/User");


// TODO: Add controllers for getUserById, updateUser, deleteUser (Admin protected)

// *** ADD this import if generateToken is in a utils file ***
const generateToken = require("../utils/generateToken"); // Adjust path if necessary



exports.getAllUsers = async (req, res) => {
  try {
    const { role, currentSemester, branch, _distinct } = req.query;
    const filter = {};

    if (role) {
      if (!["student", "professor", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified for filtering." });
      }
      filter.role = role;
    }
    if (currentSemester) {
      const semesterNumber = parseInt(currentSemester, 10);
      if (!isNaN(semesterNumber)) {
        filter.currentSemester = semesterNumber;
      } else {
        console.warn(`Invalid currentSemester query parameter: ${currentSemester}`);
      }
    }
    if (branch) {
      filter.branch = branch.toUpperCase(); // Standardize casing
    }

    if (_distinct && filter.role === "student") {
      if (_distinct === "currentSemester") {
        const distinctSemesters = await User.distinct("currentSemester", { role: "student" }).lean();
        const sortedSemesters = distinctSemesters.filter((s) => s != null).sort((a, b) => a - b);
        return res.status(200).json(sortedSemesters);
      }
      if (_distinct === "branch") {
        const distinctBranches = await User.distinct("branch", filter).lean();
        const sortedBranches = distinctBranches.filter((b) => b != null).sort();
        return res.status(200).json(sortedBranches);
      }
    }

    const users = await User.find(filter)
      .select("firstName lastName email role studentId facultyId department branch currentSemester section isActive _id createdAt")
      .sort({ lastName: 1, firstName: 1 });
    res.status(200).json({ data: users });
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// ...


// --- Helper Function for Common Registration Logic ---
// Helper: User Registration
// Helper: User Registration (Used by registerStudent and could be by registerProfessor)
async function handleRegistration(req, res, userData, roleSpecificData, role, deviceId) {
  try {
    let existingUser = await User.findOne({ email: userData.email });
    if (existingUser) return res.status(400).json({ message: "Email already in use." });

    if (role === "student" && roleSpecificData.studentId) {
      existingUser = await User.findOne({ studentId: roleSpecificData.studentId });
      if (existingUser) return res.status(400).json({ message: "Student ID already exists." });
    } else if (role === "professor" && roleSpecificData.facultyId) {
      existingUser = await User.findOne({ facultyId: roleSpecificData.facultyId });
      if (existingUser) return res.status(400).json({ message: "Faculty ID already exists." });
    }

    if (deviceId) {
      const deviceBoundUser = await User.findOne({ boundDeviceId: deviceId });
      if (deviceBoundUser) {
        console.warn(`Device ID ${deviceId} already bound to user ${deviceBoundUser.email}`);
        return res.status(400).json({ message: "This device is already linked to another account." });
      }
    }

    const newUserObject = {
      ...userData,
      ...roleSpecificData,
      role,
      boundDeviceId: deviceId,
    };

    const newUser = new User(newUserObject);
    await newUser.save();

    // --- WebSocket Emission AFTER saving newUser ---
    if (req.io) {
      try {
        const statsUpdate = {
          type: newUser.role === "student" ? "NEW_STUDENT" : "NEW_PROFESSOR",
          message: `${newUser.firstName} ${newUser.lastName} (${newUser.role}) just registered.`,
          time: newUser.createdAt,
        };
        req.io.emit("dashboardUpdate", statsUpdate);

        const count = await User.countDocuments({ role: newUser.role });
        req.io.emit("statsCountUpdate", {
          entity: newUser.role === "student" ? "students" : "professors",
          count,
        });
        console.log(`WebSocket emission successful for new ${role}.`);
      } catch (emitError) {
        console.error("WebSocket emit error during registration:", emitError);
      }
    }

    const token = generateToken(newUser._id, newUser.role);
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({ // Return the response so the caller can send it
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error(`${role} Registration Critical Error:`, error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") }); // Return
    }
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.boundDeviceId) {
        return res.status(400).json({ message: "This device is already linked to another account." }); // Return
      }
      return res.status(400).json({ // Return
        message: "Duplicate field value entered. Email, Student ID, or Faculty ID might already exist.",
      });
    }
    return res.status(500).json({ message: `Server error during ${role} registration.` }); // Return
  }
}

const handleLogin = async (req, res, expectedRole) => {
  const { email, password, deviceId } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password." });
  }
  try {
    const user = await User.findOne({ email }).select("+password +boundDeviceId");
    if (!user || !(await user.comparePassword(password)) || user.role !== expectedRole) {
      return res.status(401).json({ message: "Invalid credentials or role mismatch." });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is inactive. Please contact administrator." });
    }
    if (user.boundDeviceId) {
      if (user.boundDeviceId !== deviceId) {
        console.warn(`Login attempt from different device for ${user.email}. Stored: ${user.boundDeviceId}, Attempted: ${deviceId}`);
        return res.status(403).json({ message: "Login failed: Account is bound to a different device." });
      }
      console.log(`Device ID match successful for user ${user.email}`);
    } else if (deviceId) {
      try {
        console.log(`Binding device ${deviceId} to user ${user.email} on first login.`);
        const deviceAlreadyBound = await User.findOne({ boundDeviceId: deviceId });
        if (deviceAlreadyBound) {
          console.warn(`Login failed: Device ${deviceId} is already bound to user ${deviceAlreadyBound.email}`);
          return res.status(409).json({ message: "Login failed: This device is linked to a different account." });
        }
        user.boundDeviceId = deviceId;
        await user.save();
      } catch (saveError) {
        console.error(`Error saving boundDeviceId during login for user ${user.email}:`, saveError);
        if (saveError.code === 11000) {
          return res.status(409).json({ message: "Login failed: This device is linked to a different account." });
        }
        return res.status(500).json({ message: "Server error binding device during login." });
      }
    } else {
      console.warn(`Login occurred for user ${user.email} without device binding (no stored ID, no ID sent).`);
    }
    const token = generateToken(user._id, user.role);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error(`${expectedRole} Login Error:`, error);
    res.status(500).json({ message: `Server error during ${expectedRole} login.` });
  }
};

// --- Student Registration ---
exports.registerStudent = async (req, res) => {
  const { email, password, firstName, lastName, studentId, branch, currentSemester, section, deviceId } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "Email, password, first name, and last name are required." });
  }
  if (!studentId || !branch || !currentSemester || !section) {
    return res.status(400).json({ message: "Student ID, branch, current semester, and section are required for student registration." });
  }
  const coreData = { email, password, firstName, lastName };
  const studentData = { studentId, branch: branch.toUpperCase(), currentSemester: parseInt(currentSemester, 10), section: section.toUpperCase() };
  // Call the helper which will also send the response
  await handleRegistration(req, res, coreData, studentData, "student", deviceId);
};







exports.registerProfessor = async (req, res) => {
  const { email, password, firstName, lastName, facultyId, department, branch, deviceId } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "Email, password, first name, and last name are required." });
  }
  if (!facultyId || !department) {
    return res.status(400).json({ message: "Faculty ID and department are required for professor registration." });
  }
  const allowedProfessorBranches = ["ECE", "ME", "CE", "CSE", "IT", "GENERAL SCIENCE", "HUMANITIES", "OTHER"];
  if (branch && !allowedProfessorBranches.includes(branch.toUpperCase())) {
      return res.status(400).json({ message: "Invalid branch selected for professor." });
  }
  const coreData = { email, password, firstName, lastName };
  const roleSpecificData = { facultyId, department, branch: branch ? branch.toUpperCase() : null };
  // Call the helper which will also send the response
  await handleRegistration(req, res, coreData, roleSpecificData, "professor", deviceId);
};

// --- Student Login ---
exports.loginStudent = async (req, res) => {
  await handleLogin(req, res, "student");
};

// --- Professor Login ---
exports.loginProfessor = async (req, res) => {
  await handleLogin(req, res, "professor");
};

exports.getAllProfessorList = async (req, res) => {
  try {
    const professorList = await User.find({ role: "professor" }).sort({
      name: 1,
    }); // Sort by name
    res.status(200).json(professorList);
  } catch (err) {
    console.error("Get professor Error:", err);
    res.status(500).json({ error: "Failed to fetch professor list" });
  }
};

exports.getAllStudentList = async (req, res) => {
  try {
    const studentList = await User.find({ role: "student" }).sort({
      name: 1,
    }); // Sort by name
    res.status(200).json(studentList);
  } catch (err) {
    console.error("Get student Error:", err);
    res.status(500).json({ error: "Failed to fetch student list" });
  }
};

exports.getStudentSemesters = async () => {
  return getUsers({ role: "student", _distinct: "currentSemester" });
};

exports.getStudentBranchesBySemester = async (semester) => {
  return getUsers({
    role: "student",
    currentSemester: semester,
    _distinct: "branch",
  });
};
