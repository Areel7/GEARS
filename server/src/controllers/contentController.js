import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pick, toBoolean } from "../utils/validate.js";
import { buildSearch, parsePagination } from "../utils/query.js";
import { storage } from "../services/storage.js";

/*
  President, Alumni, Leadership, Gallery and Home images all behave the
  same way: ordered, optionally-hidden records with one or two images.
  This factory gives each of them a full CRUD + reorder controller so
  the behaviour stays identical across resources.

  config: {
    model, label, folder,
    textFields, numberFields, booleanFields,
    imageFields: [{ name, required }],
    searchFields, defaultSort
  }
*/
export const createContentController = (config) => {
  const {
    model,
    label,
    folder,
    textFields = [],
    numberFields = [],
    booleanFields = [],
    imageFields = [],
    searchFields = [],
    defaultSort = { order: 1, createdAt: 1 },
  } = config;

  const applyBody = (doc, body) => {
    Object.assign(doc, pick(body, textFields));

    numberFields.forEach((field) => {
      if (body[field] === undefined) return;

      const value = Number(body[field]);
      if (Number.isFinite(value)) doc[field] = value;
    });

    booleanFields.forEach((field) => {
      const value = toBoolean(body[field]);
      if (value !== undefined) doc[field] = value;
    });
  };

  /* multer .fields() and .single() shape req.files differently. */
  const fileFor = (req, name) => {
    if (req.files?.[name]?.[0]) return req.files[name][0];
    if (req.file && name === imageFields[0]?.name) return req.file;
    return null;
  };

  const applyFiles = async (doc, req) => {
    for (const field of imageFields) {
      const file = fileFor(req, field.name);
      if (!file) continue;

      const previous = doc[field.name];
      doc[field.name] = await storage.saveFile(file, folder);

      /* Only clean up after the replacement is safely in place. */
      await storage.removeFile(previous);
    }
  };

  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, 100);

    const filter = {};

    const search = buildSearch(req.query.search, searchFields);
    if (search) Object.assign(filter, search);

    const active = toBoolean(req.query.isActive);
    if (active !== undefined && booleanFields.includes("isActive")) {
      filter.isActive = active;
    }

    const [items, total] = await Promise.all([
      model.find(filter).sort(defaultSort).skip(skip).limit(limit),
      model.countDocuments(filter),
    ]);

    res.json({ success: true, items, total, page, limit });
  });

  const getOne = asyncHandler(async (req, res) => {
    const item = await model.findById(req.params.id);
    if (!item) throw ApiError.notFound(`${label} not found`);

    res.json({ success: true, item });
  });

  const create = asyncHandler(async (req, res) => {
    const doc = new model({});

    applyBody(doc, req.body);
    await applyFiles(doc, req);

    imageFields.forEach((field) => {
      if (field.required && !doc[field.name]?.url) {
        throw ApiError.badRequest(`An image is required for this ${label}`);
      }
    });

    /* Append to the end of the list when no order is supplied. */
    if (req.body.order === undefined && numberFields.includes("order")) {
      doc.order = await model.countDocuments();
    }

    await doc.save();

    res.status(201).json({ success: true, item: doc });
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${label} not found`);

    applyBody(doc, req.body);
    await applyFiles(doc, req);
    await doc.save();

    res.json({ success: true, item: doc });
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await model.findById(req.params.id);
    if (!doc) throw ApiError.notFound(`${label} not found`);

    for (const field of imageFields) {
      await storage.removeFile(doc[field.name]);
    }

    await doc.deleteOne();

    res.json({ success: true, message: `${label} deleted` });
  });

  /* Accepts [{ id, order }] and writes the new positions in one go. */
  const reorder = asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!items.length) {
      throw ApiError.badRequest("Nothing to reorder");
    }

    const operations = items
      .filter((entry) => mongoose.isValidObjectId(entry.id))
      .map((entry, index) => ({
        updateOne: {
          filter: { _id: entry.id },
          update: {
            $set: {
              order: Number.isFinite(Number(entry.order))
                ? Number(entry.order)
                : index,
            },
          },
        },
      }));

    if (operations.length) await model.bulkWrite(operations);

    res.json({ success: true, message: "Order updated" });
  });

  return { list, getOne, create, update, remove, reorder };
};
