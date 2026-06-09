import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const DEFAULT_USERS = [
  {
    id: 'user_admin_001',
    name: 'Admin User',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin',
    department: 'IT',
    employeeId: 'EMP001',
    jobTitle: 'System Administrator',
    phone: '+94 77 100 0001',
    location: 'Colombo',
  },
  {
    id: 'user_hr_001',
    name: 'HR Manager',
    email: 'hr@company.com',
    password: 'hr123',
    role: 'hr',
    department: 'Human Resources',
    employeeId: 'EMP002',
    jobTitle: 'HR Manager',
    phone: '+94 77 100 0002',
    location: 'Colombo',
  },
  {
    id: 'user_manager_001',
    name: 'Department Manager',
    email: 'manager@company.com',
    password: 'manager123',
    role: 'manager',
    department: 'Engineering',
    employeeId: 'EMP003',
    jobTitle: 'Engineering Manager',
    phone: '+94 77 100 0003',
    location: 'Kandy',
  },
  {
    id: 'user_employee_001',
    name: 'John Doe',
    email: 'employee@company.com',
    password: 'employee123',
    role: 'employee',
    department: 'Sales',
    employeeId: 'EMP004',
    jobTitle: 'Sales Executive',
    phone: '+94 77 100 0004',
    location: 'Galle',
  },
];

const seedDefaultUsers = async () => {
  for (const rawUser of DEFAULT_USERS) {
    const existing = await User.findOne({ email: rawUser.email.toLowerCase() });
    if (existing) continue;

    const hashedPassword = await bcrypt.hash(rawUser.password, 10);
    await User.create({
      ...rawUser,
      email: rawUser.email.toLowerCase(),
      password: hashedPassword,
    });
  }
};

export default { seedDefaultUsers };
