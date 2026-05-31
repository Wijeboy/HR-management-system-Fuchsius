import apiClient from './api';

export const leaveService = {
  // Employee: submit leave request (multipart)
  submitLeave: (formData) =>
    apiClient.post('/leave/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Employee: update leave request (multipart)
  updateLeave: (id, formData) =>
    apiClient.put(`/leave/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Employee: delete leave request
  deleteLeave: (id, employeeId) =>
    apiClient.delete(`/leave/${id}`, { data: { employeeId } }),

  // Employee: get leave balance
  getBalance: (employeeId) =>
    apiClient.get(`/leave/balance/${employeeId}`),

  // Employee: get leave history
  getHistory: (employeeId, page = 1, limit = 10) =>
    apiClient.get(`/leave/history/${employeeId}`, { params: { page, limit } }),

  // HR: get pending requests
  getPending: (page = 1, limit = 10) =>
    apiClient.get('/leave/pending', { params: { page, limit } }),

  // HR: get approved requests
  getApproved: (page = 1, limit = 10) =>
    apiClient.get('/leave/approved', { params: { page, limit } }),

  // HR: get rejected requests
  getRejected: (page = 1, limit = 10) =>
    apiClient.get('/leave/rejected', { params: { page, limit } }),

  // HR: approve request
  approveLeave: (id, hrId) =>
    apiClient.post(`/leave/${id}/approve`, { hrId }),

  // HR: reject request
  rejectLeave: (id, hrId, comment = '') =>
    apiClient.post(`/leave/${id}/reject`, { hrId, comment }),

  // View single request
  getRequest: (id) =>
    apiClient.get(`/leave/${id}`),
};