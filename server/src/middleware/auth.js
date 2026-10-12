import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const signToken = (adminId) =>
  jwt.sign({ sub: String(adminId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction || env.cookieCrossSite,
  sameSite: env.cookieCrossSite ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const readToken = (req) => {
  const fromCookie = req.cookies?.[env.cookieName];
  if (fromCookie) return fromCookie;

  /*
    Bearer fallback so the API still works from environments where
    third-party cookies are blocked.
  */
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();

  return null;
};

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);

  if (!token) throw ApiError.unauthorized();

  let payload;

  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized("Session expired. Please sign in again.");
  }

  const admin = await Admin.findById(payload.sub);

  if (!admin) throw ApiError.unauthorized("Account no longer exists");
  if (!admin.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  req.admin = admin;
  next();
});
