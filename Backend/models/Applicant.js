const mongoose = require('mongoose');

/**
 * Applicant Model
 * ---------------
 * Stores applications submitted by employees/external applicants.
 * jobCode: references the JobPosting.uniqueCode
 */
const applicantSchema = new mongoose.Schema(
  {
    jobCode: { type: String, required: true },       // "JV-XXXXXX"
    jobPostingId: { type: String, required: true },  // JobPosting._id as string
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    cvFile: { type: String, required: true },        // filename in /uploads
    cvMime: { type: String, default: 'application/pdf' },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'cancelled'],
      default: 'pending',
    },
    // TODO: submittedBy → replace with real Employee ObjectId when real auth exists
    submittedBy: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Applicant', applicantSchema);