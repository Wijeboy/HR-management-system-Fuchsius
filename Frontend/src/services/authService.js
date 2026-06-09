import apiClient from './api';

export const authService = {
  login: (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },

  logout: () => {
    return apiClient.post('/auth/logout');
  },

  forgotPassword: (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: (token, password) => {
    return apiClient.post('/auth/reset-password', { token, password });
  },

  getCurrentUser: () => {
    return apiClient.get('/auth/me');
  },

  updateProfile: (data) => {
    return apiClient.put('/auth/profile', data);
  },

  updateProfilePhoto: (formData) => {
    return apiClient.put('/auth/profile/photo', formData);
  },

  deleteProfilePhoto: () => {
    return apiClient.delete('/auth/profile/photo');
  },

  changePassword: (data) => {
    return apiClient.put('/auth/change-password', data);
  },
};
