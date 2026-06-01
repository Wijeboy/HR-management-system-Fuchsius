import axios from 'axios';
import { getEmployees, getNextEmployeeId, saveEmployees } from '../utils/employeeStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false';

const createResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

const createEmployeeRecord = (employee) => ({
  id: employee.id,
  employeeId: employee.id,
  name: employee.name,
  email: employee.email,
  department: employee.department,
  role: employee.role || 'employee',
  status: employee.status || 'Active',
  phone: employee.phone || '',
  location: employee.location || '',
});

const getStoredJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setStoredJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getMockCurrentUser = () => getStoredJson('user');

const getMockCollection = (key, fallback = []) => {
  const stored = getStoredJson(key);
  if (Array.isArray(stored)) return stored;
  setStoredJson(key, fallback);
  return fallback;
};

const normalizeUsers = () => getEmployees().map(createEmployeeRecord);

const getMockGetData = (url) => {
  if (url === '/auth/me') {
    return { user: getMockCurrentUser() };
  }

  if (url === '/users') {
    const users = normalizeUsers();
    return { users, total: users.length };
  }

  const userMatch = url.match(/^\/users\/([^/]+)$/);
  if (userMatch) {
    const employee = normalizeUsers().find((item) => String(item.id) === userMatch[1] || String(item.employeeId) === userMatch[1]);
    return { user: employee || null };
  }

  if (url.startsWith('/leave/balance/')) {
    return { balance: { available: 18, used: 4, pending: 1, total: 23 } };
  }

  if (url.startsWith('/leave/history/') || url === '/leave/pending' || url === '/leave/approved' || url === '/leave/rejected') {
    return { records: [], total: 0 };
  }

  if (url === '/payroll/records') {
    return { records: [], summary: { totalNet: 0 } };
  }

  if (url === '/payroll/employees') {
    return { employees: normalizeUsers() };
  }

  if (url.startsWith('/payroll/payslips')) {
    return { records: [] };
  }

  if (url.startsWith('/attendance')) {
    return { records: [], stats: { present: 0, absent: 0, late: 0 } };
  }

  if (url.startsWith('/performance/reviews')) {
    return { reviews: [], total: 0 };
  }

  if (url.startsWith('/performance/goals')) {
    return { goals: [], total: 0 };
  }

  if (url.startsWith('/recruitment/jobs')) {
    return { records: [], jobs: [] };
  }

  if (url.startsWith('/recruitment/applicants')) {
    return { records: [], applicants: [] };
  }

  if (url.startsWith('/notifications')) {
    return { notifications: [] };
  }

  return {};
};

const getMockPostData = (url, data) => {
  if (url === '/users') {
    const employees = getEmployees();
    const employee = createEmployeeRecord({
      id: getNextEmployeeId(employees),
      ...data,
    });
    saveEmployees([...employees, employee]);
    return { user: employee };
  }

  if (url.startsWith('/users/')) {
    const employeeId = url.split('/').pop();
    const employees = getEmployees();
    const updatedEmployees = employees.map((employee) => {
      if (employee.id !== employeeId) return employee;
      return {
        ...employee,
        ...data,
      };
    });
    saveEmployees(updatedEmployees);
    return { user: createEmployeeRecord(updatedEmployees.find((employee) => employee.id === employeeId) || { id: employeeId, ...data }) };
  }

  if (url.startsWith('/leave/') || url.startsWith('/attendance/') || url.startsWith('/performance/') || url.startsWith('/payroll/') || url.startsWith('/recruitment/')) {
    return { success: true, data };
  }

  return { success: true, data };
};

const mockApiClient = {
  get: (url) => Promise.resolve(createResponse(getMockGetData(url))),
  post: (url, data) => Promise.resolve(createResponse(getMockPostData(url, data))),
  put: (url, data) => Promise.resolve(createResponse(getMockPostData(url, data))),
  patch: (url, data) => Promise.resolve(createResponse(getMockPostData(url, data))),
  delete: (url, config = {}) => {
    if (url.startsWith('/users/')) {
      const employeeId = url.split('/').pop();
      const employees = getEmployees().filter((employee) => employee.id !== employeeId);
      saveEmployees(employees);
      return Promise.resolve(createResponse({ success: true }));
    }

    return Promise.resolve(createResponse({ success: true, data: config.data || null }));
  },
};

const apiClient = USE_MOCK_BACKEND
  ? mockApiClient
  : (() => {
      const client = axios.create({
        baseURL: API_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      client.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      client.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );

      return client;
    })();

export default apiClient;
