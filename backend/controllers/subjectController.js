// controllers/subjectController.js
const Subject = require("../models/Subject");

// Create Subject (Requires Admin Role - protected in routes)
exports.createSubject = async (req, res) => {
    try {
        const { subjectCode, name } = req.body;

        if (!subjectCode || !name) {
            return res.status(400).json({ message: "Subject code and name are required." });
        }

        const codeUpper = subjectCode.toUpperCase();
        const existing = await Subject.findOne({ subjectCode: codeUpper });
        if (existing) {
            return res.status(400).json({ message: `Subject code ${codeUpper} already exists.` });
        }

        const newSubject = new Subject({ subjectCode: codeUpper, name });
        await newSubject.save();
        res.status(201).json(newSubject);

    } catch (err) {
        console.error("Create Subject Error:", err);
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(". ") });
        }
         if (error.code === 11000) { // Handle duplicate key error during save
             return res.status(400).json({ message: `Subject code ${subjectCode.toUpperCase()} already exists.` });
        }
        res.status(500).json({ error: "Failed to create subject" });
    }
};

// Get All Subjects (Can be protected or public)
exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ subjectCode: 1 });
        res.status(200).json(subjects);
    } catch (err) {
        console.error("Get Subjects Error:", err);
        res.status(500).json({ error: "Failed to fetch subjects" });
    }
};

// TODO: Add getById, update, delete controllers (likely admin protected)