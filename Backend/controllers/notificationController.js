import Notification from '../models/Notification.js';

/**
 * GET /api/notifications/:userId?role=
 */
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(20);
    const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/notifications/:id/read
 */
const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/notifications/mark-all-read
 * Body: { userId }
 */
const markAllRead = async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ recipientId: userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default { getNotifications, markRead, markAllRead };