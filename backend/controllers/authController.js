// controllers/authController.js
const User = require("../models/User"); // Use unified User model
const generateToken = require("../utils/generateToken");
// bcrypt is handled in the User model's pre-save hook

// Single Registration Endpoint
exports.register = async (req, res) => {
    const {
        email, password, firstName, lastName, role, // Core
        studentId, branch, currentSemester, section, // Student
        facultyId, department // Professor
        // No specific fields needed for admin beyond role currently
    } = req.body;

    // --- Basic Validation ---
    if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Email, password, first/last name, and role are required." });
    }
    if (!['student', 'professor', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified." });
    }

    // --- Role-Specific Validation ---
    let missingFields = [];
    if (role === 'student') {
        if (!studentId) missingFields.push('studentId');
        if (!branch) missingFields.push('branch');
        if (!currentSemester) missingFields.push('currentSemester');
        if (!section) missingFields.push('section'); // Section is now required
    } else if (role === 'professor') {
        if (!facultyId) missingFields.push('facultyId');
        if (!department) missingFields.push('department');
    }
    if (missingFields.length > 0) {
        return res.status(400).json({ message: `Missing required fields for role '${role}': ${missingFields.join(', ')}.` });
    }

    try {
        // --- Check for Existing User ---
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use." });
        }
        if (role === 'student' && studentId) {
            existingUser = await User.findOne({ studentId });
            if (existingUser) return res.status(400).json({ message: "Student ID already exists." });
        }
        if (role === 'professor' && facultyId) {
            existingUser = await User.findOne({ facultyId });
            if (existingUser) return res.status(400).json({ message: "Faculty ID already exists." });
        }

        // --- Create User Object ---
        const newUserObject = {
            email, password, firstName, lastName, role,
            ...(role === 'student' && { studentId, branch, currentSemester, section }),
            ...(role === 'professor' && { facultyId, department }),
        };

        const newUser = new User(newUserObject);
        await newUser.save(); // Password hashing happens here via pre-save hook

        // --- Generate Token ---
        const token = generateToken(newUser._id, newUser.role);

        // --- Prepare Response ---
        const userResponse = newUser.toObject(); // Convert to plain object
        delete userResponse.password; // Remove password from response

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: userResponse,
        });

    } catch (error) {
        console.error("Registration Error:", error);
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(". ") });
        }
         // Handle duplicate key errors (e.g., if unique checks fail despite pre-check)
        if (error.code === 11000) {
             return res.status(400).json({ message: "Duplicate field value entered. Email, Student ID, or Faculty ID might already exist." });
        }
        res.status(500).json({ message: "Server error during registration." });
    }
};

// Single Login Endpoint
exports.login = async (req, res) => {
    const { email, password } = req.body; // Don't need role from client

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password." });
    }

    try {
        // Find user by email, explicitly select password
        const user = await User.findOne({ email }).select('+password');

        // Check user existence and password correctness
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Check if user is active
         if (!user.isActive) {
             return res.status(401).json({ message: "Account is inactive. Please contact administrator." });
         }

        // Generate Token
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
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};