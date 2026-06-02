export const ROLE_ACCESS = {
  // Dashboard access
  dashboard: ['admin', 'hr', 'manager', 'employee'],
  
  // Department & Employee
  departmentsView: ['admin'],
  employeesView: ['admin', 'hr', 'manager'],
  employeesEdit: ['admin', 'hr'],

  // Attendance
  attendanceSelf: ['admin', 'hr', 'manager', 'employee'], // Confirmed: 'employee' has access
  attendanceReports: ['admin', 'hr', 'manager'],

  // Leave Management
  leaveRequests: ['admin', 'hr', 'manager', 'employee'],
  leaveBalance: ['admin', 'hr', 'manager', 'employee'],
  leaveApply: ['admin', 'hr', 'manager', 'employee'],
  leaveManage: ['admin', 'hr', 'manager'],

  // Payroll
  payrollView: ['admin', 'hr'],
  payrollGenerate: ['admin', 'hr'],
  payrollPayslip: ['admin', 'hr', 'manager', 'employee'],

  // Recruitment
  recruitmentJobs: ['admin', 'hr'],
  recruitmentApplicants: ['admin', 'hr'],
  recruitmentOnboarding: ['admin', 'hr'],

  // Performance
  performanceReviews: ['admin', 'manager'],
  performanceGoals: ['admin', 'manager'],

  // System & Misc
  reports: ['admin', 'hr', 'manager'],
  profile: ['admin', 'hr', 'manager', 'employee'],
  settings: ['admin'],
};

export const canAccess = (role, resource) => {
  return ROLE_ACCESS[resource]?.includes(role) ?? false;
};
