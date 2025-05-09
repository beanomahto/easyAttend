// src/api/dashboardApi.js
import axiosInstance from "./axiosConfig"; // Adjust path as needed

/**
 * Fetches dashboard statistics.
 * @returns Promise<AxiosResponse>
 */
export const getDashboardStats = async () => {
  return await axiosInstance.get("/dashboard/stats");
};