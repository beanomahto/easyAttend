const Professor = require("../models/Professor");

exports.createProfessor = async (req, res) => {
  try {
    const { name, email, department } = req.body;
    const professor = new Professor({ name, email, department });
    await professor.save();
    res.status(201).json(professor);
  } catch (err) {
    res.status(500).json({ error: "Failed to create professor" });
  }
};
