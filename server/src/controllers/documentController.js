import path from "node:path";
import fs from "node:fs";
import { DocumentFile } from "../models/DocumentFile.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFields, pick } from "../utils/validate.js";
import { buildSearch, parsePagination, parseSort } from "../utils/query.js";
import { storage, UPLOAD_ROOT } from "../services/storage.js";
import { DOCUMENT_CATEGORIES } from "../constants/enums.js";

const SORTABLE = ["name", "category", "createdAt"];

export const listDocuments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 50);

  const filter = {};

  const search = buildSearch(req.query.search, ["name", "description"]);
  if (search) Object.assign(filter, search);

  if (
    req.query.category &&
    DOCUMENT_CATEGORIES.includes(req.query.category)
  ) {
    filter.category = req.query.category;
  }

  const [items, total] = await Promise.all([
    DocumentFile.find(filter)
      .sort(parseSort(req.query, SORTABLE))
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "name designation"),
    DocumentFile.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    total,
    page,
    limit,
    categories: DOCUMENT_CATEGORIES,
  });
});

export const getDocument = asyncHandler(async (req, res) => {
  const item = await DocumentFile.findById(req.params.id).populate(
    "uploadedBy",
    "name designation"
  );

  if (!item) throw ApiError.notFound("Document not found");

  res.json({ success: true, item });
});

export const createDocument = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name"]);

  if (!req.file) throw ApiError.badRequest("A document file is required");

  const document = new DocumentFile({
    ...pick(req.body, ["name", "category", "description"]),
    uploadedBy: req.admin._id,
  });

  document.file = await storage.saveFile(req.file, "documents");

  await document.save();

  res.status(201).json({ success: true, item: document });
});

/* Rename, recategorise, and optionally replace the underlying file. */
export const updateDocument = asyncHandler(async (req, res) => {
  const document = await DocumentFile.findById(req.params.id);
  if (!document) throw ApiError.notFound("Document not found");

  Object.assign(
    document,
    pick(req.body, ["name", "category", "description"])
  );

  if (req.file) {
    const previous = document.file;
    document.file = await storage.saveFile(req.file, "documents");
    await storage.removeFile(previous);
  }

  await document.save();

  res.json({ success: true, item: document });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await DocumentFile.findById(req.params.id);
  if (!document) throw ApiError.notFound("Document not found");

  await storage.removeFile(document.file);
  await document.deleteOne();

  res.json({ success: true, message: "Document deleted" });
});

/*
  Streams the file back as an attachment under its original name.
  Cloudinary-hosted files are redirected to their CDN URL instead.
*/
export const downloadDocument = asyncHandler(async (req, res) => {
  const document = await DocumentFile.findById(req.params.id);
  if (!document) throw ApiError.notFound("Document not found");

  const stored = document.file;

  if (stored.provider === "cloudinary") {
    res.redirect(stored.url);
    return;
  }

  const target = path.resolve(UPLOAD_ROOT, stored.publicId || "");

  /* Refuse any path that resolves outside the uploads directory. */
  if (!target.startsWith(UPLOAD_ROOT + path.sep) || !fs.existsSync(target)) {
    throw ApiError.notFound("The stored file is no longer available");
  }

  const fileName =
    stored.originalName || `${document.name}${path.extname(target)}`;

  res.download(target, fileName);
});
