// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);

        // Redirect based on user role
        if (response.user.role === 'admin') {
          // Admin landing path is '/admin'
          navigate('/admin/dashboard');
        } else if (response.user.role === 'employee') {
          // Employee landing path is '/employee'
          navigate('/employee/dashboard');
        } else {
          navigate('/dashboard');
        }

        return { success: true, data: response };
      }
      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.token) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);

        // Redirect based on user role after registration
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.user.role === 'employee') {
          navigate('/employee/dashboard');
        } else {
          navigate('/dashboard');
        }

        return { success: true, data: response };
      }
      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/login');
    }
  };

  // Admin-specific methods
  const adminCreateUser = async (userData) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const response = await authAPI.adminCreateUser(userData, token);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const adminGetAllUsers = async () => {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const response = await authAPI.adminGetAllUsers(token);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const adminUpdateUser = async (userId, userData) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const response = await authAPI.adminUpdateUser(userId, userData, token);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const adminDeleteUser = async (userId) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      const response = await authAPI.adminDeleteUser(userId, token);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Helper methods for role-based access
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isEmployee = () => {
    return user && user.role === 'employee';
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    
    // Admin methods
    adminCreateUser,
    adminGetAllUsers,
    adminUpdateUser,
    adminDeleteUser,
    
    // Role check methods
    isAdmin,
    isEmployee,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};