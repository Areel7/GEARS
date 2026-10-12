import { Admin } from "../models/Admin.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  requireFields,
  assertStrongPassword,
  isEmail,
  toBoolean,
} from "../utils/validate.js";
import { buildSearch, parsePagination, parseSort } from "../utils/query.js";
import { storage } from "../services/storage.js";

const SORTABLE = ["name", "email", "designation", "createdAt", "lastLoginAt"];

export const listAdmins = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};

  const search = buildSearch(req.query.search, [
    "name",
    "email",
    "designation",
  ]);

  if (search) Object.assign(filter, search);

  const active = toBoolean(req.query.isActive);
  if (active !== undefined) filter.isActive = active;

  const [items, total] = await Promise.all([
    Admin.find(filter)
      .sort(parseSort(req.query, SORTABLE))
      .skip(skip)
      .limit(limit),
    Admin.countDocuments(filter),
  ]);

  res.json({ success: true, items, total, page, limit });
});

export const getAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw ApiError.notFound("Admin not found");

  res.json({ success: true, item: admin });
});

export const createAdmin = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "designation", "email", "password"]);

  const email = String(req.body.email).trim().toLowerCase();

  if (!isEmail(email)) throw ApiError.badRequest("Invalid email address");

  assertStrongPassword(req.body.password);

  const existing = await Admin.findOne({ email });
  if (existing) {
    throw ApiError.conflict("An admin with this email already exists");
  }

  const admin = new Admin({
    name: String(req.body.name).trim(),
    designation: String(req.body.designation).trim(),
    email,
    isActive: toBoolean(req.body.isActive) ?? true,
  });

  await admin.setPassword(req.body.password);

  if (req.file) {
    admin.avatar = await storage.saveFile(req.file, "avatars");
  }

  await admin.save();

  res.status(201).json({ success: true, item: admin });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw ApiError.notFound("Admin not found");

  const isSelf = String(admin._id) === String(req.admin._id);

  if (req.body.name !== undefined) {
    admin.name = String(req.body.name).trim();
  }

  if (req.body.designation !== undefined) {
    admin.designation = String(req.body.designation).trim();
  }

  if (req.body.email !== undefined) {
    const email = String(req.body.email).trim().toLowerCase();

    if (!isEmail(email)) throw ApiError.badRequest("Invalid email address");

    const clash = await Admin.findOne({ email, _id: { $ne: admin._id } });
    if (clash) throw ApiError.conflict("That email is already in use");

    admin.email = email;
  }

  const active = toBoolean(req.body.isActive);

  if (active !== undefined && active !== admin.isActive) {
    if (isSelf && !active) {
      throw ApiError.badRequest("You cannot deactivate your own account");
    }

    if (!active) {
      const remaining = await Admin.countDocuments({
        isActive: true,
        _id: { $ne: admin._id },
      });

      if (remaining === 0) {
        throw ApiError.badRequest(
          "At least one active admin account must remain"
        );
      }
    }

    admin.isActive = active;
  }

  if (req.file) {
    const previous = admin.avatar;
    admin.avatar = await storage.saveFile(req.file, "avatars");
    await storage.removeFile(previous);
  }

  await admin.save();

  res.json({ success: true, item: admin });
});

/* Resets another admin password. The existing one is never revealed. */
export const resetAdminPassword = asyncHandler(async (req, res) => {
  requireFields(req.body, ["newPassword"]);

  assertStrongPassword(req.body.newPassword);

  const admin = await Admin.findById(req.params.id).select("+passwordHash");
  if (!admin) throw ApiError.notFound("Admin not found");

  await admin.setPassword(req.body.newPassword);
  await admin.save();

  res.json({ success: true, message: "Password updated" });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw ApiError.notFound("Admin not found");

  if (String(admin._id) === String(req.admin._id)) {
    throw ApiError.badRequest("You cannot delete your own account");
  }

  const total = await Admin.countDocuments();

  if (total <= 1) {
    throw ApiError.badRequest("The last admin account cannot be deleted");
  }

  await storage.removeFile(admin.avatar);
  await admin.deleteOne();

  res.json({ success: true, message: "Admin removed" });
});
