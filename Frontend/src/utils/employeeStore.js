const EMPLOYEE_STORE_KEY = 'hrms_employees';

const seedEmployees = [
  { id: 'EMP-0001', name: 'Sarah Williams', department: 'Engineering', role: 'Senior Developer', email: 'sarah.w@company.com', status: 'Active', phone: '+94 77 123 4567', location: 'Colombo' },
  { id: 'EMP-0002', name: 'John Davis', department: 'Sales', role: 'Sales Manager', email: 'john.d@company.com', status: 'Active', phone: '+94 77 234 5678', location: 'Kandy' },
  { id: 'EMP-0003', name: 'Michael Johnson', department: 'HR', role: 'HR Specialist', email: 'michael.j@company.com', status: 'Active', phone: '+94 77 345 6789', location: 'Colombo' },
  { id: 'EMP-0004', name: 'Emily Chen', department: 'Finance', role: 'Accountant', email: 'emily.c@company.com', status: 'Active', phone: '+94 77 456 7890', location: 'Galle' },
  { id: 'EMP-0005', name: 'Robert Taylor', department: 'Engineering', role: 'DevOps Engineer', email: 'robert.t@company.com', status: 'On Leave', phone: '+94 77 567 8901', location: 'Remote' },
];

export const getEmployees = () => {
  try {
    const raw = localStorage.getItem(EMPLOYEE_STORE_KEY);
    if (!raw) { 
      localStorage.setItem(EMPLOYEE_STORE_KEY, JSON.stringify(seedEmployees));
      return seedEmployees;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Invalid employee store');
    return parsed;
  } catch {
    localStorage.setItem(EMPLOYEE_STORE_KEY, JSON.stringify(seedEmployees));
    return seedEmployees;
  }
};

export const saveEmployees = (employees) => {
  localStorage.setItem(EMPLOYEE_STORE_KEY, JSON.stringify(employees));
};

export const getNextEmployeeId = (employees) => {
  const maxNum = employees.reduce((max, e) => {
    const match = String(e.id).match(/EMP-(\d+)/);
    const num = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, num);
  }, 0);
  return `EMP-${String(maxNum + 1).padStart(4, '0')}`;
};
