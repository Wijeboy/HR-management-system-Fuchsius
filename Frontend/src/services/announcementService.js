import apiClient from './api';

export const announcementService = {
  getAll: (role) =>
    apiClient.get('/announcements', { params: role ? { role } : {} }),

  create: (data) =>
    apiClient.post('/announcements', data),

  update: (id, data) =>
    apiClient.put(`/announcements/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/announcements/${id}`),
};
