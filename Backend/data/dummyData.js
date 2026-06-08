/**
 * DUMMY DATA FILE
 * ---------------
 * This file contains placeholder data used during development.
 * When integrating with the real backend, replace these with actual
 * database queries or API calls. Each section is clearly labeled
 * for easy replacement.
 *
 * TO INTEGRATE REAL DATA:
 * - Replace `dummyUsers` with actual DB query: User.findAll()
 * - Replace `dummyEmployees` with actual DB query: Employee.findAll()
 * - Replace hardcoded IDs with session/token-decoded user IDs
 */

// ─── USER ACCOUNTS (replace with User model DB records) ───────────────────────
const dummyUsers = [
  {
    id: 'user_admin_001',
    name: 'Admin User',
    email: 'admin@company.com',
    password: 'admin123', // In real backend: hashed with bcrypt
    role: 'admin',
    department: 'IT',
    employeeId: 'EMP001',
  },
  {
    id: 'user_hr_001',
    name: 'HR Manager',
    email: 'hr@company.com',
    password: 'hr123',
    role: 'hr',
    department: 'Human Resources',
    employeeId: 'EMP002',
  },
  {
    id: 'user_manager_001',
    name: 'Department Manager',
    email: 'manager@company.com',
    password: 'manager123',
    role: 'manager',
    department: 'Engineering',
    employeeId: 'EMP003',
  },
  {
    id: 'user_employee_001',
    name: 'John Doe',
    email: 'employee@company.com',
    password: 'employee123',
    role: 'employee',
    department: 'Sales',
    employeeId: 'EMP004',
  },
];

// ─── EMPLOYEES LIST (replace with Employee model DB records) ──────────────────
// This represents ALL registered employees in the system for headcount calculations
const dummyEmployees = [
  { id: 'EMP001', name: 'Admin User', department: 'IT', userId: 'user_admin_001' },
  { id: 'EMP002', name: 'HR Manager', department: 'Human Resources', userId: 'user_hr_001' },
  { id: 'EMP003', name: 'Department Manager', department: 'Engineering', userId: 'user_manager_001' },
  { id: 'EMP004', name: 'John Doe', department: 'Sales', userId: 'user_employee_001' },
  { id: 'EMP005', name: 'Sarah Williams', department: 'Engineering', userId: 'user_emp_005' },
  { id: 'EMP006', name: 'Michael Brown', department: 'Finance', userId: 'user_emp_006' },
  { id: 'EMP007', name: 'Emily Chen', department: 'Marketing', userId: 'user_emp_007' },
  { id: 'EMP008', name: 'Robert Taylor', department: 'Sales', userId: 'user_emp_008' },
  { id: 'EMP009', name: 'Jessica Martinez', department: 'Engineering', userId: 'user_emp_009' },
  { id: 'EMP010', name: 'David Wilson', department: 'HR', userId: 'user_emp_010' },
  { id: 'EMP011', name: 'Amanda Lee', department: 'Finance', userId: 'user_emp_011' },
  { id: 'EMP012', name: 'Chris Johnson', department: 'IT', userId: 'user_emp_012' },
];

// ─── DEPARTMENTS LIST (replace with Department model DB records) ───────────────
const dummyDepartments = [
  'IT',
  'Human Resources',
  'Engineering',
  'Sales',
  'Finance',
  'Marketing',
  'HR',
];

// ─── LEAVE BALANCES (replace with LeaveBalance model DB records) ───────────────
// Initial leave balances per employee per year
// Key: employeeId, Value: { medical: days, vacation: days }
const defaultLeaveBalances = {
  medical: 12,
  vacation: 18,
};

module.exports = {
  dummyUsers,
  dummyEmployees,
  dummyDepartments,
  defaultLeaveBalances,
};