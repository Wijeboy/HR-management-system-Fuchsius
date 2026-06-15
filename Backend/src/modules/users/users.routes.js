import { Router } from "express";
import { usersController } from "./users.controller.js";

const usersRouter = Router();

usersRouter.get("/", usersController.list);
usersRouter.get("/:employeeId", usersController.getByEmployeeId);
usersRouter.post("/", usersController.create);
usersRouter.put("/:employeeId", usersController.update);
usersRouter.delete("/:employeeId", usersController.remove);

export { usersRouter };
