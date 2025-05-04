// controllers/userController.js
const User = require("../models/User");

// Get users, optionally filtering by role
// exports.getAllUsers = async (req, res) => {
//   try {
//     const filter = {};
//     // Allow filtering by role via query parameter (e.g., /api/users?role=professor)
//     if (req.query.role) {
//       // Validate the role query parameter if necessary
//       if (!["student", "professor", "admin"].includes(req.query.role)) {
//         return res
//           .status(400)
//           .json({ message: "Invalid role specified for filtering." });
//       }
//       filter.role = req.query.role;
//     }

//     // Select only necessary fields, especially excluding password!
//     const users = await User.find(filter)
//       .select(
//         "firstName lastName email role studentId facultyId department branch currentSemester section isActive _id"
//       )
//       .sort({ lastName: 1, firstName: 1 }); // Sort for better UI presentation

//     res.status(200).json(users);
//   } catch (err) {
//     console.error("Get Users Error:", err);
//     res.status(500).json({ error: "Failed to fetch users" });
//   }
// };

// TODO: Add controllers for getUserById, updateUser, deleteUser (Admin protected)

// *** ADD this import if generateToken is in a utils file ***
const generateToken = require("../utils/generateToken"); // Adjust path if necessary

// === USER MANAGEMENT ===

// Get users, optionally filtering by role
exports.getAllUsers = async (req, res) => {
  try {
    const filter = {};
    // Allow filtering by role via query parameter (e.g., /api/users?role=professor)
    if (req.query.role) {
      // Validate the role query parameter if necessary
      if (!["student", "professor", "admin"].includes(req.query.role)) {
        return res
          .status(400)
          .json({ message: "Invalid role specified for filtering." });
      }
      filter.role = req.query.role;
    }

    // Select only necessary fields, especially excluding password!
    const users = await User.find(filter)
      .select(
        "firstName lastName email role studentId facultyId department branch currentSemester section isActive _id"
      )
      .sort({ lastName: 1, firstName: 1 }); // Sort for better UI presentation

    res.status(200).json(users);
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// TODO: Add controllers for getUserById, updateUser, deleteUser (Admin protected)

// === AUTHENTICATION LOGIC (Moved here as requested) ===

// --- Helper Function for Common Registration Logic ---
const handleRegistration = async (res, userData, roleSpecificData, role) => {
  try {
    // Check for existing email
    let existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // Check for role-specific ID collision
    if (role === "student" && roleSpecificData.studentId) {
      existingUser = await User.findOne({
        studentId: roleSpecificData.studentId,
      });
      if (existingUser)
        return res.status(400).json({ message: "Student ID already exists." });
    } else if (role === "professor" && roleSpecificData.facultyId) {
      existingUser = await User.findOne({
        facultyId: roleSpecificData.facultyId,
      });
      if (existingUser)
        return res.status(400).json({ message: "Faculty ID already exists." });
    }

    // Create User Object
    const newUserObject = {
      ...userData,
      ...roleSpecificData,
      role: role, // Set role explicitly
    };

    const newUser = new User(newUserObject);
    await newUser.save(); // Password hashing happens via pre-save hook

    // Generate Token - Requires generateToken utility
    const token = generateToken(newUser._id, newUser.role);

    // Prepare Response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } registered successfully`,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error(`${role} Registration Error:`, error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Duplicate field value entered. Email, Student ID, or Faculty ID might already exist.",
      });
    }
    res
      .status(500)
      .json({ message: `Server error during ${role} registration.` });
  }
};

// --- Helper Function for Common Login Logic ---
const handleLogin = async (req, res, expectedRole) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  try {
    // Find user by email, explicitly select password
    const user = await User.findOne({ email }).select("+password");

    // Check user existence, password correctness, AND expected role
    if (
      !user ||
      !(await user.comparePassword(password)) ||
      user.role !== expectedRole
    ) {
      // Give a generic message to avoid revealing which part (email, password, role) was wrong
      return res
        .status(401)
        .json({ message: "Invalid credentials or role mismatch." });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        message: "Account is inactive. Please contact administrator.",
      });
    }

    // Generate Token - Requires generateToken utility
    const token = generateToken(user._id, user.role);

    // Prepare Response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error(`${expectedRole} Login Error:`, error);
    res
      .status(500)
      .json({ message: `Server error during ${expectedRole} login.` });
  }
};

// --- Student Registration ---
exports.registerStudent = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName, // Core
    studentId,
    branch,
    currentSemester,
    section, // Student specific
  } = req.body;

  // Basic Validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Email, password, first name, and last name are required.",
    });
  }
  // Student Specific Validation
  if (!studentId || !branch || !currentSemester || !section) {
    return res.status(400).json({
      message:
        "Student ID, branch, current semester, and section are required for student registration.",
    });
  }

  const coreData = { email, password, firstName, lastName };
  const studentData = { studentId, branch, currentSemester, section };

  await handleRegistration(res, coreData, studentData, "student");
};

// --- Professor Registration ---
exports.registerProfessor = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName, // Core
    facultyId,
    department, // Professor specific
  } = req.body;

  // Basic Validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Email, password, first name, and last name are required.",
    });
  }
  // Professor Specific Validation
  if (!facultyId || !department) {
    return res.status(400).json({
      message:
        "Faculty ID and department are required for professor registration.",
    });
  }

  const coreData = { email, password, firstName, lastName };
  const professorData = { facultyId, department };

  await handleRegistration(res, coreData, professorData, "professor");
};

// --- Student Login ---
exports.loginStudent = async (req, res) => {
  await handleLogin(req, res, "student");
};

// --- Professor Login ---
exports.loginProfessor = async (req, res) => {
  await handleLogin(req, res, "professor");
};
