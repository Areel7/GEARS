import { CoreTeam } from "../models/CoreTeam.js";
import { Member } from "../models/Member.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pick, toBoolean } from "../utils/validate.js";
import { parsePagination, escapeRegex } from "../utils/query.js";
import { storage } from "../services/storage.js";
import { sendExport } from "../services/exporter.js";
import {
  MEMBER_STATUS,
  CORE_TEAM_DESIGNATIONS,
} from "../constants/enums.js";

const EDITABLE = [
  "designation",
  "description",
  "startYear",
  "endYear",
  "order",
];

/*
  Core team records are always read with the member populated, so the
  name / roll / email shown in the admin and on the public site can
  never drift from the Member record.
*/
const withMember = (query) =>
  query.populate("member", "name rollNumber email phone status");

export const listCoreTeam = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 100);

  const filter = {};

  const active = toBoolean(req.query.isActive);
  if (active !== undefined) filter.isActive = active;

  if (req.query.designation) {
    filter.designation = req.query.designation;
  }

  /*
    Searching by member name means filtering on the referenced
    collection first, then restricting by the resulting ids.
  */
  const search = String(req.query.search || "").trim();

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");

    const memberIds = await Member.find({
      $or: [{ name: pattern }, { rollNumber: pattern }, { email: pattern }],
    }).distinct("_id");

    filter.$or = [{ member: { $in: memberIds } }, { designation: pattern }];
  }

  const [items, total] = await Promise.all([
    withMember(
      CoreTeam.find(filter).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit)
    ),
    CoreTeam.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    total,
    page,
    limit,
    designations: CORE_TEAM_DESIGNATIONS,
  });
});

export const getCoreTeamMember = asyncHandler(async (req, res) => {
  const item = await withMember(CoreTeam.findById(req.params.id));
  if (!item) throw ApiError.notFound("Core team record not found");

  res.json({ success: true, item });
});

/* Members eligible to be added manually to the core team. */
export const listEligibleMembers = asyncHandler(async (_req, res) => {
  const assigned = await CoreTeam.find({ isActive: true }).distinct("member");

  const items = await Member.find({
    _id: { $nin: assigned },
    status: { $ne: MEMBER_STATUS.TERMINATE },
  })
    .sort("name")
    .select("name rollNumber email status");

  res.json({ success: true, items });
});

export const createCoreTeamMember = asyncHandler(async (req, res) => {
  const memberId = req.body.member || req.body.memberId;

  if (!memberId) {
    throw ApiError.badRequest("Select a member to add to the core team");
  }

  const member = await Member.findById(memberId);
  if (!member) throw ApiError.notFound("Member not found");

  const designation = String(req.body.designation || "").trim();
  if (!designation) throw ApiError.badRequest("Designation is required");

  const existing = await CoreTeam.findOne({
    member: member._id,
    isActive: true,
  });

  if (existing) {
    throw ApiError.conflict(
      "This member already has an active core team record"
    );
  }

  const record = new CoreTeam({
    ...pick(req.body, EDITABLE),
    member: member._id,
    designation,
    isActive: true,
  });

  if (req.files?.image?.[0]) {
    record.image = await storage.saveFile(req.files.image[0], "core-team");
  }

  if (req.files?.homeImage?.[0]) {
    record.homeImage = await storage.saveFile(
      req.files.homeImage[0],
      "core-team"
    );
  }

  await record.save();

  /* Keep the member status consistent with the new appointment. */
  if (member.status !== MEMBER_STATUS.CORE_MEMBER) {
    member.status = MEMBER_STATUS.CORE_MEMBER;
    await member.save();
  }

  res.status(201).json({
    success: true,
    item: await withMember(CoreTeam.findById(record._id)),
  });
});

export const updateCoreTeamMember = asyncHandler(async (req, res) => {
  const record = await CoreTeam.findById(req.params.id);
  if (!record) throw ApiError.notFound("Core team record not found");

  Object.assign(record, pick(req.body, EDITABLE));

  const showOnHome = toBoolean(req.body.showOnHome);
  if (showOnHome !== undefined) record.showOnHome = showOnHome;

  if (req.files?.image?.[0]) {
    const previous = record.image;
    record.image = await storage.saveFile(req.files.image[0], "core-team");
    await storage.removeFile(previous);
  }

  if (req.files?.homeImage?.[0]) {
    const previous = record.homeImage;
    record.homeImage = await storage.saveFile(
      req.files.homeImage[0],
      "core-team"
    );
    await storage.removeFile(previous);
  }

  await record.save();

  res.json({
    success: true,
    item: await withMember(CoreTeam.findById(record._id)),
  });
});

/*
  Removing someone from the core team demotes them back to Member.
  The underlying Member record is never deleted here.
*/
export const removeFromCoreTeam = asyncHandler(async (req, res) => {
  const record = await CoreTeam.findById(req.params.id);
  if (!record) throw ApiError.notFound("Core team record not found");

  const permanent = toBoolean(req.query.permanent) === true;

  const member = await Member.findById(record.member);

  if (member && member.status === MEMBER_STATUS.CORE_MEMBER) {
    member.status = MEMBER_STATUS.MEMBER;
    await member.save();
  }

  if (permanent) {
    await storage.removeFile(record.image);
    await storage.removeFile(record.homeImage);
    await record.deleteOne();
  } else {
    record.isActive = false;
    await record.save();
  }

  res.json({
    success: true,
    message: "Removed from the core team. The member record was kept.",
  });
});

export const exportCoreTeam = asyncHandler(async (req, res) => {
  const format = req.query.format === "xlsx" ? "xlsx" : "csv";

  const records = await withMember(
    CoreTeam.find({ isActive: true }).sort({ order: 1, createdAt: 1 })
  ).lean();

  const rows = records.map((record) => ({
    name: record.member?.name || "",
    rollNumber: record.member?.rollNumber || "",
    email: record.member?.email || "",
    phone: record.member?.phone || "",
    designation: record.designation,
    description: record.description,
  }));

  const columns = [
    { header: "Name", key: "name", width: 26 },
    { header: "Roll Number", key: "rollNumber", width: 22 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Designation", key: "designation", width: 22 },
    { header: "Description", key: "description", width: 50 },
  ];

  await sendExport(res, format, columns, rows, "gears-core-team");
});
