// controllers/userController.js
const User = require('../models/User');

// Get users, optionally filtering by role
exports.getAllUsers = async (req, res) => {
    try {
        const filter = {};
        // Allow filtering by role via query parameter (e.g., /api/users?role=professor)
        if (req.query.role) {
            // Validate the role query parameter if necessary
            if (!['student', 'professor', 'admin'].includes(req.query.role)) {
                 return res.status(400).json({ message: "Invalid role specified for filtering." });
            }
            filter.role = req.query.role;
        }

        // Select only necessary fields, especially excluding password!
        const users = await User.find(filter).select(
            'firstName lastName email role studentId facultyId department branch currentSemester section isActive _id'
        ).sort({ lastName: 1, firstName: 1 }); // Sort for better UI presentation

        res.status(200).json(users);

    } catch (err) {
        console.error("Get Users Error:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// TODO: Add controllers for getUserById, updateUser, deleteUser (Admin protected)