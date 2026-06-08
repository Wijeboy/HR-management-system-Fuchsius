import { notificationsService } from "./notifications.service.js";

const mapNotification = (notification) => (notification ? { ...notification, _id: notification.id } : notification);

export const notificationsController = {
  async getNotifications(req, res, next) {
    try {
      const result = await notificationsService.getNotifications(req.params.userId);
      res.json({
        ...result,
        notifications: (result.notifications || []).map(mapNotification),
      });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req, res, next) {
    try {
      const notification = await notificationsService.markRead(req.params.id);
      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }
      res.json({ success: true, notification: mapNotification(notification) });
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req, res, next) {
    try {
      if (!req.body?.userId) {
        res.status(400).json({ message: "userId is required" });
        return;
      }
      res.json({ success: true, ...(await notificationsService.markAllRead(req.body.userId)) });
    } catch (error) {
      next(error);
    }
  },
};
