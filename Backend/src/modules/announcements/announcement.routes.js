import { Router } from "express";
import { announcementController } from "./announcement.controller.js";

const announcementRouter = Router();

announcementRouter.get("/", announcementController.list);
announcementRouter.post("/", announcementController.create);
announcementRouter.put("/:id", announcementController.update);
announcementRouter.delete("/:id", announcementController.remove);

export { announcementRouter };
