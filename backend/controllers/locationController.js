// controllers/locationController.js
const Location = require("../models/Location");

// Create Location (Requires Admin Role - protected in routes)
// exports.createLocation = async (req, res) => {
//     try {
//         const { name, building, coordinates, radiusMeters, trustedWifiBSSIDs } = req.body;

//         // Validate required fields
//         if (!name || !coordinates || typeof coordinates.lng !== 'number' || typeof coordinates.lat !== 'number' || !radiusMeters) {
//             return res.status(400).json({ message: "Missing/invalid fields: name, coordinates {lat, lng}, radiusMeters required." });
//         }

//         // Construct GeoJSON point [longitude, latitude]
//         const locationPoint = {
//             type: 'Point',
//             coordinates: [coordinates.lng, coordinates.lat]
//         };

//         const newLocation = new Location({
//             name,
//             building,
//             location: locationPoint,
//             radiusMeters,
//             trustedWifiBSSIDs: trustedWifiBSSIDs || []
//         });

//         await newLocation.save();
//         res.status(201).json(newLocation);

//     } catch (err) {
//         console.error("Create Location Error:", err);
//         if (err.name === "ValidationError") {
//             const messages = Object.values(err.errors).map((val) => val.message);
//             return res.status(400).json({ message: messages.join(". ") });
//         }
//         res.status(500).json({ error: "Failed to create location" });
//     }
// };

// Create Location with Polygon Geofence
exports.createLocation = async (req, res) => {
  try {
    const { name, building, polygonCoordinates, trustedWifiBSSIDs } = req.body;

    // Validate fields
    if (
      !name ||
      !Array.isArray(polygonCoordinates) ||
      polygonCoordinates.length < 4 ||
      JSON.stringify(polygonCoordinates[0]) !==
        JSON.stringify(polygonCoordinates[polygonCoordinates.length - 1])
    ) {
      return res.status(400).json({
        message:
          "Missing/invalid fields: 'name' and closed polygonCoordinates ([[lng, lat], ...]) with at least 4 points are required.",
      });
    }

    // Construct GeoJSON Polygon
    const geofence = {
      type: "Polygon",
      coordinates: [polygonCoordinates], // GeoJSON requires an array of LinearRings
    };

    const newLocation = new Location({
      name,
      building,
      geofence,
      trustedWifiBSSIDs: trustedWifiBSSIDs || [],
    });

    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (err) {
    console.error("Create Location Error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(". ") });
    }
    res.status(500).json({ error: "Failed to create location" });
  }
};

// Get All Locations (Can be protected or public depending on need)
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 }); // Sort by name
    res.status(200).json(locations);
  } catch (err) {
    console.error("Get Locations Error:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
};

// TODO: Add getById, update, delete controllers (likely admin protected)
