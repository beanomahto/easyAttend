// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Use the unified User model
require("dotenv").config();

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID from token payload, exclude password
        const currentUser = await User.findById(decoded.id).select('-password');

        if (!currentUser) {
            return res.status(401).json({ message: "User belonging to this token no longer exists" });
        }

        // Optional: Check if user is active
        if (!currentUser.isActive) {
             return res.status(401).json({ message: "User account is inactive." });
        }

        // Attach user to the request object
        req.user = currentUser;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.name, error.message);
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Not authorized, invalid token" });
        } else if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Not authorized, token expired" });
        } else {
            return res.status(401).json({ message: "Not authorized" });
        }
    }
};

// Middleware for restricting access based on role(s)
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Assumes 'protect' middleware has already run and attached req.user
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
};

module.exports = { protect, restrictTo };