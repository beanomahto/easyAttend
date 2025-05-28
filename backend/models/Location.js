// models/Location.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// const locationSchema = new Schema({
//     name: { type: String, required: true, trim: true },
//     building: { type: String, trim: true },
//     location: { // Use GeoJSON Point structure
//         type: {
//             type: String,
//             enum: ['Point'],
//             required: true,
//             default: 'Point'
//         },
//         coordinates: { // [longitude, latitude] order
//             type: [Number],
//             required: [true, "Coordinates [longitude, latitude] are required"],
//             validate: {
//                 validator: function(coords) {
//                     // Basic validation for Lon/Lat format
//                     return Array.isArray(coords) && coords.length === 2 &&
//                            typeof coords[0] === 'number' && typeof coords[1] === 'number' &&
//                            coords[0] >= -180 && coords[0] <= 180 && // Longitude bounds
//                            coords[1] >= -90 && coords[1] <= 90;   // Latitude bounds
//                 },
//                 message: props => `${props.value} is not a valid longitude/latitude pair.`
//             }
//         }
//     },
//     radiusMeters: { type: Number, required: true, default: 30 }, // Separate radius field
//     trustedWifiBSSIDs: [{ type: String }], // Optional: For Wi-Fi validation
// }, { timestamps: true });

// // Create 2dsphere index for efficient geospatial queries
// locationSchema.index({ location: '2dsphere' });

// module.exports = mongoose.model('Location', locationSchema);

const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    building: { type: String, trim: true },
    geofence: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
        default: "Polygon",
      },
      coordinates: {
        type: [[[Number]]], // 3-level array: [[[lng, lat], [lng, lat], ...]]
        required: true,
        validate: {
          validator: function (coords) {
            // Must be a single polygon with at least 4 points (first === last)
            return (
              Array.isArray(coords) &&
              coords.length === 1 &&
              coords[0].length >= 4 &&
              coords[0][0][0] === coords[0][coords[0].length - 1][0] &&
              coords[0][0][1] === coords[0][coords[0].length - 1][1]
            );
          },
          message:
            "Polygon must have at least 4 points and be closed (first === last)",
        },
      },
    },
    trustedWifiBSSIDs: [{ type: String }],
  },
  { timestamps: true }
);

// Create 2dsphere index for efficient spatial queries
locationSchema.index({ geofence: "2dsphere" });

module.exports = mongoose.model("Location", locationSchema);
