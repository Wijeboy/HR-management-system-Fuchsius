import apiClient from './api';

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';

export const recruitmentService = {
  // ── Job Postings ────────────────────────────────────────────────────────────
  getAllJobs: (search = '') =>
    apiClient.get('/recruitment/jobs', { params: { search } }),

  getJobById: (id) =>
    apiClient.get(`/recruitment/jobs/${id}`),

  createJob: (formData) =>
    apiClient.post('/recruitment/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateJob: (id, formData) =>
    apiClient.put(`/recruitment/jobs/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteJob: (id) =>
    apiClient.delete(`/recruitment/jobs/${id}`),

  // ── Applications ────────────────────────────────────────────────────────────
  applyForJob: (jobPostingId, formData) =>
    apiClient.post(`/recruitment/apply/${jobPostingId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAllApplicants: () =>
    apiClient.get('/recruitment/applicants'),

  cancelApplicant: (id) =>
    apiClient.delete(`/recruitment/applicants/${id}`),

  // ── Interview Schedules ─────────────────────────────────────────────────────
  scheduleInterview: (applicantId, data) =>
    apiClient.post(`/recruitment/schedule/${applicantId}`, data),

  getEmployeeSchedules: (employeeId, search = '') =>
    apiClient.get(`/recruitment/schedules/${employeeId}`, { params: { search } }),

  // ── File download URL helper ────────────────────────────────────────────────
  getJobAttachmentUrl: (jobId) => `${BASE}/api/recruitment/jobs/${jobId}/attachment`,
  getApplicantCvUrl: (applicantId) => `${BASE}/api/recruitment/applicants/${applicantId}/cv`,
};