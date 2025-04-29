const Subject = require("../models/Subject");

exports.createSubject = async (req, res) => {
  try {
    const { code, name } = req.body;
    const newSubject = new Subject({ code, name });
    await newSubject.save();
    res.status(201).json(newSubject);
  } catch (err) {
    res.status(500).json({ error: "Failed to create subject" });
  }
};
