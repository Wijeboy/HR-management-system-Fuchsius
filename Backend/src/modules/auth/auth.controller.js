import { authService } from "./auth.service.js";

export const authController = {
  async login(req, res, next) {
    try {
      const identifier = req.body?.identifier || req.body?.email || "";

      const result = await authService.login({
        identifier,
        password: req.body?.password,
        role: req.body?.role,
      });

      if (result.error) {
        res.status(result.status || 400).json({ message: result.error });
        return;
      }

      res.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      if (!req.authUser) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      res.json({
        success: true,
        user: req.authUser,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      if (!req.authUser) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const result = await authService.updateProfile(
        req.authUser.id,
        req.body || {}
      );

      if (!result) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (result.error) {
        res.status(result.status || 400).json({ message: result.error });
        return;
      }

      res.json({
        success: true,
        user: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfileImage(req, res, next) {
    try {
      if (!req.authUser) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: "Profile image is required" });
        return;
      }

      const profileImage = `/uploads/profiles/${req.file.filename}`;

      const user = await authService.updateProfileImage(
        req.authUser.id,
        profileImage
      );

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        success: true,
        user,
        message: "Profile image updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteProfileImage(req, res, next) {
    try {
      if (!req.authUser) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await authService.deleteProfileImage(req.authUser.id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        success: true,
        user,
        message: "Profile image deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(_req, res, next) {
    try {
      res.json({
        success: true,
        message: "Logged out",
      });
    } catch (error) {
      next(error);
    }
  },
};
