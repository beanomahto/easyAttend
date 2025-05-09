// // // src/api/userApi.js
// // import axiosInstance from './axiosConfig';

// // /**
// //  * Fetches users, optionally filtering by parameters.
// //  * @param {object} params - Query parameters (e.g., { role: 'professor' })
// //  * @returns Promise<AxiosResponse>
// //  */
// // export const getUsers = async (params = {}) => {
// //     return await axiosInstance.get('/users', { params });
// // };

// // // Add other user-related API functions later (getById, update, etc.)

// // export const getAllStudentList = async () => {
// //   return await axiosInstance.get("/users/students");
// // };




// // src/api/userApi.js
// import axiosInstance from './axiosConfig';

// /**
//  * Fetches users, optionally filtering by parameters.
//  * @param {object} params - Query parameters (e.g., { role: 'professor' })
//  * @returns Promise<AxiosResponse>
//  */
// export const getUsers = async (params = {}) => {
//     return await axiosInstance.get('/users', { params });
// };

// // --- Functions for the simpler "select any student" list ---
// export const getAllStudentList = async () => {
//   // This endpoint /users/students should ideally return all users with role: 'student'
//   return await axiosInstance.get("/users/students");
// };

// // --- Suggested new functions for NESTED DROPDOWN Student List ---

// /**
//  * Fetches distinct semesters for students.
//  * Your backend needs to support this. It could be a specific endpoint
//  * or your /users endpoint could handle a 'distinct' query parameter.
//  */
// export const getStudentSemesters = async () => {
//     // Option 1: Using a dedicated endpoint (Recommended for clarity if backend supports it)
//     // return await axiosInstance.get('/users/students/semesters');

//     // Option 2: If your /users endpoint can handle distinct queries (example)
//     // The backend would need to interpret '_distinct' or a similar param.
//     // return getUsers({ role: 'student', _distinct: 'currentSemester' });

//     // For this example, let's assume a dedicated endpoint or a specific query the backend understands:
//     // This is a placeholder; you'll need to implement the backend for this.
//     // For mock purposes, if you had all users, you'd filter and get unique values.
//     // This example simulates what a backend might return for distinct semesters of students.
//     // Replace with your actual API call.
//     const response = await getUsers({ role: 'student' }); // Get all students
//     const students = response.data.data || response.data;
//     if (Array.isArray(students)) {
//         const semesters = [...new Set(students.map(s => s.currentSemester).filter(s => s != null))].sort((a,b) => a-b);
//         return { data: semesters }; // Mimic Axios response structure
//     }
//     return { data: [] };
// };

// /**
//  * Fetches distinct branches for students within a specific semester.
//  * @param {number | string} semester
//  */
// export const getStudentBranchesBySemester = async (semester) => {
//     // Option 1: Dedicated endpoint
//     // return await axiosInstance.get(`/users/students/branches?semester=${semester}`);

//     // Option 2: Using getUsers if backend supports it
//     // return getUsers({ role: 'student', currentSemester: semester, _distinct: 'branch' });

//     // Placeholder/Simulation - Replace with actual API call
//     const response = await getUsers({ role: 'student', currentSemester: semester });
//     const students = response.data.data || response.data;
//      if (Array.isArray(students)) {
//         const branches = [...new Set(students.map(s => s.branch).filter(b => b != null))].sort();
//         return { data: branches }; // Mimic Axios response structure
//     }
//     return { data: [] };
// };

// /**
//  * Fetches students filtered by semester and branch.
//  * @param {number | string} semester
//  * @param {string} branch
//  */
// export const getStudentsBySemesterAndBranchFilter = async (semester, branch) => {
//     return getUsers({ role: 'student', currentSemester: semester, branch: branch });
// };


// // Add other user-related API functions later (createStudent, getStudentById, updateStudent, etc.)
// // export const createStudent = async (studentData) => {
// //   return await axiosInstance.post('/users', { ...studentData, role: 'student' });
// // };



// src/api/userApi.js
import axiosInstance from './axiosConfig';

export const getUsers = async (params = {}) => {
    return await axiosInstance.get('/users', { params });
};

export const getAllStudentList = async () => {
  return await axiosInstance.get("/users/students"); // This uses a separate route
};

// --- Updated functions for NESTED DROPDOWN Student List using _distinct ---
export const getStudentSemesters = async () => {
    // Backend /users endpoint now handles _distinct
    return getUsers({ role: 'student', _distinct: 'currentSemester' });
};

export const getStudentBranchesBySemester = async (semester) => {
    // Backend /users endpoint now handles _distinct with other filters
    return getUsers({ role: 'student', currentSemester: semester, _distinct: 'branch' });
};

export const getStudentsBySemesterAndBranchFilter = async (semester, branch) => {
    return getUsers({ role: 'student', currentSemester: semester, branch: branch });
};