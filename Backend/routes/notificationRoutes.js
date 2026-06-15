import express from 'express';
import ctrl from '../controllers/notificationController.js';

const router = express.Router();

router.get('/:userId', ctrl.getNotifications);
router.put('/mark-all-read', ctrl.markAllRead);
router.put('/:id/read', ctrl.markRead);

export default router;