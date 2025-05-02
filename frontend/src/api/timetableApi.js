import axiosInstance from './axiosConfig';

export const upsertTimetable = async (timetableData) => {
    // timetableData should match the structure expected by the backend controller
    // { branch, semester, section, term, weeklySchedule }
    return await axiosInstance.put('/timetables', timetableData); // Using PUT as defined in controller
};

// Optional: Add functions to get all timetable configs, get by ID etc. later
// export const getAllTimetables = async (filters = {}) => { ... }