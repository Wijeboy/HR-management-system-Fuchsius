import { Router } from "express";
import { notificationsController } from "./notifications.controller.js";

const notificationRouter = Router();

notificationRouter.get("/:userId", notificationsController.getNotifications);
notificationRouter.put("/mark-all-read", notificationsController.markAllRead);
notificationRouter.put("/:id/read", notificationsController.markRead);

export { notificationRouter };
