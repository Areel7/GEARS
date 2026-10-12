import { Member } from "../models/Member.js";
import { CoreTeam } from "../models/CoreTeam.js";
import { Registration } from "../models/Registration.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFields, pick, isEmail } from "../utils/validate.js";
import { buildSearch, parsePagination, parseSort } from "../utils/query.js";
import { sendExport } from "../services/exporter.js";
import { syncMemberToCoreTeam } from "../services/promotion.js";
import { MEMBER_STATUSES } from "../constants/enums.js";
import { storage } from "../services/storage.js";

const SORTABLE = ["name", "rollNumber", "status", "createdAt"];

const buildFilter = (query) => {
  const filter = {};

  const search = buildSearch(query.search, [
    "name",
    "rollNumber",
    "email",
    "phone",
  ]);

  if (search) Object.assign(filter, search);

  if (query.status && MEMBER_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  return filter;
};

export const listMembers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = buildFilter(req.query);

  const [items, total, counts] = await Promise.all([
    Member.find(filter)
      .sort(parseSort(req.query, SORTABLE))
      .skip(skip)
      .limit(limit),
    Member.countDocuments(filter),
    Member.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    items,
    total,
    page,
    limit,
    counts: Object.fromEntries(
      counts.map((entry) => [entry._id, entry.count])
    ),
  });
});

export const getMember = asyncHandler(async (req, res) => {
  const item = await Member.findById(req.params.id);
  if (!item) throw ApiError.notFound("Member not found");

  const appointment = await CoreTeam.findOne({
    member: item._id,
    isActive: true,
  });

  res.json({ success: true, item, coreTeam: appointment });
});

export const createMember = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "rollNumber"]);

  const payload = pick(req.body, [
    "name",
    "rollNumber",
    "phone",
    "email",
    "status",
  ]);

  if (payload.email && !isEmail(payload.email)) {
    throw ApiError.badRequest("Invalid email address");
  }

  if (payload.status && !MEMBER_STATUSES.includes(payload.status)) {
    throw ApiError.badRequest("Invalid member status");
  }

  const rollNumber = String(payload.rollNumber).trim().toUpperCase();

  const existing = await Member.findOne({ rollNumber });

  if (existing) {
    throw ApiError.conflict(
      "A member with this roll number already exists"
    );
  }

  const member = await Member.create({ ...payload, rollNumber });

  await syncMemberToCoreTeam(member);

  res.status(201).json({ success: true, item: member });
});

export const updateMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw ApiError.notFound("Member not found");

  const payload = pick(req.body, ["name", "rollNumber", "phone", "email"]);

  if (payload.email && !isEmail(payload.email)) {
    throw ApiError.badRequest("Invalid email address");
  }

  if (payload.rollNumber) {
    const rollNumber = String(payload.rollNumber).trim().toUpperCase();

    const clash = await Member.findOne({
      rollNumber,
      _id: { $ne: member._id },
    });

    if (clash) {
      throw ApiError.conflict(
        "Another member already uses this roll number"
      );
    }

    payload.rollNumber = rollNumber;
  }

  Object.assign(member, payload);

  if (req.body.status !== undefined) {
    if (!MEMBER_STATUSES.includes(req.body.status)) {
      throw ApiError.badRequest("Invalid member status");
    }
    member.status = req.body.status;
  }

  await member.save();

  const appointment = await syncMemberToCoreTeam(member);

  res.json({ success: true, item: member, coreTeam: appointment });
});

/*
  Status-only change. Promoting to "Core Member" creates or reactivates
  a core team appointment; any other status retires the active one
  without deleting it.
*/
export const updateMemberStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!MEMBER_STATUSES.includes(status)) {
    throw ApiError.badRequest("Invalid member status");
  }

  const member = await Member.findById(req.params.id);
  if (!member) throw ApiError.notFound("Member not found");

  member.status = status;
  await member.save();

  const appointment = await syncMemberToCoreTeam(member);

  res.json({
    success: true,
    item: member,
    coreTeam: appointment,
    message: appointment
      ? `${member.name} is now available in Core Team.`
      : "Status updated.",
  });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw ApiError.notFound("Member not found");

  /* Remove dependent core team records and their stored images. */
  const appointments = await CoreTeam.find({ member: member._id });

  for (const appointment of appointments) {
    await storage.removeFile(appointment.image);
    await storage.removeFile(appointment.homeImage);
    await appointment.deleteOne();
  }

  /* Unlink the registration so it does not point at a missing member. */
  await Registration.updateMany(
    { memberId: member._id },
    { $set: { memberId: null } }
  );

  await member.deleteOne();

  res.json({ success: true, message: "Member removed" });
});

const EXPORT_COLUMNS = [
  { header: "Name", key: "name", width: 26 },
  { header: "Roll Number", key: "rollNumber", width: 22 },
  { header: "Phone", key: "phone", width: 16 },
  { header: "Email", key: "email", width: 30 },
  { header: "Status", key: "status", width: 14 },
  { header: "Joined", key: "createdAt", width: 18 },
];

export const exportMembers = asyncHandler(async (req, res) => {
  const format = req.query.format === "xlsx" ? "xlsx" : "csv";

  const rows = await Member.find(buildFilter(req.query))
    .sort("-createdAt")
    .lean();

  await sendExport(res, format, EXPORT_COLUMNS, rows, "gears-members");
});
