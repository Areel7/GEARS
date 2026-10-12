import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { UPLOAD_ROOT, storage } from "./services/storage.js";

export const createApp = () => {
  const app = express();

  /* Needed for correct client IPs behind a proxy (rate limiting, cookies). */
  app.set("trust proxy", 1);

  app.use(
    helmet({
      /*
        Uploaded images are embedded by the frontend on a different
        origin, so they must not be blocked as cross-origin resources.
      */
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  /*
    Only the configured frontend origins may call the API with
    credentials. Same-origin and server-to-server calls (no Origin
    header) are allowed through.
  */
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientUrls.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  /* Locally stored uploads. Cloudinary serves its own files. */
  app.use(
    "/uploads",
    express.static(UPLOAD_ROOT, {
      maxAge: "7d",
      index: false,
      dotfiles: "deny",
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      storage: storage.driverName,
      time: new Date().toISOString(),
    });
  });

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
