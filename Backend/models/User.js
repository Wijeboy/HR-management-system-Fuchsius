const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee'],
      required: true,
    },
    department: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    jobTitle: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
