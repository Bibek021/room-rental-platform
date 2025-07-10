// Purpose: Authentication utilities for JWT handling
import axios from 'axios';

// Get token from localStorage
export const getToken = () => localStorage.getItem('token');

// Set axios default headers for authenticated requests
export const setAuthHeader = () => {
  const token = getToken();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Check if user is authenticated
export const isAuthenticated = () => !!getToken();

// Get user role from token (decode JWT payload)
export const getUserRole = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (err) {
    return null;
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
  setAuthHeader();
};