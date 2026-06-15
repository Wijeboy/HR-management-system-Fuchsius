import JobPosting from '../models/JobPosting.js';
import Applicant from '../models/Applicant.js';
import InterviewSchedule from '../models/InterviewSchedule.js';

/**
 * RecruitmentService
 * ------------------
 * All business logic for recruitment management.
 */

// ── Generate unique JV code ───────────────────────────────────────────────────
const generateUniqueCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    const nums = Math.floor(100000 + Math.random() * 900000); // 6 random digits
    code = `JV-${nums}`;
    exists = await JobPosting.findOne({ uniqueCode: code });
  }
  return code;
};

// ── Job Postings ──────────────────────────────────────────────────────────────

const createJobPosting = async (data, file) => {
  if (!file) throw new Error('Attachment PDF is required');
  const uniqueCode = await generateUniqueCode();
  const posting = await JobPosting.create({
    uniqueCode,
    jobTitle: data.jobTitle,
    department: data.department,
    jobType: data.jobType,
    workMode: data.workMode,
    closingDate: new Date(data.closingDate),
    attachmentFile: file.filename,
    attachmentMime: file.mimetype,
  });
  return posting;
};

const updateJobPosting = async (id, data, file) => {
  const update = {
    jobTitle: data.jobTitle,
    department: data.department,
    jobType: data.jobType,
    workMode: data.workMode,
    closingDate: new Date(data.closingDate),
  };
  if (file) {
    update.attachmentFile = file.filename;
    update.attachmentMime = file.mimetype;
  }
  const posting = await JobPosting.findByIdAndUpdate(id, update, { new: true });
  if (!posting) throw new Error('Job posting not found');
  return posting;
};

const deleteJobPosting = async (id) => {
  const posting = await JobPosting.findByIdAndDelete(id);
  if (!posting) throw new Error('Job posting not found');
  // Also delete related applicants and schedules
  const applicants = await Applicant.find({ jobPostingId: id.toString() });
  for (const app of applicants) {
    await InterviewSchedule.deleteMany({ applicantId: app._id.toString() });
  }
  await Applicant.deleteMany({ jobPostingId: id.toString() });
  return { success: true };
};

const getAllJobPostings = async (search = '') => {
  let query = {};
  if (search) query.uniqueCode = { $regex: search, $options: 'i' };
  return await JobPosting.find(query).sort({ createdAt: -1 });
};

const getJobPostingById = async (id) => {
  const posting = await JobPosting.findById(id);
  if (!posting) throw new Error('Job posting not found');
  return posting;
};

// ── Applicants ────────────────────────────────────────────────────────────────

const submitApplication = async (jobPostingId, data, file) => {
  if (!file) throw new Error('CV PDF is required');
  const posting = await JobPosting.findById(jobPostingId);
  if (!posting) throw new Error('Job posting not found');

  const applicant = await Applicant.create({
    jobCode: posting.uniqueCode,
    jobPostingId: jobPostingId.toString(),
    applicantName: data.applicantName,
    email: data.email,
    cvFile: file.filename,
    cvMime: file.mimetype,
    submittedBy: data.employeeId || null,
  });
  return applicant;
};

const getAllApplicants = async () => {
  return await Applicant.find({ status: { $ne: 'cancelled' } }).sort({ createdAt: -1 });
};

const cancelApplicant = async (applicantId) => {
  const applicant = await Applicant.findByIdAndUpdate(
    applicantId,
    { status: 'cancelled' },
    { new: true }
  );
  if (!applicant) throw new Error('Applicant not found');
  // Also remove their schedules
  await InterviewSchedule.deleteMany({ applicantId: applicantId.toString() });
  return { success: true };
};

// ── Interview Schedules ───────────────────────────────────────────────────────

const scheduleInterview = async (applicantId, data) => {
  const applicant = await Applicant.findById(applicantId);
  if (!applicant) throw new Error('Applicant not found');

  // Update applicant status
  applicant.status = 'scheduled';
  await applicant.save();

  const schedule = await InterviewSchedule.create({
    applicantId: applicantId.toString(),
    jobCode: applicant.jobCode,
    jobPostingId: applicant.jobPostingId,
    applicantName: applicant.applicantName,
    applicantEmail: applicant.email,
    employeeId: applicant.submittedBy || data.employeeId || 'EMP004',
    interviewDate: new Date(data.interviewDate),
    interviewTime: data.interviewTime,
    meetingLink: data.meetingLink,
    duration: data.duration,
  });

  return schedule;
};

/**
 * Get meeting calendar for a specific employee.
 * Returns all scheduled interviews for that employee.
 * TODO: When real auth exists, filter by req.user.employeeId
 */
const getEmployeeSchedules = async (employeeId, search = '') => {
  let query = { employeeId };
  if (search) query.jobCode = { $regex: search, $options: 'i' };
  return await InterviewSchedule.find(query).sort({ interviewDate: 1 });
};

export default {
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getAllJobPostings,
  getJobPostingById,
  submitApplication,
  getAllApplicants,
  cancelApplicant,
  scheduleInterview,
  getEmployeeSchedules,
};