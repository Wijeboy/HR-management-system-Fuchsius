import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { uploadProfileImage } from "../../middleware/upload.js";
import { authController } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/login", authController.login);

authRouter.get("/me", requireAuth, authController.me);

authRouter.put("/profile", requireAuth, authController.updateProfile);

authRouter.put(
  "/profile/photo",
  requireAuth,
  uploadProfileImage.single("profileImage"),
  authController.updateProfileImage
);

authRouter.delete(
  "/profile/photo",
  requireAuth,
  authController.deleteProfileImage
);

authRouter.post("/logout", authController.logout);

export { authRouter };
