// utils/generateToken.js (or authUtils.js)
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure JWT_SECRET is loaded

const generateToken = (userId, role) => {
    // Ensure secret and expiry are defined
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'; // Default expiry

    if (!secret) {
        console.error("FATAL ERROR: JWT_SECRET is not defined.");
        process.exit(1); // Exit if secret is missing
    }

    return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

module.exports = generateToken;