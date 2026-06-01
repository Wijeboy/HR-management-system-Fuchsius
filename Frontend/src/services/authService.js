import apiClient from './api';

const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false';

const MOCK_USERS = {
  admin: {
    name: 'System Admin',
    email: 'admin@company.com',
    department: 'Administration',
    role: 'admin',
  },
  hr: {
    name: 'HR Manager',
    email: 'hr@company.com',
    department: 'Human Resources',
    role: 'hr',
  },
  manager: {
    name: 'Team Manager',
    email: 'manager@company.com',
    department: 'Operations',
    role: 'manager',
  },
  employee: {
    name: 'Employee User',
    email: 'employee@company.com',
    department: 'General',
    role: 'employee',
  },
};

const resolveRole = (credentials = {}) => {
  const email = String(credentials.email || '').toLowerCase();
  if (credentials.role && MOCK_USERS[credentials.role]) return credentials.role;
  if (email.includes('admin')) return 'admin';
  if (email.includes('hr')) return 'hr';
  if (email.includes('manager')) return 'manager';
  return 'employee';
};

const buildMockUser = (credentials = {}) => {
  const role = resolveRole(credentials);
  const profile = MOCK_USERS[role] || MOCK_USERS.employee;

  return {
    id: `mock-${role}`,
    _id: `mock-${role}`,
    employeeId: `MOCK-${role.toUpperCase()}`,
    name: profile.name,
    email: credentials.email?.trim() || profile.email,
    department: profile.department,
    role,
    status: 'Active',
  };
};

const mockAuthResponse = (credentials = {}) => {
  const user = buildMockUser(credentials);
  return Promise.resolve({
    data: {
      user,
      token: `mock-token-${user.role}`,
    },
  });
};

export const authService = {
  // Login
  login: (credentials) => {
    if (USE_MOCK_BACKEND) {
      return mockAuthResponse(credentials);
    }

    return apiClient.post('/auth/login', credentials);
  },

  // Logout
  logout: () => {
    if (USE_MOCK_BACKEND) {
      return Promise.resolve({ data: { success: true } });
    }

    return apiClient.post('/auth/logout');
  },

  // Forgot Password
  forgotPassword: (email) => {
    if (USE_MOCK_BACKEND) {
      return Promise.resolve({ data: { success: true, email } });
    }

    return apiClient.post('/auth/forgot-password', { email });
  },

  // Reset Password
  resetPassword: (token, password) => {
    if (USE_MOCK_BACKEND) {
      return Promise.resolve({ data: { success: true, token, password } });
    }

    return apiClient.post('/auth/reset-password', { token, password });
  },

  // Get Current User
  getCurrentUser: () => {
    if (USE_MOCK_BACKEND) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        return Promise.resolve({ data: { user } });
      } catch {
        return Promise.resolve({ data: { user: null } });
      }
    }

    return apiClient.get('/auth/me');
  },

  // Update Profile
  updateProfile: (data) => {
    if (USE_MOCK_BACKEND) {
      return Promise.resolve({ data: { success: true, user: data } });
    }

    return apiClient.put('/auth/profile', data);
  },

  // Change Password
  changePassword: (data) => {
    if (USE_MOCK_BACKEND) {
      return Promise.resolve({ data: { success: true } });
    }

    return apiClient.put('/auth/change-password', data);
  },
};
