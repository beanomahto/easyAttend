const Location = require("../models/Location");

exports.createLocation = async (req, res) => {
  try {
    const { name, coordinates } = req.body;
    const location = new Location({ name, coordinates });
    await location.save();
    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ error: "Failed to create location" });
  }
};
