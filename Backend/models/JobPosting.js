const mongoose = require('mongoose');

/**
 * JobPosting Model
 * ----------------
 * Stores job vacancy posts created by HR managers.
 * uniqueCode: auto-generated "JV-XXXXXX" format
 */
const jobPostingSchema = new mongoose.Schema(
  {
    uniqueCode: { type: String, unique: true, required: true }, // e.g. "JV-482910"
    jobTitle: { type: String, required: true },
    department: { type: String, required: true },
    jobType: { type: String, enum: ['full-time', 'part-time', 'intern'], required: true },
    workMode: { type: String, enum: ['on-site', 'remote', 'hybrid'], required: true },
    closingDate: { type: Date, required: true },
    attachmentFile: { type: String, required: true },   // filename in /uploads
    attachmentMime: { type: String, default: 'application/pdf' },
    isActive: { type: Boolean, default: true },
    // TODO: createdBy → replace with real HR user ObjectId ref when integrating real auth
    createdBy: { type: String, default: 'user_hr_001' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobPosting', jobPostingSchema);