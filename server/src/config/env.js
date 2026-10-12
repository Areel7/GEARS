import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/* server/.env */
dotenv.config({
  path: path.resolve(here, "../../.env"),
});

const bool = (value, fallback = false) => {
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() === "true";
};

const int = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  port: int(process.env.PORT, 5000),

  mongoUri: process.env.MONGODB_URI || "",
  mongoDnsServers: (process.env.MONGODB_DNS_SERVERS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),

  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: process.env.COOKIE_NAME || "gears_admin_token",
  cookieCrossSite: bool(process.env.COOKIE_CROSS_SITE, false),

  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),

  publicApiUrl: (
    process.env.PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, ""),

  storageDriver: (process.env.STORAGE_DRIVER || "local").toLowerCase(),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "gears",
  },

  maxImageSize: int(process.env.MAX_IMAGE_SIZE, 5 * 1024 * 1024),
  maxDocumentSize: int(process.env.MAX_DOCUMENT_SIZE, 15 * 1024 * 1024),

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || "",
    designation: process.env.SEED_ADMIN_DESIGNATION || "",
    email: process.env.SEED_ADMIN_EMAIL || "",
    password: process.env.SEED_ADMIN_PASSWORD || "",
  },
};

/* Fail fast on missing critical secrets instead of running insecurely. */
export const assertEnv = () => {
  const missing = [];

  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", "
      )}. Copy server/.env.example to server/.env and fill them in.`
    );
  }

  if (env.isProduction && env.jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters in production."
    );
  }
};
