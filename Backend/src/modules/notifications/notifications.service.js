import { prisma } from "../../lib/prisma.js";

export const notificationsService = {
  async getNotifications(userId) {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
    });

    return {
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
    };
  },

  async markRead(id) {
    try {
      return await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    } catch {
      return null;
    }
  },

  async markAllRead(userId) {
    const result = await prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    });

    return { updated: result.count };
  },
};
