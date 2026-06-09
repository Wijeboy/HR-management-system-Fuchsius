import mongoose from 'mongoose';

/**
 * LeaveRequest Model
 * ------------------
 * Stores leave applications submitted by employees.
 */
const leaveRequestSchema = new mongoose.Schema(
  {
    // TODO: Replace with ObjectId ref when real Employee model exists
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },

    leaveType: { type: String, enum: ['medical', 'vacation'], required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = single-day leave

    // Total calendar days (inclusive)
    durationDays: { type: Number, required: true },

    reason: { type: String, required: true },

    // Uploaded file path (relative to /uploads)
    supportingDocument: { type: String, default: null },
    documentMimeType: { type: String, default: null },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // HR action metadata
    reviewedBy: { type: String, default: null }, // HR employee ID
    reviewedAt: { type: Date, default: null },
    hrComment: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('LeaveRequest', leaveRequestSchema);