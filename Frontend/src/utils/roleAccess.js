export const ROLE_ACCESS = {
  dashboard: ['admin', 'hr', 'manager', 'employee'],

  employeesView: ['admin', 'hr', 'manager'],
  employeesEdit: ['admin', 'hr'],

  attendanceSelf: ['admin', 'employee'],
  attendanceReports: ['admin', 'hr', 'manager'],

  leaveRequests: ['admin', 'hr', 'manager', 'employee'],
  leaveBalance: ['admin', 'hr', 'manager', 'employee'],
  leaveApply: ['admin', 'hr', 'manager', 'employee'],
  leaveManage: ['admin', 'hr', 'manager'],

  payrollView: ['admin', 'hr', 'manager', 'employee'],
  payrollGenerate: ['admin', 'hr'],
  payrollPayslip: ['admin', 'hr', 'manager', 'employee'],

  recruitmentJobs: ['admin', 'hr', 'manager'],
  recruitmentApplicants: ['admin', 'employee'],
  recruitmentOnboarding: ['admin', 'hr', 'manager'],

  performanceReviews: ['admin', 'hr', 'manager', 'employee'],
  performanceGoals: ['admin', 'hr', 'manager', 'employee'],

  reports: ['admin', 'hr', 'manager'],
  profile: ['admin', 'hr', 'manager', 'employee'],
  settings: ['admin'],
};

export const canAccess = (role, permission) => {
  if (!role) return false;
  return (ROLE_ACCESS[permission] || []).includes(role);
};
