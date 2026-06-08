const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');

// Employee routes
router.post('/checkin', ctrl.checkIn);
router.post('/checkout', ctrl.checkOut);
router.get('/today/:employeeId', ctrl.getTodayStatus);
router.get('/history/:employeeId', ctrl.getHistory);
router.get('/weekly/:employeeId', ctrl.getWeekly);

// HR routes
router.get('/daily', ctrl.getDailyAttendance);
router.get('/stats', ctrl.getDailyStats);

module.exports = router;