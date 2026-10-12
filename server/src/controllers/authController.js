import { Admin } from "../models/Admin.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken, cookieOptions } from "../middleware/auth.js";
import { env } from "../config/env.js";
import {
  requireFields,
  assertStrongPassword,
  isEmail,
} from "../utils/validate.js";
import { storage } from "../services/storage.js";

/* The only admin shape that ever reaches the client. */
const publicProfile = (admin) => ({
  id: admin._id,
  name: admin.name,
  designation: admin.designation,
  email: admin.email,
  avatar: admin.avatar?.url || "",
  lastLoginAt: admin.lastLoginAt,
  createdAt: admin.createdAt,
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);

  const email = String(req.body.email).trim().toLowerCase();

  const admin = await Admin.findOne({ email }).select("+passwordHash");

  /*
    The same message for a missing account and a wrong password, so the
    endpoint cannot be used to enumerate valid admin emails.
  */
  const invalid = ApiError.unauthorized("Invalid email or password");

  if (!admin) throw invalid;

  const matches = await admin.verifyPassword(req.body.password);
  if (!matches) throw invalid;

  if (!admin.isActive) {
    throw ApiError.forbidden(
      "This account has been deactivated. Contact another admin."
    );
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin._id);

  res.cookie(env.cookieName, token, cookieOptions());

  res.json({
    success: true,
    /* Returned for clients that cannot rely on cross-site cookies. */
    token,
    admin: publicProfile(admin),
  });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.cookieName, { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true, message: "Signed out" });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: publicProfile(req.admin) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const admin = req.admin;

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) throw ApiError.badRequest("Name cannot be empty");
    admin.name = name;
  }

  if (req.body.designation !== undefined) {
    const designation = String(req.body.designation).trim();
    if (!designation) {
      throw ApiError.badRequest("Designation cannot be empty");
    }
    admin.designation = designation;
  }

  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim().toLowerCase();

    if (!isEmail(email)) throw ApiError.badRequest("Invalid email address");

    const clash = await Admin.findOne({
      email,
      _id: { $ne: admin._id },
    });

    if (clash) throw ApiError.conflict("That email is already in use");

    admin.email = email;
  }

  if (req.file) {
    const previous = admin.avatar;
    admin.avatar = await storage.saveFile(req.file, "avatars");
    await storage.removeFile(previous);
  }

  await admin.save();

  res.json({ success: true, admin: publicProfile(admin) });
});

export const changePassword = asyncHandler(async (req, res) => {
  requireFields(req.body, [
    "currentPassword",
    "newPassword",
    "confirmPassword",
  ]);

  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw ApiError.badRequest("New passwords do not match");
  }

  if (newPassword === currentPassword) {
    throw ApiError.badRequest(
      "New password must be different from the current password"
    );
  }

  assertStrongPassword(newPassword);

  const admin = await Admin.findById(req.admin._id).select("+passwordHash");

  const matches = await admin.verifyPassword(currentPassword);

  if (!matches) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  await admin.setPassword(newPassword);
  await admin.save();

  /* Force a fresh sign-in with the new credentials. */
  res.clearCookie(env.cookieName, { ...cookieOptions(), maxAge: undefined });

  res.json({
    success: true,
    message: "Password updated. Please sign in again.",
  });
});
