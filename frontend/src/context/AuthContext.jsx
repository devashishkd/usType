import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios globally\
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${baseURL}/auth/login`, {
        username,
        password,
      });
      
      setUser(response.data);
      
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const signup = async (username, password) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${baseURL}/auth/register`, {
        username,
        password,
      });
      
      setUser(response.data);
      
      return { success: true, user: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      await axios.post(`${baseURL}/auth/logout`);
    } catch (error) {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    login,
    signup,
    logout,
    checkAuth,
    // Helper to get username easily
    username: user?.username || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};