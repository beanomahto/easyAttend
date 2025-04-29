const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Room 101"
  building: { type: String }, // e.g., "Main Block"
  coordinates: {
    lat: Number,
    lng: Number,
  },
});

module.exports = mongoose.model("Location", locationSchema);
