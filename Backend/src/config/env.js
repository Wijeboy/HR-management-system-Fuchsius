import "dotenv/config";

const frontendOriginEnv =
  process.env.FRONTEND_URL ||
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173";

const frontendOrigins = frontendOriginEnv
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 5020,
  frontendOrigins,
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};
