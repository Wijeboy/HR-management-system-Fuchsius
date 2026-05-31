import apiClient from './api';

export const notificationService = {
  getNotifications: (userId) =>
    apiClient.get(`/notifications/${userId}`),

  markRead: (notificationId) =>
    apiClient.put(`/notifications/${notificationId}/read`),

  markAllRead: (userId) =>
    apiClient.put('/notifications/mark-all-read', { userId }),
};