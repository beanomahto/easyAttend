import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi } from '../api/authApi'; // Import your login API function

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('authUser');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Error parsing stored user data", e);
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effect to update isAuthenticated when token changes
  useEffect(() => {
    setIsAuthenticated(!!token);
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser'); // Also remove user on token removal
      setUser(null); // Clear user state
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginApi({ email, password });
      if (response.data && response.data.token && response.data.user) {
        setToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
        setIsLoading(false);
        return true; // Indicate success
      } else {
        throw new Error("Login failed: Invalid response from server.");
      }
    } catch (err) {
      console.error("Login error:", err);
      const message = err.response?.data?.message || err.message || "Login failed.";
      setError(message);
      setIsLoading(false);
      // Clear potential partial login state
      setToken(null);
      setUser(null);
      return false; // Indicate failure
    }
  }, []);

  const logout = useCallback(() => {
    console.log("Logging out...");
    setToken(null);
    setUser(null);
    // Optional: Call backend logout endpoint if it exists
  }, []);

  // Automatically log out if user data is missing but token exists (consistency check)
  useEffect(() => {
    if (token && !user) {
        console.warn("Token exists but user data missing, logging out.");
        logout();
    }
  }, [token, user, logout]);

  const value = {
    token,
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setError // Allow components to clear errors
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;