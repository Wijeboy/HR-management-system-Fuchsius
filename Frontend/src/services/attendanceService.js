import apiClient from './api';

export const attendanceService = {
  // Employee: check in
  checkIn: (employeeId) =>
    apiClient.post('/attendance/checkin', { employeeId }),

  // Employee: check out
  checkOut: (employeeId) =>
    apiClient.post('/attendance/checkout', { employeeId }),

  // Employee: get today's status
  getTodayStatus: (employeeId) =>
    apiClient.get(`/attendance/today/${employeeId}`),

  // Employee: get attendance history (paginated)
  getHistory: (employeeId, page = 1, limit = 10) =>
    apiClient.get(`/attendance/history/${employeeId}`, { params: { page, limit } }),

  // Employee: get weekly attendance
  getWeekly: (employeeId) =>
    apiClient.get(`/attendance/weekly/${employeeId}`),

  // HR: get daily attendance list
  getDailyAttendance: ({ date, department, status, page = 1, limit = 10 } = {}) =>
    apiClient.get('/attendance/daily', { params: { date, department, status, page, limit } }),

  // HR: get daily stats
  getDailyStats: (date) =>
    apiClient.get('/attendance/stats', { params: { date } }),
};