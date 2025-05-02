// src/api/userApi.js
import axiosInstance from './axiosConfig';

/**
 * Fetches users, optionally filtering by parameters.
 * @param {object} params - Query parameters (e.g., { role: 'professor' })
 * @returns Promise<AxiosResponse>
 */
export const getUsers = async (params = {}) => {
    return await axiosInstance.get('/users', { params });
};

// Add other user-related API functions later (getById, update, etc.)