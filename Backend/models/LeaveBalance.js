const mongoose = require('mongoose');

/**
 * LeaveBalance Model
 * ------------------
 * Tracks remaining leave days per employee per year.
 * One document per employee per year.
 */
const leaveBalanceSchema = new mongoose.Schema(
  {
    // TODO: Replace with ObjectId ref when real Employee model exists
    employeeId: { type: String, required: true },
    year: { type: Number, required: true }, // e.g. 2026

    medical: { type: Number, default: 12 },    // initial: 12 days
    vacation: { type: Number, default: 18 },   // initial: 18 days

    // Used days (for progress bar calculation)
    medicalUsed: { type: Number, default: 0 },
    vacationUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);