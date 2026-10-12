import { Registration } from "../models/Registration.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireFields, pick } from "../utils/validate.js";
import { buildSearch, parsePagination, parseSort } from "../utils/query.js";
import { storage } from "../services/storage.js";
import { sendExport } from "../services/exporter.js";
import { syncRegistrationToMember } from "../services/promotion.js";
import {
  REGISTRATION_STATUS,
  REGISTRATION_STATUSES,
} from "../constants/enums.js";

const FORM_FIELDS = [
  "studentName",
  "rollNumber",
  "section",
  "semester",
  "fatherName",
  "cnic",
  "phone",
  "email",
  "gender",
];

const SORTABLE = [
  "studentName",
  "rollNumber",
  "semester",
  "status",
  "createdAt",
  "registrationDate",
];

/* ------------------------------------------------------------------
   PUBLIC SUBMISSION
------------------------------------------------------------------ */

export const submitRegistration = asyncHandler(async (req, res) => {
  /*
    Server-side enforcement of the registration switch. A direct POST
    while registration is off is rejected here, regardless of what the
    frontend chose to render.
  */
  const settings = await SiteSettings.getSettings();

  if (!settings.registrationEnabled) {
    throw ApiError.forbidden(
      settings.registrationClosedMessage ||
        "Registration is currently closed."
    );
  }

  requireFields(req.body, FORM_FIELDS);

  const payload = pick(req.body, FORM_FIELDS);

  const duplicate = await Registration.findOne({
    rollNumber: String(payload.rollNumber).trim().toUpperCase(),
    status: { $ne: REGISTRATION_STATUS.FAILED },
  });

  if (duplicate) {
    throw ApiError.conflict(
      "A registration with this roll number has already been submitted."
    );
  }

  const registration = new Registration({
    ...payload,
    semester: Number.parseInt(payload.semester, 10),
    source: "public",
    status: REGISTRATION_STATUS.PENDING,
  });

  if (req.file) {
    registration.picture = await storage.saveFile(
      req.file,
      "registrations"
    );
  }

  await registration.save();

  res.status(201).json({
    success: true,
    message: "Registration submitted successfully!",
    registration: { id: registration._id, status: registration.status },
  });
});

/* ------------------------------------------------------------------
   ADMIN
------------------------------------------------------------------ */

const buildFilter = (query) => {
  const filter = {};

  const search = buildSearch(query.search, [
    "studentName",
    "rollNumber",
    "email",
    "phone",
    "cnic",
  ]);

  if (search) Object.assign(filter, search);

  if (query.status && REGISTRATION_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.semester) {
    const semester = Number.parseInt(query.semester, 10);
    if (Number.isFinite(semester)) filter.semester = semester;
  }

  if (query.gender) filter.gender = query.gender;

  return filter;
};

export const listRegistrations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = buildFilter(req.query);

  const [items, total, counts] = await Promise.all([
    Registration.find(filter)
      .sort(parseSort(req.query, SORTABLE))
      .skip(skip)
      .limit(limit)
      .populate("memberId", "name rollNumber status"),
    Registration.countDocuments(filter),
    Registration.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
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

export const getRegistration = asyncHandler(async (req, res) => {
  const item = await Registration.findById(req.params.id).populate(
    "memberId",
    "name rollNumber status"
  );

  if (!item) throw ApiError.notFound("Registration not found");

  res.json({ success: true, item });
});

/* Manual entry by an admin; bypasses the public ON/OFF switch. */
export const createRegistration = asyncHandler(async (req, res) => {
  requireFields(req.body, FORM_FIELDS);

  const payload = pick(req.body, [...FORM_FIELDS, "notes"]);

  const registration = new Registration({
    ...payload,
    semester: Number.parseInt(payload.semester, 10),
    source: "admin",
    status: REGISTRATION_STATUSES.includes(req.body.status)
      ? req.body.status
      : REGISTRATION_STATUS.PENDING,
  });

  if (req.file) {
    registration.picture = await storage.saveFile(
      req.file,
      "registrations"
    );
  }

  await registration.save();

  /* Honour an admin who creates the record already marked as Member. */
  if (registration.status === REGISTRATION_STATUS.MEMBER) {
    await syncRegistrationToMember(registration);
  }

  res.status(201).json({ success: true, item: registration });
});

export const updateRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) throw ApiError.notFound("Registration not found");

  const payload = pick(req.body, [...FORM_FIELDS, "notes"]);

  Object.entries(payload).forEach(([key, value]) => {
    registration[key] = key === "semester" ? Number(value) : value;
  });

  if (req.body.status !== undefined) {
    if (!REGISTRATION_STATUSES.includes(req.body.status)) {
      throw ApiError.badRequest("Invalid registration status");
    }
    registration.status = req.body.status;
  }

  if (req.file) {
    const previous = registration.picture;
    registration.picture = await storage.saveFile(
      req.file,
      "registrations"
    );
    await storage.removeFile(previous);
  }

  await registration.save();

  const member = await syncRegistrationToMember(registration);

  res.json({ success: true, item: registration, member });
});

/*
  Status-only change. Moving a registration to "Member" creates or
  reactivates the linked Member record; moving it away leaves that
  member intact so history is not destroyed.
*/
export const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!REGISTRATION_STATUSES.includes(status)) {
    throw ApiError.badRequest("Invalid registration status");
  }

  const registration = await Registration.findById(req.params.id);
  if (!registration) throw ApiError.notFound("Registration not found");

  registration.status = status;
  await registration.save();

  const member = await syncRegistrationToMember(registration);

  res.json({
    success: true,
    item: registration,
    member,
    message:
      member && status === REGISTRATION_STATUS.MEMBER
        ? `${registration.studentName} is now a member.`
        : "Status updated.",
  });
});

export const deleteRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) throw ApiError.notFound("Registration not found");

  await storage.removeFile(registration.picture);
  await registration.deleteOne();

  res.json({ success: true, message: "Registration deleted" });
});

/* ------------------------------------------------------------------
   EXPORT
------------------------------------------------------------------ */

const EXPORT_COLUMNS = [
  { header: "Name", key: "studentName", width: 26 },
  { header: "Roll Number", key: "rollNumber", width: 22 },
  { header: "Section", key: "section", width: 10 },
  { header: "Semester", key: "semester", width: 10 },
  { header: "Father Name", key: "fatherName", width: 26 },
  { header: "CNIC", key: "cnic", width: 20 },
  { header: "Phone", key: "phone", width: 16 },
  { header: "Email", key: "email", width: 30 },
  { header: "Gender", key: "gender", width: 10 },
  { header: "Status", key: "status", width: 12 },
  { header: "Registration Date", key: "registrationDate", width: 18 },
];

export const exportRegistrations = asyncHandler(async (req, res) => {
  const format = req.query.format === "xlsx" ? "xlsx" : "csv";

  const rows = await Registration.find(buildFilter(req.query))
    .sort("-createdAt")
    .lean();

  await sendExport(res, format, EXPORT_COLUMNS, rows, "gears-registrations");
});
