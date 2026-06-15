const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  employeeId: user.employeeId,
});

const signToken = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
    employeeId: user.employeeId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Login ID and password are required' });
    }

    const loginId = String(email).trim();
    const normalizedEmail = loginId.toLowerCase();
    const user = await User.findOne({
      isActive: true,
      $or: [
        { email: normalizedEmail },
        { employeeId: loginId.toUpperCase() },
        { name: { $regex: `^${escapeRegex(loginId)}$`, $options: 'i' } },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: `Selected role does not match account role (${user.role})` });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Login failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id, isActive: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to load user profile' });
  }
};

const logout = async (req, res) => {
  return res.json({ success: true });
};

module.exports = {
  login,
  getMe,
  logout,
};
