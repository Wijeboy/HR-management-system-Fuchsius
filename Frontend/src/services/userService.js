import apiClient from './api';

export const userService = {
  getUsers: (params = {}) => apiClient.get('/users', { params }),
  getUser: (employeeId) => apiClient.get(`/users/${employeeId}`),
  createUser: (payload) => apiClient.post('/users', payload),
  updateUser: (employeeId, payload) => apiClient.put(`/users/${employeeId}`, payload),
  deleteUser: (employeeId) => apiClient.delete(`/users/${employeeId}`),
};
