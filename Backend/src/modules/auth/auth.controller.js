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

      res.json({ success: true, token: result.token, user: result.user });
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

      res.json({ success: true, user: req.authUser });
    } catch (error) {
      next(error);
    }
  },

  async logout(_req, res, next) {
    try {
      res.json({ success: true, message: "Logged out" });
    } catch (error) {
      next(error);
    }
  },
};
