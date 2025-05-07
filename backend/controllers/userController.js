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
const handleRegistration = async (
  res,
  userData,
  roleSpecificData,
  role,
  deviceId
) => {
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

    // *** Optional: Check if device ID is already bound to ANY user ***
    // This prevents one device registering multiple accounts if deviceId is unique
    if (deviceId) {
      const deviceBoundUser = await User.findOne({ boundDeviceId: deviceId });
      if (deviceBoundUser) {
        console.warn(
          `Registration attempt failed: Device ID ${deviceId} already bound to user ${deviceBoundUser.email}`
        );
        return res.status(400).json({
          message: "This device is already linked to another account.",
        });
      }
    }

    // Create User Object
    const newUserObject = {
      ...userData,
      ...roleSpecificData,
      role: role, // Set role explicitly
      boundDeviceId: deviceId,
    };

    const newUser = new User(newUserObject);
    await newUser.save(); // Password hashing happens via pre-save hook

    // Generate Token - Requires generateToken utility
    const token = generateToken(newUser._id, newUser.role);

    // Prepare Response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // delete userResponse.boundDeviceId; // *** Remove boundDeviceId from response for security ***

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
    // Handle unique constraint violation specifically for device ID
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.boundDeviceId
    ) {
      return res
        .status(400)
        .json({ message: "This device is already linked to another account." });
    }
    if (error.code === 11000) {
      // Handle other duplicate keys
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
  const { email, password, deviceId } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  try {
    // Find user by email, explicitly select password
    const user = await User.findOne({ email }).select(
      "+password +boundDeviceId"
    ); // *** Fetch user WITH boundDeviceId selected ***

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

    // --- Device Binding/Verification Logic ---
    if (user.boundDeviceId) {
      // User already has a bound device, verify it matches
      if (user.boundDeviceId !== deviceId) {
        console.warn(
          `Login attempt from different device for ${user.email}. Stored: ${user.boundDeviceId}, Attempted: ${deviceId}`
        );
        return res.status(403).json({
          message: "Login failed: Account is bound to a different device.",
        });
      }
      // Device matches, proceed
      console.log(`Device ID match successful for user ${user.email}`);
    } else if (deviceId) {
      // User has NO bound device yet, and app sent one -> BIND IT NOW (First Login)
      try {
        console.log(
          `Binding device ${deviceId} to user ${user.email} on first login.`
        );
        // Optional: Check if this device ID is already used by ANOTHER user
        const deviceAlreadyBound = await User.findOne({
          boundDeviceId: deviceId,
        });
        if (deviceAlreadyBound) {
          console.warn(
            `Login failed: Device ${deviceId} is already bound to user ${deviceAlreadyBound.email}`
          );
          return res.status(409).json({
            message:
              "Login failed: This device is linked to a different account.",
          }); // 409 Conflict
        }
        // Proceed with binding
        user.boundDeviceId = deviceId;
        await user.save(); // Save the newly bound device ID
      } catch (saveError) {
        console.error(
          `Error saving boundDeviceId during login for user ${user.email}:`,
          saveError
        );
        if (saveError.code === 11000) {
          // Double check for race condition duplicate
          return res.status(409).json({
            message:
              "Login failed: This device is linked to a different account.",
          });
        }
        // If other save error, log it but potentially allow login? Risky. Better to fail.
        return res
          .status(500)
          .json({ message: "Server error binding device during login." });
      }
    } else {
      // User has no bound device, and app didn't send one (e.g., older app version?)
      // Policy decision: Allow login but maybe warn? Or require device ID?
      console.warn(
        `Login occurred for user ${user.email} without device binding (no stored ID, no ID sent).`
      );
      // For now, allow login but device remains unbound.
    }
    // --- End Device Binding/Verification ---

    // Generate Token - Requires generateToken utility
    const token = generateToken(user._id, user.role);

    // Prepare Response
    const userResponse = user.toObject();
    delete userResponse.password;
    // delete userResponse.boundDeviceId; // Ensure it's not sent back

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
    deviceId,
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

  await handleRegistration(res, coreData, studentData, "student", deviceId);
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
    deviceId,
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

  await handleRegistration(res, coreData, professorData, "professor", deviceId);
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
