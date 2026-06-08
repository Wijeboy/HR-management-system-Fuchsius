const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');

router.get('/:userId', ctrl.getNotifications);
router.put('/mark-all-read', ctrl.markAllRead);
router.put('/:id/read', ctrl.markRead);

module.exports = router;