import axiosInstance from './axiosConfig';

export const getAllLocations = async () => {
    return await axiosInstance.get('/locations');
};

export const createLocation = async (locationData) => {
    // locationData structure from frontend form:
    // { name, building, latitude, longitude, radiusMeters, trustedWifiBSSIDs }
    // Transform to backend expected structure:
    const backendData = {
        name: locationData.name,
        building: locationData.building,
        coordinates: { // Backend expects { lat, lng } in request body for this endpoint
            lat: locationData.latitude,
            lng: locationData.longitude,
        },
        radiusMeters: locationData.radiusMeters,
        trustedWifiBSSIDs: locationData.trustedWifiBSSIDs,
    };
    return await axiosInstance.post('/locations', backendData);
};

// Add functions for getById, update, delete later