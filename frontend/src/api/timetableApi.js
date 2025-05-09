// import axiosInstance from './axiosConfig';

// export const upsertTimetable = async (timetableData) => {
//     // timetableData should match the structure expected by the backend controller
//     // { branch, semester, section, term, weeklySchedule }
//     return await axiosInstance.put('/timetables', timetableData); // Using PUT as defined in controller
// };

// Optional: Add functions to get all timetable configs, get by ID etc. later
// export const getAllTimetables = async (filters = {}) => { ... }


// src/api/timetableApi.js
import axiosInstance from './axiosConfig';

export const upsertTimetable = async (timetableData) => {
    return await axiosInstance.put('/timetables', timetableData);
};

/**
 * Fetches timetables, optionally filtering by parameters.
 * @param {object} filters - Query parameters (e.g., { isActive: true, term: 'FALL 2024' })
 * @returns Promise<AxiosResponse>
 */
export const getTimetables = async (filters = { isActive: true }) => { // Default to active
    return await axiosInstance.get('/timetables', { params: filters });
};

// Optional: Add functions to get by ID etc. later
// export const getTimetableById = async (id) => { ... }