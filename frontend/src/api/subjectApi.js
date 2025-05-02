import axiosInstance from './axiosConfig';

export const getAllSubjects = async () => {
    return await axiosInstance.get('/subjects');
};

export const createSubject = async (subjectData) => {
    // subjectData should be { subjectCode, name }
    return await axiosInstance.post('/subjects', subjectData);
};

// Add functions for getById, update, delete later
// export const getSubjectById = async (id) => { ... }
// export const updateSubject = async (id, subjectData) => { ... }
// export const deleteSubject = async (id) => { ... }