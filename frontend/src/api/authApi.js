import axiosInstance from './axiosConfig';

export const login = async (credentials) => {
    // credentials should be { email, password }
    return await axiosInstance.post('/auth/login', credentials);
};

export const register = async (userData) => {
     // userData should contain all required fields based on role
     return await axiosInstance.post('/auth/register', userData);
};

// Optional: Fetch current user details
// export const getMe = async () => {
//     return await axiosInstance.get('/auth/me'); // Requires backend route
// }