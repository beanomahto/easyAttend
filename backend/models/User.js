// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  // Using email as the unique identifier for login
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    // Basic email format validation
    match: [/\S+@\S+\.\S+/, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false, // IMPORTANT: Don't automatically return password field in queries
  },
  // Add other fields as needed (e.g., name, studentId, role)
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  registrationNumber: {
    type: String,
    required: [true, "Please provide a registration number"],
  },
  branch: {
    type: String,
  },
  role: {
    type: String,
    enum: ["student", "proffesor"],
    default: "student",
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

// --- Mongoose Middleware ---

// Hash password BEFORE saving a new user document
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Generate salt & hash password
    const salt = await bcrypt.genSalt(10); // 10 rounds is generally recommended
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass error to the next middleware/error handler
  }
});

// --- Mongoose Instance Method ---

// Method to compare candidate password with the user's hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // 'this.password' refers to the hashed password stored in the DB for this user
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
