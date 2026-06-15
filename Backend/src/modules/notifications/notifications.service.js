import Notification from "../../../models/Notification.js";

export const notificationsService = {
  async getNotifications(userId) {
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  },

  async markRead(id) {
    try {
      return await Notification.findByIdAndUpdate(id, { read: true }, { new: true }).lean();
    } catch {
      return null;
    }
  },

  async markAllRead(userId) {
    const result = await Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true }
    );

    return { updated: result.modifiedCount };
  },
};
