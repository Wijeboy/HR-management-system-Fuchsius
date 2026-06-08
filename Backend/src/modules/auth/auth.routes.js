import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authController } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/logout", authController.logout);

export { authRouter };
