import { authService } from "../modules/auth/auth.service.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let payload;
    try {
      payload = authService.verifyToken(token);
    } catch {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    const user = await authService.getCurrentUser(payload?.sub);
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.auth = payload;
    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
