import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalDevOrigin && process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked for this origin"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);

export { app };
