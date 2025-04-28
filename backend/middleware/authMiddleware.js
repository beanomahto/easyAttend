// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const protect = async (req, res, next) => {
  let token;

  // 1) Check if Authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; // Extract token
  }
  // Allow token to be sent in cookies as well (optional)
  // else if (req.cookies.jwt) {
  //     token = req.cookies.jwt;
  // }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  try {
    // 2) Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user belonging to the token still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res
        .status(401)
        .json({ message: "User belonging to this token no longer exists" });
    }

    // 4) Optional: Check if user changed password after the token was issued
    // if (currentUser.changedPasswordAfter(decoded.iat)) { // Need to implement changedPasswordAfter method in User model
    //     return res.status(401).json({ message: 'User recently changed password. Please log in again.' });
    // }

    // Grant access to protected route
    // Attach user to the request object (excluding password)
    req.user = currentUser; // Now downstream routes can access req.user
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Not authorized, token expired" });
    } else {
      return res.status(401).json({ message: "Not authorized" });
    }
  }
};

module.exports = { protect };

// Optional: Add middleware for role-based access control if needed
// exports.restrictTo = (...roles) => {
//   return (req, res, next) => {
//     // roles is an array like ['admin', 'professor']
//     if (!roles.includes(req.user.role)) { // Assuming user model has a 'role' field
//       return res.status(403).json({ message: 'You do not have permission to perform this action' });
//     }
//     next();
//   };
// };
