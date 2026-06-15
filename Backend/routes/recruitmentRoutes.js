import express from 'express';
import multer from 'multer';
import path from 'path';
import ctrl from '../controllers/recruitmentController.js';

const router = express.Router();

// ── Multer setup ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const pdfOnly = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Job postings
router.get('/jobs', ctrl.getAllJobs);
router.get('/jobs/:id', ctrl.getJobById);
router.post('/jobs', pdfOnly.single('attachment'), ctrl.createJob);
router.put('/jobs/:id', pdfOnly.single('attachment'), ctrl.updateJob);
router.delete('/jobs/:id', ctrl.deleteJob);

// Applications
router.post('/apply/:jobPostingId', pdfOnly.single('cv'), ctrl.applyForJob);
router.get('/applicants', ctrl.getApplicants);
router.delete('/applicants/:id', ctrl.cancelApplicant);

// Interview schedules
router.post('/schedule/:applicantId', ctrl.scheduleInterview);
router.get('/schedules/:employeeId', ctrl.getEmployeeSchedules);

export default router;