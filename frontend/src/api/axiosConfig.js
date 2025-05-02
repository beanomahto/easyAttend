import axios from 'axios';


console.log("API Base URL:", process.env.REACT_APP_API_URL); // Should now print http://localhost:5000/api
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api', // Use env var or default
});
console.log("API Base URL:", process.env.REACT_APP_API_URL); // Should now print http://localhost:5000/api

// Request Interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or wherever you store it
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response Interceptor for error handling (e.g., auto-logout on 401)
axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response && error.response.status === 401) {
      // Example: Unauthorized - maybe token expired?
      console.error("Unauthorized access - 401");
      // Trigger logout logic (e.g., by clearing local storage and redirecting)
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Use window.location.href for redirection outside React Router context if needed
      window.location.href = '/login';
    }
    // Always reject the promise for other errors
    return Promise.reject(error);
  }
);


export default axiosInstance;