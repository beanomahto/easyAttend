import axiosInstance from "./axiosConfig";

export const getAllProfessorList = async () => {
  return await axiosInstance.get("/professors");
};

export const createProfessor = async (professorData) => {
  // subjectData should be { subjectCode, name }
  return await axiosInstance.post("/professors", professorData);
};

// Add functions for getById, update, delete later
// export const getSubjectById = async (id) => { ... }
// export const updateSubject = async (id, subjectData) => { ... }
// export const deleteSubject = async (id) => { ... }
