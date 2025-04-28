// config/db.js
const mongoose = require("mongoose");
require("dotenv").config(); // To access environment variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6 doesn't require useCreateIndex or useFindAndModify
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
