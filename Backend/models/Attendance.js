import mongoose from 'mongoose';

/**
 * AttendanceRecord Model
 * ---------------------
 * Stores daily check-in / check-out for each employee.
 * employeeId  → FK to Employee/User collection (replace dummy with real ref)
 * date        → ISO date string "YYYY-MM-DD" for easy querying
 */
const attendanceSchema = new mongoose.Schema(
  {
    // TODO: When real User/Employee model exists, change to:
    //   employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },

    date: { type: String, required: true }, // "YYYY-MM-DD"
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },

    // Derived / cached fields
    totalHours: { type: Number, default: 0 }, // in decimal hours
    status: {
      type: String,
      enum: ['present', 'absent', 'on_leave', 'late'],
      default: 'absent',
    },
  },
  { timestamps: true }
);

// Compound index: one record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);