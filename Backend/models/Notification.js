import mongoose from 'mongoose';

/**
 * Notification Model
 * ------------------
 * Stores notifications for HR and employees.
 * recipientId → the user who should see this notification
 */
const notificationSchema = new mongoose.Schema(
  {
    // TODO: Replace with ObjectId ref when real User model exists
    recipientId: { type: String, required: true },
    recipientRole: { type: String, enum: ['hr', 'employee', 'admin', 'manager'], required: true },

    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['leave_submitted', 'leave_approved', 'leave_rejected', 'general'],
      default: 'general',
    },

    // Reference to the related leave request if applicable
    relatedLeaveId: { type: String, default: null },

    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);