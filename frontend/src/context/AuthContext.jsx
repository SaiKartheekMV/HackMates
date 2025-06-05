/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

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
      const response = await userAPI.getCurrentUser();
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
      
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }
      
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      
      console.log('Login successful');
      return { success: true, user };
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage;
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message || error.response.data?.error;
        
        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Invalid email or password';
            break;
          case 401:
            errorMessage = 'Invalid email or password';
            break;
          case 403:
            errorMessage = 'Account access denied. Please verify your email.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverMessage || 'Login failed. Please try again.';
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'Login failed. Please try again.';
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
      
      // Password confirmation validation (if provided)
      if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Prepare data for backend (remove confirmPassword if it exists)
      const { confirmPassword, ...registrationData } = userData;
      
      const response = await authAPI.register(registrationData);
      console.log('Registration response:', response.data);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }
      
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      
      console.log('Registration successful');
      return { success: true, user };
      
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage;
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message || error.response.data?.error;
        
        console.error('Server error response:', error.response.data);
        
        switch (status) {
          case 400:
            if (serverMessage?.toLowerCase().includes('already exists') || 
                serverMessage?.toLowerCase().includes('duplicate')) {
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
          case 429:
            errorMessage = 'Too many registration attempts. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = serverMessage || `Server error: ${status}`;
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else {
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
      
      // Call logout endpoint (optional - will continue even if it fails)
      try {
        await authAPI.logout();
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

  const updateUser = async (updatedData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.updateUser(updatedData);
      const updatedUser = response.data.user || response.data;
      
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('User update error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'User update failed';
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await userAPI.deleteAccount();
      
      // Clear local state
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Account deletion error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Account deletion failed';
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!email) {
        throw new Error('Email is required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      await authAPI.forgotPassword(email);
      
      return { 
        success: true, 
        message: 'Password reset link has been sent to your email' 
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to send password reset email';
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token || !password) {
        throw new Error('Token and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const response = await authAPI.resetPassword(token, password);
      
      // Optionally auto-login after password reset
      const { token: newToken, user } = response.data;
      if (newToken && user) {
        localStorage.setItem('token', newToken);
        setUser(user);
        setIsAuthenticated(true);
      }
      
      return { 
        success: true, 
        message: 'Password has been reset successfully' 
      };
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to reset password';
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { token } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        return { success: true };
      }
      
      throw new Error('No token received');
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return { success: false };
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Helper functions
  const getUserFullName = () => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  };

  const getUserInitials = () => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isEmailVerified = () => {
    return user?.isEmailVerified || false;
  };

  const value = {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    
    // Auth methods
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken,
    
    // User methods
    updateUser,
    deleteAccount,
    
    // Utility methods
    checkAuthStatus,
    clearError,
    getUserFullName,
    getUserInitials,
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};