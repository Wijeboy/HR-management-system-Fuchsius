require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recruitment', recruitmentRoutes);

// ─── DB Connection ────────────────────────────────────────────────────────────
// TODO: Replace with real MongoDB URI from .env when integrating final backend
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hrms';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 HRMS Backend running on http://localhost:${PORT}`);
});