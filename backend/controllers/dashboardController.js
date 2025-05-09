// controllers/dashboardController.js
const User = require("../models/User");
const Subject = require("../models/Subject"); // Assuming you have a Subject model
const Location = require("../models/Location"); // Assuming you have a Location model
// Add other models if you need more stats

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalProfessors = await User.countDocuments({ role: "professor" });
    const totalSubjects = await Subject.countDocuments();
    const totalLocations = await Location.countDocuments();
    // Add more counts as needed

    // For "Recent Activity", you might query a log collection or recent user registrations
    // For simplicity, we'll handle dynamic "Recent Activity" primarily via WebSockets on the client
    // or you could fetch the last N new users here.
    const recentUsers = await User.find({})
                                  .sort({ createdAt: -1 })
                                  .limit(5) // Get last 5 users
                                  .select('firstName lastName role createdAt');


    res.status(200).json({
      totalStudents,
      totalProfessors,
      totalSubjects,
      totalLocations,
      recentActivity: recentUsers.map(u => ({
        message: `${u.firstName} ${u.lastName} (${u.role}) registered.`,
        time: u.createdAt
      })),
      // Add more stats here
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
};