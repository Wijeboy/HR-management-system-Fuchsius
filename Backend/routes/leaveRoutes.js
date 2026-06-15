const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/leaveController');
const { requireRoles } = require('../middleware/authMiddleware');

// ─── Multer setup for supporting documents ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images and PDFs are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Employee routes
router.post('/submit', upload.single('supportingDocument'), ctrl.submitLeave);
router.put('/:id', upload.single('supportingDocument'), ctrl.updateLeave);
router.delete('/:id', ctrl.deleteLeave);
router.get('/balance/:employeeId', ctrl.getBalance);
router.get('/history/:employeeId', ctrl.getHistory);

// HR routes
router.get('/pending', requireRoles('admin', 'hr'), ctrl.getPending);
router.get('/approved', requireRoles('admin', 'hr'), ctrl.getApproved);
router.get('/rejected', requireRoles('admin', 'hr'), ctrl.getRejected);
router.post('/:id/approve', requireRoles('admin', 'hr'), ctrl.approveLeave);
router.post('/:id/reject', requireRoles('admin', 'hr'), ctrl.rejectLeave);

// Single request view
router.get('/:id', ctrl.getSingleRequest);

module.exports = router;