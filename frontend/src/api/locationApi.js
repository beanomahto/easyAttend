// import axiosInstance from './axiosConfig';

// export const getAllLocations = async () => {
//     return await axiosInstance.get('/locations');
// };

// export const createLocation = async (locationData) => {
//     // locationData structure from frontend form:
//     // { name, building, latitude, longitude, radiusMeters, trustedWifiBSSIDs }
//     // Transform to backend expected structure:
//     const backendData = {
//         name: locationData.name,
//         building: locationData.building,
//         coordinates: { // Backend expects { lat, lng } in request body for this endpoint
//             lat: locationData.latitude,
//             lng: locationData.longitude,
//         },
//         radiusMeters: locationData.radiusMeters,
//         trustedWifiBSSIDs: locationData.trustedWifiBSSIDs,
//     };
//     return await axiosInstance.post('/locations', backendData);
// };

// // Add functions for getById, update, delete later

import axiosInstance from "./axiosConfig";

export const getAllLocations = async () => {
  return await axiosInstance.get("/locations");
};

export const createLocation = async (locationData) => {
  // NEW locationData structure expected from the frontend form:
  // {
  //   name: "string",
  //   building: "string",
  //   polygonCoordinates: [[lng, lat], [lng, lat], ...], // Array of [longitude, latitude] pairs
  //   trustedWifiBSSIDs: ["string", ...]
  // }

  // The backend controller `createLocation` expects:
  // req.body.name
  // req.body.building
  // req.body.polygonCoordinates (this should be the array of [lng, lat] pairs)
  // req.body.trustedWifiBSSIDs

  // Construct the data payload for the backend
  const backendData = {
    name: locationData.name,
    building: locationData.building,
    polygonCoordinates: locationData.polygonCoordinates, // Pass the array of [lng, lat] pairs directly
    trustedWifiBSSIDs: locationData.trustedWifiBSSIDs || [], // Ensure it's an array, even if empty
  };

  // Basic validation (can be more robust in the form component)
  if (
    !backendData.name ||
    !Array.isArray(backendData.polygonCoordinates) ||
    backendData.polygonCoordinates.length < 4
  ) {
    // This basic check should ideally be in the form component before calling the API
    // but can be a safeguard here too.
    // The backend will perform more thorough GeoJSON validation.
    return Promise.reject(
      new Error(
        "Invalid location data: Name and at least 4 polygon points are required."
      )
    );
  }
  // Ensure the polygon is closed (first and last points are the same)
  // This check is also important and should be handled by the input mechanism (e.g., map drawing tool or form validation)
  const firstPoint = JSON.stringify(backendData.polygonCoordinates[0]);
  const lastPoint = JSON.stringify(
    backendData.polygonCoordinates[backendData.polygonCoordinates.length - 1]
  );
  if (firstPoint !== lastPoint) {
    // Again, ideally caught by the form/UI.
    return Promise.reject(
      new Error(
        "Invalid location data: Polygon must be closed (first and last coordinates must match)."
      )
    );
  }

  return await axiosInstance.post("/locations", backendData);
};

// TODO: Add functions for getById, update, delete later
// When implementing `updateLocation`, it will follow a similar pattern,
// sending `polygonCoordinates` if the geofence is being updated.
