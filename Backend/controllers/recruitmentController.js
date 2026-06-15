const recruitmentService = require('../services/recruitmentService');

// ── Job Postings ──────────────────────────────────────────────────────────────

/**
 * GET /api/recruitment/jobs?search=JV-
 */
const getAllJobs = async (req, res) => {
  try {
    const jobs = await recruitmentService.getAllJobPostings(req.query.search || '');
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/recruitment/jobs/:id
 */
const getJobById = async (req, res) => {
  try {
    const job = await recruitmentService.getJobPostingById(req.params.id);
    res.json({ job });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/**
 * POST /api/recruitment/jobs   multipart: jobTitle, department, jobType, workMode, closingDate, file
 */
const createJob = async (req, res) => {
  try {
    const { jobTitle, department, jobType, workMode, closingDate } = req.body;
    if (!jobTitle || !department || !jobType || !workMode || !closingDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const job = await recruitmentService.createJobPosting(req.body, req.file || null);
    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PUT /api/recruitment/jobs/:id
 */
const updateJob = async (req, res) => {
  try {
    const job = await recruitmentService.updateJobPosting(req.params.id, req.body, req.file || null);
    res.json({ success: true, job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE /api/recruitment/jobs/:id
 */
const deleteJob = async (req, res) => {
  try {
    await recruitmentService.deleteJobPosting(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── Applicants ────────────────────────────────────────────────────────────────

/**
 * POST /api/recruitment/apply/:jobPostingId   multipart: applicantName, email, employeeId, file
 */
const applyForJob = async (req, res) => {
  try {
    const { applicantName, email, employeeId } = req.body;
    if (!applicantName || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    const applicant = await recruitmentService.submitApplication(
      req.params.jobPostingId,
      { applicantName, email, employeeId },
      req.file || null
    );
    res.status(201).json({ success: true, applicant });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/recruitment/applicants
 */
const getApplicants = async (req, res) => {
  try {
    const applicants = await recruitmentService.getAllApplicants();
    res.json({ applicants });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/recruitment/applicants/:id   (cancel)
 */
const cancelApplicant = async (req, res) => {
  try {
    await recruitmentService.cancelApplicant(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── Interview Schedules ───────────────────────────────────────────────────────

/**
 * POST /api/recruitment/schedule/:applicantId
 * Body: { interviewDate, interviewTime, meetingLink, duration, employeeId }
 */
const scheduleInterview = async (req, res) => {
  try {
    const { interviewDate, interviewTime, meetingLink, duration, employeeId } = req.body;
    if (!interviewDate || !interviewTime || !meetingLink || !duration) {
      return res.status(400).json({ message: 'All schedule fields are required' });
    }
    const schedule = await recruitmentService.scheduleInterview(req.params.applicantId, req.body);
    res.status(201).json({ success: true, schedule });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/recruitment/schedules/:employeeId?search=
 */
const getEmployeeSchedules = async (req, res) => {
  try {
    const schedules = await recruitmentService.getEmployeeSchedules(
      req.params.employeeId,
      req.query.search || ''
    );
    res.json({ schedules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getApplicants,
  cancelApplicant,
  scheduleInterview,
  getEmployeeSchedules,
};