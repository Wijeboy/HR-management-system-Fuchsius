const bcrypt = require('bcryptjs');
const User = require('../models/User');

const sanitizeUser = (user) => ({
  id: user.id,
  employeeId: user.employeeId,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  jobTitle: user.jobTitle || '',
  phone: user.phone || '',
  location: user.location || '',
  status: user.isActive ? 'Active' : 'Inactive',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getNextEmployeeId = async () => {
  const users = await User.find({}, { employeeId: 1, _id: 0 });
  const maxNum = users.reduce((max, u) => {
    const match = String(u.employeeId || '').match(/EMP[-_]?0*(\d+)/i);
    const num = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, num);
  }, 0);
  return `EMP${String(maxNum + 1).padStart(3, '0')}`;
};

const listUsers = async (req, res) => {
  try {
    const { search = '', department = '', role = '', status = '' } = req.query;

    const query = {};
    if (department) query.department = department;
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { employeeId: regex },
        { jobTitle: regex },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    return res.json({ users: users.map(sanitizeUser), total: users.length });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch users' });
  }
};

const getUserByEmployeeId = async (req, res) => {
  try {
    const user = await User.findOne({ employeeId: req.params.employeeId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch user' });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      employeeId,
      jobTitle = '',
      phone = '',
      location = '',
      status = 'Active',
    } = req.body;

    if (!name || !email || !password || !role || !department) {
      return res.status(400).json({ message: 'name, email, password, role, and department are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) return res.status(409).json({ message: 'Email already exists' });

    const nextEmployeeId = employeeId || await getNextEmployeeId();
    const existingEmpId = await User.findOne({ employeeId: nextEmployeeId });
    if (existingEmpId) return res.status(409).json({ message: 'Employee ID already exists' });

    const hashed = await bcrypt.hash(password, 10);

    const created = await User.create({
      id: `user_${role}_${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role,
      department,
      employeeId: nextEmployeeId,
      jobTitle,
      phone,
      location,
      isActive: String(status).toLowerCase() !== 'inactive',
    });

    return res.status(201).json({ user: sanitizeUser(created) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to create user' });
  }
};

const updateUserByEmployeeId = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      jobTitle,
      phone,
      location,
      status,
    } = req.body;

    const user = await User.findOne({ employeeId: req.params.employeeId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) return res.status(409).json({ message: 'Email already exists' });
      user.email = email.toLowerCase();
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (status !== undefined) user.isActive = String(status).toLowerCase() !== 'inactive';
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to update user' });
  }
};

const deleteUserByEmployeeId = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ employeeId: req.params.employeeId });
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to delete user' });
  }
};

module.exports = {
  listUsers,
  getUserByEmployeeId,
  createUser,
  updateUserByEmployeeId,
  deleteUserByEmployeeId,
};
