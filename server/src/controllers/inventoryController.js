import { Inventory } from "../models/Inventory.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFields, pick } from "../utils/validate.js";
import { buildSearch, parsePagination, parseSort } from "../utils/query.js";
import { storage } from "../services/storage.js";

const SORTABLE = ["name", "quantity", "createdAt", "updatedAt"];

const parseQuantity = (value) => {
  const quantity = Number(value);

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw ApiError.badRequest("Quantity must be a number of 0 or more");
  }

  return Math.floor(quantity);
};

export const listInventory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 50);

  const filter = {};

  const search = buildSearch(req.query.search, ["name", "category"]);
  if (search) Object.assign(filter, search);

  if (req.query.category) filter.category = req.query.category;

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .sort(parseSort(req.query, SORTABLE, "name"))
      .skip(skip)
      .limit(limit),
    Inventory.countDocuments(filter),
  ]);

  res.json({ success: true, items, total, page, limit });
});

export const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw ApiError.notFound("Inventory item not found");

  res.json({ success: true, item });
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "quantity"]);

  const item = new Inventory({
    ...pick(req.body, ["name", "category", "notes"]),
    quantity: parseQuantity(req.body.quantity),
  });

  if (req.file) {
    item.image = await storage.saveFile(req.file, "inventory");
  }

  await item.save();

  res.status(201).json({ success: true, item });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw ApiError.notFound("Inventory item not found");

  Object.assign(item, pick(req.body, ["name", "category", "notes"]));

  if (req.body.quantity !== undefined) {
    item.quantity = parseQuantity(req.body.quantity);
  }

  if (req.file) {
    const previous = item.image;
    item.image = await storage.saveFile(req.file, "inventory");
    await storage.removeFile(previous);
  }

  await item.save();

  res.json({ success: true, item });
});

/* Quick +/- adjustment used by the inventory cards. */
export const adjustQuantity = asyncHandler(async (req, res) => {
  const delta = Number(req.body.delta);

  if (!Number.isFinite(delta)) {
    throw ApiError.badRequest("delta must be a number");
  }

  const item = await Inventory.findById(req.params.id);
  if (!item) throw ApiError.notFound("Inventory item not found");

  item.quantity = Math.max(0, item.quantity + Math.floor(delta));
  await item.save();

  res.json({ success: true, item });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw ApiError.notFound("Inventory item not found");

  await storage.removeFile(item.image);
  await item.deleteOne();

  res.json({ success: true, message: "Inventory item removed" });
});
