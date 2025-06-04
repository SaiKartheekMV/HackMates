import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/auth/profile');
      // Handle response structure from backend
      const userData = response.data.user || response.data;
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login with:', { email: credentials.email });
      
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }
      
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      
      console.log('Login successful');
      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed';
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting registration with:', { 
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email 
      });
      
      // Validate required fields
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      if (!userData.firstName || !userData.firstName.trim()) {
        throw new Error('First name is required');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Validate password length
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Optional: Only validate password confirmation if provided
      if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Prepare data for backend (remove confirmPassword if it exists)
      const { confirmPassword, ...registrationData } = userData;
      
      const response = await api.post('/auth/register', registrationData);
      console.log('Registration response:', response.data);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }
      
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      
      console.log('Registration successful');
      return { success: true };
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      let errorMessage;
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const serverMessage = error.response.data?.message || error.response.data?.error;
        
        console.error('Server error response:', error.response.data);
        
        switch (status) {
          case 400:
            if (serverMessage?.toLowerCase().includes('already exists')) {
              errorMessage = 'An account with this email already exists. Please try logging in instead.';
            } else {
              errorMessage = serverMessage || 'Invalid registration data. Please check your information.';
            }
            break;
          case 409:
            errorMessage = 'An account with this email already exists. Please try logging in instead.';
            break;
          case 422:
            errorMessage = serverMessage || 'Please check your input data and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverMessage || `Server error: ${status}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else {
        // Something else happened (validation errors, etc.)
        errorMessage = error.message || 'Registration failed. Please try again.';
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Optionally call logout endpoint
      try {
        await api.post('/auth/logout');
      } catch (logoutError) {
        console.warn('Logout API call failed:', logoutError);
        // Continue with local logout even if API call fails
      }
      
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force local logout even if there's an error
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/auth/profile', updatedData);
      // Handle response structure from backend
      const updatedUser = response.data.user || response.data;
      
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Profile update failed';
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Helper function to get user's full name
  const getUserFullName = () => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    getUserFullName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};