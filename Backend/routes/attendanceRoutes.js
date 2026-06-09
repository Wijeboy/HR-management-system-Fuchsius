import express from 'express';
import ctrl from '../controllers/attendanceController.js';

const router = express.Router();

// Employee routes
router.post('/checkin', ctrl.checkIn);
router.post('/checkout', ctrl.checkOut);
router.get('/today/:employeeId', ctrl.getTodayStatus);
router.get('/history/:employeeId', ctrl.getHistory);
router.get('/weekly/:employeeId', ctrl.getWeekly);

// HR routes
router.get('/daily', ctrl.getDailyAttendance);
router.get('/stats', ctrl.getDailyStats);

export default router;