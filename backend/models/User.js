// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Use bcryptjs

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "Please provide a first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please provide a last name"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "professor", "admin"], // Use standard roles
      required: [true, "User role is required"],
    },
    isActive: { type: Boolean, default: true },

    // --- Student Specific ---
    studentId: { type: String, unique: true, sparse: true, trim: true },
    branch: { type: String, trim: true },
    currentSemester: { type: Number, min: 1, max: 8 },
    section: { type: String, trim: true },

    // --- Professor Specific ---
    facultyId: { type: String, unique: true, sparse: true, trim: true },
    department: { type: String, trim: true },

    // *** Device Binding Field ***
    boundDeviceId: {
      type: String,
      unique: true, // Important: Ensures one device ID isn't linked to multiple accounts
      sparse: true, // Allows multiple users to NOT have a device ID (null)
      select: false, // Prevent sending it back in normal user queries
    },

    // --- Admin might not need specific fields beyond role ---

    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password BEFORE saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
