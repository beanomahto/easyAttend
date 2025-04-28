// controllers/protectedController.js

exports.getSomeData = (req, res) => {
    // Access user info attached by the authMiddleware
    const user = req.user;

    res.status(200).json({
        message: `Hello ${user.name}! This is protected data.`,
        userData: {
            id: user._id,
            email: user.email,
            name: user.name
            // Only include non-sensitive data
        }
    });
};

// Add more controller functions for other protected actions
exports.getAdminData = (req, res) => {
     res.status(200).json({
        message: `Hello ${req.user.name}! This is ADMIN-ONLY data.`,
        secretInfo: "Only admins should see this!",
        timestamp: Date.now()
    });
}