const mongoose = require('mongoose');

/**
 * InterviewSchedule Model
 * -----------------------
 * Stores interview/meeting schedules created by HR for specific applicants.
 */
const interviewScheduleSchema = new mongoose.Schema(
  {
    applicantId: { type: String, required: true },   // Applicant._id as string
    jobCode: { type: String, required: true },        // "JV-XXXXXX"
    jobPostingId: { type: String, required: true },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },

    // TODO: replace with real employeeId from auth when integrating real backend
    employeeId: { type: String, required: true },    // which employee this is for

    interviewDate: { type: Date, required: true },
    interviewTime: { type: String, required: true },  // "09:00"
    meetingLink: { type: String, required: true },
    duration: { type: String, enum: ['20 min', '30 min', '60 min'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewSchedule', interviewScheduleSchema);