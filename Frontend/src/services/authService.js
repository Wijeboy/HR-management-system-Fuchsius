import apiClient from './api';

export const authService = {
  // Login
  login: (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },

  // Logout
  logout: () => {
    return apiClient.post('/auth/logout');
  },

  // Forgot Password
  forgotPassword: (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  // Reset Password
  resetPassword: (token, password) => {
    return apiClient.post('/auth/reset-password', { token, password });
  },

  // Get Current User
  getCurrentUser: () => {
    return apiClient.get('/auth/me');
  },

  // Update Profile
  updateProfile: (data) => {
    return apiClient.put('/auth/profile', data);
  },

  // Change Password
  changePassword: (data) => {
    return apiClient.put('/auth/change-password', data);
  },
};
