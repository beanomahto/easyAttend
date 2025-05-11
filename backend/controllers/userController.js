// // controllers/userController.js
// const User = require("../models/User");

// // Get users, optionally filtering by role
// // exports.getAllUsers = async (req, res) => {
// //   try {
// //     const filter = {};
// //     // Allow filtering by role via query parameter (e.g., /api/users?role=professor)
// //     if (req.query.role) {
// //       // Validate the role query parameter if necessary
// //       if (!["student", "professor", "admin"].includes(req.query.role)) {
// //         return res
// //           .status(400)
// //           .json({ message: "Invalid role specified for filtering." });
// //       }
// //       filter.role = req.query.role;
// //     }

// //     // Select only necessary fields, especially excluding password!
// //     const users = await User.find(filter)
// //       .select(
// //         "firstName lastName email role studentId facultyId department branch currentSemester section isActive _id"
// //       )
// //       .sort({ lastName: 1, firstName: 1 }); // Sort for better UI presentation

// //     res.status(200).json(users);
// //   } catch (err) {
// //     console.error("Get Users Error:", err);
// //     res.status(500).json({ error: "Failed to fetch users" });
// //   }
// // };

// // TODO: Add controllers for getUserById, updateUser, deleteUser (Admin protected)

// // *** ADD this import if generateToken is in a utils file ***
// const generateToken = require("../utils/generateToken"); // Adjust path if necessary

// // === USER MANAGEMENT ===

// // Get users, optionally filtering by role
// // exports.getAllUsers = async (req, res) => {
// //   try {
// //     const filter = {};
// //     // Allow filtering by role via query parameter (e.g., /api/users?role=professor)
// //     if (req.query.role) {
// //       // Validate the role query parameter if necessary
// //       if (!["student", "professor", "admin"].includes(req.query.role)) {
// //         return res
// //           .status(400)
// //           .json({ message: "Invalid role specified for filtering." });
// //       }
// //       filter.role = req.query.role;
// //     }

// //     // Select only necessary fields, especially excluding password!
// //     const users = await User.find(filter)
// //       .select(
// //         "firstName lastName email role studentId facultyId department branch currentSemester section isActive _id"
// //       )
// //       .sort({ lastName: 1, firstName: 1 }); // Sort for better UI presentation

// //     res.status(200).json(users);
// //   } catch (err) {
// //     console.error("Get Users Error:", err);
// //     res.status(500).json({ error: "Failed to fetch users" });
// //   }
// // };

// exports.getAllUsers = async (req, res) => {
//   try {
//     const { role, currentSemester, branch, _distinct /* any other params */ } =
//       req.query;
//     const filter = {};

//     if (role) {
//       if (!["student", "professor", "admin"].includes(role)) {
//         return res
//           .status(400)
//           .json({ message: "Invalid role specified for filtering." });
//       }
//       filter.role = role;
//     }

//     // --- BEGIN ADDED FILTERING LOGIC ---
//     if (currentSemester) {
//       // Add validation if necessary (e.g., is it a number?)
//       // Assuming currentSemester is stored as a Number in your User model
//       const semesterNumber = parseInt(currentSemester, 10);
//       if (!isNaN(semesterNumber)) {
//         filter.currentSemester = semesterNumber;
//       } else {
//         // Optional: return an error or ignore if semester is not a valid number
//         console.warn(
//           `Invalid currentSemester query parameter: ${currentSemester}`
//         );
//       }
//     }

//     if (branch) {
//       // Add validation if necessary (e.g., is it a non-empty string?)
//       filter.branch = branch;
//     }
//     // --- END ADDED FILTERING LOGIC ---

//     // --- BEGIN HANDLING _distinct FOR DROPDOWNS (if not using dedicated endpoints) ---
//     if (_distinct && filter.role === "student") {
//       if (_distinct === "currentSemester") {
//         // If currentSemester filter is also present, distinct should respect it.
//         // However, for general semester list, we usually don't filter by a specific semester.
//         // So, for distinct semesters, the `filter` passed to distinct should typically only be `{ role: 'student' }`
//         const distinctSemesters = await User.distinct("currentSemester", {
//           role: "student",
//         }).lean(); // .lean() for plain JS objects
//         // Filter out null/undefined and sort
//         const sortedSemesters = distinctSemesters
//           .filter((s) => s != null)
//           .sort((a, b) => a - b);
//         return res.status(200).json(sortedSemesters); // Send back a simple array
//       }
//       if (_distinct === "branch") {
//         // For distinct branches, we expect currentSemester to be in the filter
//         const distinctBranches = await User.distinct("branch", filter).lean();
//         const sortedBranches = distinctBranches.filter((b) => b != null).sort();
//         return res.status(200).json(sortedBranches); // Send back a simple array
//       }
//     }
//     // --- END HANDLING _distinct ---

//     console.log("Executing User.find with filter:", filter); // Good for debugging

//     const users = await User.find(filter)
//       .select(
//         "firstName lastName email role studentId facultyId department branch currentSemester section isActive _id createdAt" // Added createdAt for 'Registered' column
//       )
//       .sort({ lastName: 1, firstName: 1 });

//     // Important: Check your frontend's expectation for the response structure.
//     // If your frontend (e.g., in StudentListPage.js, `setStudents(response.data.data || response.data || [])`)
//     // sometimes expects `response.data.data`, then you should wrap the users array.
//     // For consistency, let's assume it might expect a `data` property for lists.
//     res.status(200).json({ data: users }); // Sending as { data: [...] }
//     // If you always send a direct array, change to res.status(200).json(users);
//     // and update frontend: setStudents(response.data || [])
//   } catch (err) {
//     console.error("Get Users Error:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch users", error: err.message }); // Send error message
//   }
// };

// // ...

// // The following two functions are NOT standard controller actions that would be directly hit by a route.
// // They were in your userApi.js as client-side helpers.
// // If you want to use the _distinct approach, the logic is now inside getAllUsers.
// // If you want dedicated endpoints, you'd create new controller functions and routes.

// // exports.getStudentSemesters = async () => { // This is not a controller function for a route
// //   // Logic for this is now handled by _distinct='currentSemester' in getAllUsers
// //   // Or, if you create a dedicated route /api/users/students/semesters,
// //   // you'd have a controller function like:
// //   // exports.fetchStudentSemesters = async (req, res) => { ... User.distinct logic ... }
// // };

// // exports.getStudentBranchesBySemester = async (semester) => { // Not a controller function
// //   // Logic for this is now handled by _distinct='branch' and currentSemester filter in getAllUsers
// //   // Or, a dedicated route /api/users/students/branches?semester=X
// // };

// // TODO: Add controllers for getUserById, updateUser, deleteUser (Admin protected)

// // === AUTHENTICATION LOGIC (Moved here as requested) ===

// // --- Helper Function for Common Registration Logic ---
// const handleRegistration = async (
//   res,
//   userData,
//   roleSpecificData,
//   role,
//   deviceId
// ) => {
//   try {
//     // Check for existing email
//     let existingUser = await User.findOne({ email: userData.email });
//     if (existingUser) {
//       return res.status(400).json({ message: "Email already in use." });
//     }

//     // Check for role-specific ID collision
//     if (role === "student" && roleSpecificData.studentId) {
//       existingUser = await User.findOne({
//         studentId: roleSpecificData.studentId,
//       });
//       if (existingUser)
//         return res.status(400).json({ message: "Student ID already exists." });
//     } else if (role === "professor" && roleSpecificData.facultyId) {
//       existingUser = await User.findOne({
//         facultyId: roleSpecificData.facultyId,
//       });
//       if (existingUser)
//         return res.status(400).json({ message: "Faculty ID already exists." });
//     }

//     // *** Optional: Check if device ID is already bound to ANY user ***
//     // This prevents one device registering multiple accounts if deviceId is unique
//     if (deviceId) {
//       const deviceBoundUser = await User.findOne({ boundDeviceId: deviceId });
//       if (deviceBoundUser) {
//         console.warn(
//           `Registration attempt failed: Device ID ${deviceId} already bound to user ${deviceBoundUser.email}`
//         );
//         return res.status(400).json({
//           message: "This device is already linked to another account.",
//         });
//       }
//     }

//     // Create User Object
//     const newUserObject = {
//       ...userData,
//       ...roleSpecificData,
//       role: role, // Set role explicitly
//       boundDeviceId: deviceId,
//     };

//     const newUser = new User(newUserObject);
//     await newUser.save(); // Password hashing happens via pre-save hook

//     // --- BEGIN WebSocket Emission ---
//     if (req.io) {
//       // Check if io is available
//       try {
//         const statsUpdate = {
//           type: newUser.role === "student" ? "NEW_STUDENT" : "NEW_PROFESSOR",
//           message: `${newUser.firstName} ${newUser.lastName} (${newUser.role}) just registered.`,
//           time: newUser.createdAt,
//         };
//         req.io.emit("dashboardUpdate", statsUpdate);

//         // Optionally, you can also emit updated counts directly
//         if (newUser.role === "student") {
//           const totalStudents = await User.countDocuments({ role: "student" });
//           req.io.emit("statsCountUpdate", {
//             entity: "students",
//             count: totalStudents,
//           });
//         } else if (newUser.role === "professor") {
//           const totalProfessors = await User.countDocuments({
//             role: "professor",
//           });
//           req.io.emit("statsCountUpdate", {
//             entity: "professors",
//             count: totalProfessors,
//           });
//         }
//       } catch (emitError) {
//         console.error("Error emitting WebSocket dashboard update:", emitError);
//       }
//     }
//     // --- END WebSocket Emission ---

//     // Generate Token - Requires generateToken utility
//     const token = generateToken(newUser._id, newUser.role);

//     // Prepare Response
//     const userResponse = newUser.toObject();
//     delete userResponse.password;

//     // delete userResponse.boundDeviceId; // *** Remove boundDeviceId from response for security ***

//     res.status(201).json({
//       message: `${
//         role.charAt(0).toUpperCase() + role.slice(1)
//       } registered successfully`,
//       token,
//       user: userResponse,
//     });
//   } catch (error) {
//     console.error(`${role} Registration Error:`, error);
//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((val) => val.message);
//       return res.status(400).json({ message: messages.join(". ") });
//     }
//     // Handle unique constraint violation specifically for device ID
//     if (
//       error.code === 11000 &&
//       error.keyPattern &&
//       error.keyPattern.boundDeviceId
//     ) {
//       return res
//         .status(400)
//         .json({ message: "This device is already linked to another account." });
//     }
//     if (error.code === 11000) {
//       // Handle other duplicate keys
//       return res.status(400).json({
//         message:
//           "Duplicate field value entered. Email, Student ID, or Faculty ID might already exist.",
//       });
//     }
//     res
//       .status(500)
//       .json({ message: `Server error during ${role} registration.` });
//   }
// };

// // --- Helper Function for Common Login Logic ---
// const handleLogin = async (req, res, expectedRole) => {
//   const { email, password, deviceId } = req.body;

//   if (!email || !password) {
//     return res
//       .status(400)
//       .json({ message: "Please provide email and password." });
//   }

//   try {
//     // Find user by email, explicitly select password
//     const user = await User.findOne({ email }).select(
//       "+password +boundDeviceId"
//     ); // *** Fetch user WITH boundDeviceId selected ***

//     // Check user existence, password correctness, AND expected role
//     if (
//       !user ||
//       !(await user.comparePassword(password)) ||
//       user.role !== expectedRole
//     ) {
//       // Give a generic message to avoid revealing which part (email, password, role) was wrong
//       return res
//         .status(401)
//         .json({ message: "Invalid credentials or role mismatch." });
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return res.status(401).json({
//         message: "Account is inactive. Please contact administrator.",
//       });
//     }

//     // --- Device Binding/Verification Logic ---
//     if (user.boundDeviceId) {
//       // User already has a bound device, verify it matches
//       if (user.boundDeviceId !== deviceId) {
//         console.warn(
//           `Login attempt from different device for ${user.email}. Stored: ${user.boundDeviceId}, Attempted: ${deviceId}`
//         );
//         return res.status(403).json({
//           message: "Login failed: Account is bound to a different device.",
//         });
//       }
//       // Device matches, proceed
//       console.log(`Device ID match successful for user ${user.email}`);
//     } else if (deviceId) {
//       // User has NO bound device yet, and app sent one -> BIND IT NOW (First Login)
//       try {
//         console.log(
//           `Binding device ${deviceId} to user ${user.email} on first login.`
//         );
//         // Optional: Check if this device ID is already used by ANOTHER user
//         const deviceAlreadyBound = await User.findOne({
//           boundDeviceId: deviceId,
//         });
//         if (deviceAlreadyBound) {
//           console.warn(
//             `Login failed: Device ${deviceId} is already bound to user ${deviceAlreadyBound.email}`
//           );
//           return res.status(409).json({
//             message:
//               "Login failed: This device is linked to a different account.",
//           }); // 409 Conflict
//         }
//         // Proceed with binding
//         user.boundDeviceId = deviceId;
//         await user.save(); // Save the newly bound device ID
//       } catch (saveError) {
//         console.error(
//           `Error saving boundDeviceId during login for user ${user.email}:`,
//           saveError
//         );
//         if (saveError.code === 11000) {
//           // Double check for race condition duplicate
//           return res.status(409).json({
//             message:
//               "Login failed: This device is linked to a different account.",
//           });
//         }
//         // If other save error, log it but potentially allow login? Risky. Better to fail.
//         return res
//           .status(500)
//           .json({ message: "Server error binding device during login." });
//       }
//     } else {
//       // User has no bound device, and app didn't send one (e.g., older app version?)
//       // Policy decision: Allow login but maybe warn? Or require device ID?
//       console.warn(
//         `Login occurred for user ${user.email} without device binding (no stored ID, no ID sent).`
//       );
//       // For now, allow login but device remains unbound.
//     }
//     // --- End Device Binding/Verification ---

//     // Generate Token - Requires generateToken utility
//     const token = generateToken(user._id, user.role);

//     // Prepare Response
//     const userResponse = user.toObject();
//     delete userResponse.password;
//     // delete userResponse.boundDeviceId; // Ensure it's not sent back

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user: userResponse,
//     });
//   } catch (error) {
//     console.error(`${expectedRole} Login Error:`, error);
//     res
//       .status(500)
//       .json({ message: `Server error during ${expectedRole} login.` });
//   }
// };

// // --- Student Registration ---
// exports.registerStudent = async (req, res) => {
//   const {
//     email,
//     password,
//     firstName,
//     lastName, // Core
//     studentId,
//     branch,
//     currentSemester,
//     section, // Student specific
//     deviceId,
//   } = req.body;

//   // Basic Validation
//   if (!email || !password || !firstName || !lastName) {
//     return res.status(400).json({
//       message: "Email, password, first name, and last name are required.",
//     });
//   }
//   // Student Specific Validation
//   if (!studentId || !branch || !currentSemester || !section) {
//     return res.status(400).json({
//       message:
//         "Student ID, branch, current semester, and section are required for student registration.",
//     });
//   }

//   const coreData = { email, password, firstName, lastName };
//   const studentData = { studentId, branch, currentSemester, section };

//   await handleRegistration(res, coreData, studentData, "student", deviceId);
// };

// // --- Professor Registration ---
// exports.registerProfessor = async (req, res) => {
//   const {
//     email,
//     password,
//     firstName,
//     lastName, // Core
//     facultyId,
//     department, // Professor specific
//     deviceId,
//   } = req.body;

//   // Basic Validation
//   if (!email || !password || !firstName || !lastName) {
//     return res.status(400).json({
//       message: "Email, password, first name, and last name are required.",
//     });
//   }
//   // Professor Specific Validation
//   if (!facultyId || !department) {
//     return res.status(400).json({
//       message:
//         "Faculty ID and department are required for professor registration.",
//     });
//   }

//   const coreData = { email, password, firstName, lastName };
//   const professorData = { facultyId, department };

//   await handleRegistration(res, coreData, professorData, "professor", deviceId);
// };

// // --- Student Login ---
// exports.loginStudent = async (req, res) => {
//   await handleLogin(req, res, "student");
// };

// // --- Professor Login ---
// exports.loginProfessor = async (req, res) => {
//   await handleLogin(req, res, "professor");
// };

// exports.getAllProfessorList = async (req, res) => {
//   try {
//     const professorList = await User.find({ role: "professor" }).sort({
//       name: 1,
//     }); // Sort by name
//     res.status(200).json(professorList);
//   } catch (err) {
//     console.error("Get professor Error:", err);
//     res.status(500).json({ error: "Failed to fetch professor list" });
//   }
// };

// exports.getAllStudentList = async (req, res) => {
//   try {
//     const studentList = await User.find({ role: "student" }).sort({
//       name: 1,
//     }); // Sort by name
//     res.status(200).json(studentList);
//   } catch (err) {
//     console.error("Get student Error:", err);
//     res.status(500).json({ error: "Failed to fetch student list" });
//   }
// };

// exports.getStudentSemesters = async () => {
//   return getUsers({ role: "student", _distinct: "currentSemester" });
// };

// exports.getStudentBranchesBySemester = async (semester) => {
//   return getUsers({
//     role: "student",
//     currentSemester: semester,
//     _distinct: "branch",
//   });
// };

// controllers/userController.js
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

exports.getAllUsers = async (req, res) => {
  try {
    const { role, currentSemester, branch, _distinct } = req.query;
    const filter = {};

    if (role) {
      if (!["student", "professor", "admin"].includes(role)) {
        return res
          .status(400)
          .json({ message: "Invalid role specified for filtering." });
      }
      filter.role = role;
    }

    if (currentSemester) {
      const semesterNumber = parseInt(currentSemester, 10);
      if (!isNaN(semesterNumber)) {
        filter.currentSemester = semesterNumber;
      } else {
        console.warn(
          `Invalid currentSemester query parameter: ${currentSemester}`
        );
      }
    }

    if (branch) {
      filter.branch = branch;
    }

    if (_distinct && filter.role === "student") {
      if (_distinct === "currentSemester") {
        const distinctSemesters = await User.distinct("currentSemester", {
          role: "student",
        }).lean();
        const sortedSemesters = distinctSemesters
          .filter((s) => s != null)
          .sort((a, b) => a - b);
        return res.status(200).json(sortedSemesters);
      }
      if (_distinct === "branch") {
        // Ensure currentSemester filter is applied if provided for distinct branches
        const distinctBranchesFilter = { ...filter };
        delete distinctBranchesFilter._distinct; // Remove _distinct from the filter for User.distinct

        const distinctBranches = await User.distinct(
          "branch",
          distinctBranchesFilter
        ).lean();
        const sortedBranches = distinctBranches.filter((b) => b != null).sort();
        return res.status(200).json(sortedBranches);
      }
    }

    console.log("Executing User.find with filter:", filter);

    const users = await User.find(filter)
      .select(
        "firstName lastName email role studentId facultyId department branch currentSemester section isActive _id createdAt"
      )
      .sort({ lastName: 1, firstName: 1 });

    res.status(200).json({ data: users });
  } catch (err) {
    console.error("Get Users Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

// === AUTHENTICATION LOGIC ===

// --- Helper Function for Common Registration Logic ---
const handleRegistration = async (
  req, // <<<<< ADD req HERE
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

    const newUserObject = {
      ...userData,
      ...roleSpecificData,
      role: role,
      boundDeviceId: deviceId,
    };

    const newUser = new User(newUserObject);
    await newUser.save();

    // --- BEGIN WebSocket Emission ---
    if (req.io) {
      // Now req is defined
      try {
        const statsUpdate = {
          type: newUser.role === "student" ? "NEW_STUDENT" : "NEW_PROFESSOR",
          message: `${newUser.firstName} ${newUser.lastName} (${newUser.role}) just registered.`,
          time: newUser.createdAt,
        };
        req.io.emit("dashboardUpdate", statsUpdate);

        if (newUser.role === "student") {
          const totalStudents = await User.countDocuments({ role: "student" });
          req.io.emit("statsCountUpdate", {
            entity: "students",
            count: totalStudents,
          });
        } else if (newUser.role === "professor") {
          const totalProfessors = await User.countDocuments({
            role: "professor",
          });
          req.io.emit("statsCountUpdate", {
            entity: "professors",
            count: totalProfessors,
          });
        }
      } catch (emitError) {
        console.error("Error emitting WebSocket dashboard update:", emitError);
      }
    }
    // --- END WebSocket Emission ---

    const token = generateToken(newUser._id, newUser.role);
    const userResponse = newUser.toObject();
    delete userResponse.password;
    // delete userResponse.boundDeviceId; // Consider if you want to send this back

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
    const user = await User.findOne({ email }).select(
      "+password +boundDeviceId"
    );

    if (
      !user ||
      !(await user.comparePassword(password)) ||
      user.role !== expectedRole
    ) {
      return res
        .status(401)
        .json({ message: "Invalid credentials or role mismatch." });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "Account is inactive. Please contact administrator.",
      });
    }

    if (user.boundDeviceId) {
      if (user.boundDeviceId !== deviceId) {
        console.warn(
          `Login attempt from different device for ${user.email}. Stored: ${user.boundDeviceId}, Attempted: ${deviceId}`
        );
        return res.status(403).json({
          message: "Login failed: Account is bound to a different device.",
        });
      }
      console.log(`Device ID match successful for user ${user.email}`);
    } else if (deviceId) {
      try {
        console.log(
          `Binding device ${deviceId} to user ${user.email} on first login.`
        );
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
          });
        }
        user.boundDeviceId = deviceId;
        await user.save();
      } catch (saveError) {
        console.error(
          `Error saving boundDeviceId during login for user ${user.email}:`,
          saveError
        );
        if (saveError.code === 11000) {
          return res.status(409).json({
            message:
              "Login failed: This device is linked to a different account.",
          });
        }
        return res
          .status(500)
          .json({ message: "Server error binding device during login." });
      }
    } else {
      console.warn(
        `Login occurred for user ${user.email} without device binding (no stored ID, no ID sent).`
      );
    }

    const token = generateToken(user._id, user.role);
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
    lastName,
    studentId,
    branch,
    currentSemester,
    section,
    deviceId,
  } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Email, password, first name, and last name are required.",
    });
  }
  if (!studentId || !branch || !currentSemester || !section) {
    return res.status(400).json({
      message:
        "Student ID, branch, current semester, and section are required for student registration.",
    });
  }

  const coreData = { email, password, firstName, lastName };
  const studentData = { studentId, branch, currentSemester, section };

  await handleRegistration(
    req,
    res,
    coreData,
    studentData,
    "student",
    deviceId
  ); // <<<< PASS req
};

// --- Professor Registration ---
exports.registerProfessor = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    facultyId,
    department,
    deviceId, // Assuming deviceId might be sent for professors too
  } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Email, password, first name, and last name are required.",
    });
  }
  if (!facultyId || !department) {
    return res.status(400).json({
      message:
        "Faculty ID and department are required for professor registration.",
    });
  }

  const coreData = { email, password, firstName, lastName };
  const professorData = { facultyId, department };

  await handleRegistration(
    req,
    res,
    coreData,
    professorData,
    "professor",
    deviceId
  ); // <<<< PASS req
};

// --- Student Login ---
exports.loginStudent = async (req, res) => {
  await handleLogin(req, res, "student");
};

// --- Professor Login ---
exports.loginProfessor = async (req, res) => {
  await handleLogin(req, res, "professor");
};

// --- LISTS ---
exports.getAllProfessorList = async (req, res) => {
  try {
    // For consistency with getAllUsers, let's return { data: [...] }
    const professorList = await User.find({ role: "professor" })
      .select("firstName lastName email facultyId department _id createdAt") // Select relevant fields
      .sort({ lastName: 1, firstName: 1 });
    res.status(200).json({ data: professorList });
  } catch (err) {
    console.error("Get professor Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch professor list", error: err.message });
  }
};

exports.getAllStudentList = async (req, res) => {
  try {
    // For consistency with getAllUsers, let's return { data: [...] }
    const studentList = await User.find({ role: "student" })
      .select(
        "firstName lastName email studentId branch currentSemester section _id createdAt"
      ) // Select relevant fields
      .sort({ lastName: 1, firstName: 1 });
    res.status(200).json({ data: studentList });
  } catch (err) {
    console.error("Get student Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch student list", error: err.message });
  }
};

// These are intended to be called by frontend API utility functions, not directly as route handlers
// They demonstrate how to use the main `getUsers` for specific dropdown data.
// The frontend `userApi.js` will call `getUsers` with these specific params.
// exports.getStudentSemesters = async () => {
//   // This is not a route handler. It's conceptual.
//   // The frontend API call would be: userApi.getUsers({ role: "student", _distinct: "currentSemester" });
//   // And that getUsers in userApi.js maps to the `exports.getAllUsers` controller.
// };

// exports.getStudentBranchesBySemester = async (semester) => {
//   // Conceptual. Frontend API call:
//   // userApi.getUsers({ role: "student", currentSemester: semester, _distinct: "branch" });
// };
