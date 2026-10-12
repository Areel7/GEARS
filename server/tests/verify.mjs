/* =========================================================
   GEARS END-TO-END VERIFICATION

   Boots an in-memory MongoDB, starts the real Express app, and
   exercises the flows the brief asks to be tested.
========================================================= */

import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "node:fs/promises";
import path from "node:path";

import { fileURLToPath } from "node:url";

/* server/tests -> server */
const SERVER = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const mongo = await MongoMemoryServer.create();

process.env.MONGODB_URI = mongo.getUri("gears_test");
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-the-checks-0123456789";
process.env.NODE_ENV = "test";
process.env.PORT = "5099";
process.env.PUBLIC_API_URL = "http://127.0.0.1:5099";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.STORAGE_DRIVER = "local";
process.env.SEED_ADMIN_NAME = "Muhammad Ahmad Samdani";
process.env.SEED_ADMIN_DESIGNATION = "Senior Admin";
process.env.SEED_ADMIN_EMAIL = "admin@gears.test";
process.env.SEED_ADMIN_PASSWORD = "GearsAdmin123";

const url = (p) => `http://127.0.0.1:5099${p}`;

let pass = 0;
let fail = 0;
const failures = [];

const check = (name, ok, detail = "") => {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` -- ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
};

const section = (title) => console.log(`\n=== ${title} ===`);

/* Cookie jar so the session behaves like a browser. */
let cookie = "";

const call = async (method, p, { body, headers = {}, raw } = {}) => {
  const init = { method, headers: { ...headers } };

  if (cookie) init.headers.Cookie = cookie;

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url(p), init);

  const setCookie = response.headers.getSetCookie?.() || [];
  setCookie.forEach((c) => {
    const pair = c.split(";")[0];
    if (pair.startsWith("gears_admin_token=")) {
      cookie = pair.endsWith("=") ? "" : pair;
    }
  });

  if (raw) return response;

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, response };
};

/* ---------------------------------------------------------
   BOOT
--------------------------------------------------------- */

const { connectDatabase } = await import(
  `file://${SERVER}/src/config/db.js`
);
const { createApp } = await import(`file://${SERVER}/src/app.js`);

await connectDatabase();

const app = createApp();
const server = app.listen(5099);

await new Promise((resolve) => server.once("listening", resolve));

console.log("server up on 5099");

/* ---------------------------------------------------------
   MIGRATION / SEED
--------------------------------------------------------- */

section("MIGRATION OF EXISTING STATIC CONTENT");

const { execFile } = await import("node:child_process");
const { promisify } = await import("node:util");
const run = promisify(execFile);

const seed = await run(
  process.execPath,
  [path.join(SERVER, "src/scripts/seed.js")],
  { env: process.env, cwd: SERVER, maxBuffer: 1024 * 1024 * 20 }
);

console.log(seed.stdout.trim().split("\n").map((l) => "    " + l).join("\n"));

const { Leadership } = await import(`file://${SERVER}/src/models/Leadership.js`);
const { CoreTeam } = await import(`file://${SERVER}/src/models/CoreTeam.js`);
const { Member } = await import(`file://${SERVER}/src/models/Member.js`);
const { Alumni } = await import(`file://${SERVER}/src/models/Alumni.js`);
const { President } = await import(`file://${SERVER}/src/models/President.js`);
const { HomeImage } = await import(`file://${SERVER}/src/models/HomeImage.js`);
const { GalleryImage } = await import(`file://${SERVER}/src/models/GalleryImage.js`);
const { Admin } = await import(`file://${SERVER}/src/models/Admin.js`);

check("Leadership migrated (6)", (await Leadership.countDocuments()) === 6);
check("Core team migrated (10)", (await CoreTeam.countDocuments()) === 10);
check("Members created for core team (10)", (await Member.countDocuments()) === 10);
check("Alumni migrated (3)", (await Alumni.countDocuments()) === 3);
check("Presidents migrated (8)", (await President.countDocuments()) === 8);
check("Home images migrated (12)", (await HomeImage.countDocuments()) === 12);
check("Gallery images migrated (30)", (await GalleryImage.countDocuments()) === 30);
check("Seed admin created", (await Admin.countDocuments()) === 1);

const homeOnly = await Leadership.countDocuments({ showOnHome: true });
check("Home supervisor strip preserved (4)", homeOnly === 4);

/* Images actually stored on disk, not in the documents */
const sampleImage = await HomeImage.findOne();
const stored = path.join(SERVER, "uploads", sampleImage.image.publicId);
let onDisk = false;
try {
  const stat = await fs.stat(stored);
  onDisk = stat.size > 0;
} catch {
  onDisk = false;
}
check("Image binary stored on disk, not in MongoDB", onDisk);
check(
  "MongoDB holds only a URL + metadata",
  typeof sampleImage.image.url === "string" &&
    sampleImage.image.url.startsWith("http") &&
    sampleImage.toObject().image.buffer === undefined
);

/* ---------------------------------------------------------
   AUTHENTICATION
--------------------------------------------------------- */

section("AUTHENTICATION");

let r = await call("GET", "/api/dashboard");
check("Unauthenticated admin API is rejected", r.status === 401, `got ${r.status}`);

r = await call("GET", "/api/registrations");
check("Unauthenticated registrations API rejected", r.status === 401, `got ${r.status}`);

r = await call("POST", "/api/auth/login", {
  body: { email: "admin@gears.test", password: "WrongPassword1" },
});
check("Wrong password rejected", r.status === 401, `got ${r.status}`);
check(
  "Wrong password gives a generic message",
  r.data?.message === "Invalid email or password"
);

r = await call("POST", "/api/auth/login", {
  body: { email: "nobody@gears.test", password: "Whatever123" },
});
check(
  "Unknown email gives the same generic message (no enumeration)",
  r.data?.message === "Invalid email or password"
);

r = await call("POST", "/api/auth/login", {
  body: { email: "admin@gears.test", password: "GearsAdmin123" },
});
check("Correct password signs in", r.status === 200, `got ${r.status}`);
check("Session cookie issued", cookie.startsWith("gears_admin_token="));
check(
  "Login response carries no password field",
  !JSON.stringify(r.data).toLowerCase().includes("passwordhash") &&
    r.data?.admin?.password === undefined
);

/* ---------------------------------------------------------
   ADMIN PROFILE
--------------------------------------------------------- */

section("ADMIN PROFILE");

r = await call("GET", "/api/auth/me");
check("GET /api/auth/me works when signed in", r.status === 200);
check("Name returned", r.data?.admin?.name === "Muhammad Ahmad Samdani");
check("Designation returned", r.data?.admin?.designation === "Senior Admin");
check("Email returned", r.data?.admin?.email === "admin@gears.test");

const meJson = JSON.stringify(r.data);
check(
  "/auth/me leaks no password or hash",
  !/password/i.test(meJson) && !/\$2[aby]\$/.test(meJson)
);

const raw = await Admin.findOne({ email: "admin@gears.test" }).select(
  "+passwordHash"
);
check(
  "Password stored only as a bcrypt hash",
  /^\$2[aby]\$\d{2}\$/.test(raw.passwordHash) &&
    raw.passwordHash !== "GearsAdmin123"
);

const defaultSelect = await Admin.findOne({ email: "admin@gears.test" });
check(
  "passwordHash not selected by default",
  defaultSelect.passwordHash === undefined
);

/* ---------------------------------------------------------
   REGISTRATION ON / OFF
--------------------------------------------------------- */

section("REGISTRATION ON/OFF CONTROL");

r = await call("GET", "/api/public/settings");
check(
  "Public settings endpoint works without auth",
  r.status === 200 && typeof r.data.settings.registrationEnabled === "boolean"
);
check(
  "Seed matched the current site state (registration OFF)",
  r.data.settings.registrationEnabled === false
);

const makeRegistration = (overrides = {}) => {
  const form = new FormData();

  const fields = {
    studentName: "Test Student",
    rollNumber: "FA/2023/BSCS/598",
    section: "A",
    semester: "5",
    fatherName: "Test Father",
    cnic: "35202-1234567-1",
    phone: "03001234567",
    email: "test.student@example.com",
    gender: "Male",
    ...overrides,
  };

  Object.entries(fields).forEach(([k, v]) => form.append(k, v));

  form.append(
    "picture",
    new Blob([Buffer.from("fake-jpeg-bytes")], { type: "image/jpeg" }),
    "photo.jpg"
  );

  return form;
};

/* Direct POST while registration is disabled */
const savedCookie = cookie;
cookie = "";

r = await call("POST", "/api/registrations/public", {
  body: makeRegistration(),
});

check(
  "Direct POST rejected while registration is OFF",
  r.status === 403,
  `got ${r.status}`
);

cookie = savedCookie;

/* Turn it on */
r = await call("PUT", "/api/settings/registration", {
  body: { registrationEnabled: true },
});
check("Admin can switch registration ON", r.data?.settings?.registrationEnabled === true);
check("Settings record who changed it", Boolean(r.data?.settings?.updatedBy?.name));

r = await call("GET", "/api/public/settings");
check(
  "Public site immediately sees registration ON",
  r.data.settings.registrationEnabled === true
);

/* ---------------------------------------------------------
   PUBLIC SUBMISSION
--------------------------------------------------------- */

section("PUBLIC REGISTRATION SUBMISSION");

cookie = "";

r = await call("POST", "/api/registrations/public", {
  body: makeRegistration(),
});

check("Public submission accepted when ON", r.status === 201, `got ${r.status}`);
check("Submission defaults to Pending", r.data?.registration?.status === "Pending");

const registrationId = r.data?.registration?.id;

r = await call("POST", "/api/registrations/public", {
  body: makeRegistration(),
});
check("Duplicate roll number rejected", r.status === 409, `got ${r.status}`);

r = await call("POST", "/api/registrations/public", {
  body: makeRegistration({ cnic: "not-a-cnic", rollNumber: "FA/2023/BSCS/599" }),
});
check("Invalid CNIC rejected by the server", r.status === 400, `got ${r.status}`);

/* Image upload validation */
const badFile = new FormData();
Object.entries({
  studentName: "Exe Student",
  rollNumber: "FA/2023/BSCS/777",
  section: "A",
  semester: "5",
  fatherName: "F",
  cnic: "35202-1234567-1",
  phone: "03001234567",
  email: "exe@example.com",
  gender: "Male",
}).forEach(([k, v]) => badFile.append(k, v));

badFile.append(
  "picture",
  new Blob([Buffer.from("MZ")], { type: "application/x-msdownload" }),
  "payload.exe"
);

r = await call("POST", "/api/registrations/public", { body: badFile });
check("Executable upload rejected", r.status === 400, `got ${r.status}`);

/* Extension/MIME mismatch */
const spoofed = new FormData();
Object.entries({
  studentName: "Spoof Student",
  rollNumber: "FA/2023/BSCS/778",
  section: "A",
  semester: "5",
  fatherName: "F",
  cnic: "35202-1234567-1",
  phone: "03001234567",
  email: "spoof@example.com",
  gender: "Male",
}).forEach(([k, v]) => spoofed.append(k, v));

spoofed.append(
  "picture",
  new Blob([Buffer.from("MZ")], { type: "image/jpeg" }),
  "payload.exe"
);

r = await call("POST", "/api/registrations/public", { body: spoofed });
check(
  "Image MIME with executable extension rejected",
  r.status === 400,
  `got ${r.status}`
);

cookie = savedCookie;

/* ---------------------------------------------------------
   REGISTRATION -> MEMBER
--------------------------------------------------------- */

section("REGISTRATION -> MEMBER AUTOMATION");

const membersBefore = await Member.countDocuments();

r = await call("PATCH", `/api/registrations/${registrationId}/status`, {
  body: { status: "Member" },
});

check("Status change to Member succeeds", r.status === 200, `got ${r.status}`);
check("Member record returned", Boolean(r.data?.member));

const afterPromote = await Member.countDocuments();
check("Exactly one member created", afterPromote === membersBefore + 1);

const created = await Member.findOne({ rollNumber: "FA/2023/BSCS/598" });
check("Member carries the student details", created?.name === "Test Student");
check("Member links back to the registration", String(created.registrationId) === String(registrationId));

/* Flip back and forth: must not duplicate */
await call("PATCH", `/api/registrations/${registrationId}/status`, {
  body: { status: "Pending" },
});
await call("PATCH", `/api/registrations/${registrationId}/status`, {
  body: { status: "Member" },
});
await call("PATCH", `/api/registrations/${registrationId}/status`, {
  body: { status: "Failed" },
});
await call("PATCH", `/api/registrations/${registrationId}/status`, {
  body: { status: "Member" },
});

check(
  "Flipping status repeatedly creates no duplicate member",
  (await Member.countDocuments()) === membersBefore + 1
);

check(
  "Member survives a revert (history preserved)",
  Boolean(await Member.findOne({ rollNumber: "FA/2023/BSCS/598" }))
);

/* ---------------------------------------------------------
   MEMBER -> CORE TEAM
--------------------------------------------------------- */

section("MEMBER -> CORE TEAM AUTOMATION");

const coreBefore = await CoreTeam.countDocuments({ isActive: true });

r = await call("PATCH", `/api/members/${created._id}/status`, {
  body: { status: "Core Member" },
});

check("Promotion to Core Member succeeds", r.status === 200);
check("Core team record returned", Boolean(r.data?.coreTeam));

check(
  "Core team gained exactly one active record",
  (await CoreTeam.countDocuments({ isActive: true })) === coreBefore + 1
);

/* Demote */
r = await call("PATCH", `/api/members/${created._id}/status`, {
  body: { status: "Member" },
});

check(
  "Demotion removes them from the active core team",
  (await CoreTeam.countDocuments({ isActive: true })) === coreBefore
);

check(
  "Underlying member record survives demotion",
  Boolean(await Member.findById(created._id))
);

check(
  "Historical core team record is kept, not deleted",
  (await CoreTeam.countDocuments({ member: created._id })) === 1
);

/* Re-promote: reuses the same appointment */
await call("PATCH", `/api/members/${created._id}/status`, {
  body: { status: "Core Member" },
});

check(
  "Re-promotion reuses the record instead of duplicating",
  (await CoreTeam.countDocuments({ member: created._id })) === 1
);

/* Public team page must reflect it */
r = await call("GET", "/api/public/team");
check(
  "Promoted member appears on the public team endpoint",
  r.data.coreTeam.some((m) => m.name === "Test Student")
);

await call("PATCH", `/api/members/${created._id}/status`, {
  body: { status: "Member" },
});

r = await call("GET", "/api/public/team");
check(
  "Demoted member disappears from the public team endpoint",
  !r.data.coreTeam.some((m) => m.name === "Test Student")
);

/* ---------------------------------------------------------
   PUBLIC CONTENT SHAPES
--------------------------------------------------------- */

section("PUBLIC CONTENT ENDPOINTS");

cookie = "";

r = await call("GET", "/api/public/team");
check("Public team endpoint open to the public", r.status === 200);
check("Leadership present", r.data.leadership.length === 6);
check("Core team present", r.data.coreTeam.length === 10);
check("Alumni present", r.data.alumni.length === 3);
check("Presidents present", r.data.presidents.length === 8);

const lead = r.data.leadership[0];
check(
  "Leadership shape matches the existing component props",
  "id" in lead && "name" in lead && "designation" in lead &&
    "image" in lead && "message" in lead
);

const core = r.data.coreTeam[0];
check(
  "Core team shape matches the existing component props",
  "id" in core && "name" in core && "designation" in core &&
    "image" in core && "text" in core
);

const alum = r.data.alumni[0];
check(
  "Alumni shape matches (year renders the card label)",
  alum.year === "ALUMNI OF THE YEAR"
);

const pres = r.data.presidents[0];
check("President session built correctly", pres.session === "2017 - 2018");
check("Presidents ordered oldest first", pres.name === "Umer Ahmad");

check(
  "Public team payload exposes no emails or roll numbers",
  !/rollNumber|email/i.test(JSON.stringify(r.data))
);

r = await call("GET", "/api/public/home");
check("Public home endpoint works", r.status === 200);
check("Home supervisor strip has exactly 4", r.data.supervisors.length === 4);
check(
  "Home supervisors in original order",
  r.data.supervisors[0].name === "Hassan Sultan" &&
    r.data.supervisors[3].name === "Suhaib Ahmad"
);
check("Home core carousel has 10", r.data.coreMembers.length === 10);
check("Home achievements grid capped at 12", r.data.images.length === 12);

r = await call("GET", "/api/public/gallery");
check("Public gallery endpoint works", r.status === 200);
check("Gallery returns 30 images", r.data.images.length === 30);
check(
  "Gallery shape matches the existing component props",
  "id" in r.data.images[0] && "image" in r.data.images[0] &&
    "alt" in r.data.images[0] && "category" in r.data.images[0]
);

cookie = savedCookie;

/* ---------------------------------------------------------
   DISPLAY LIMIT
--------------------------------------------------------- */

section("HOME GALLERY DISPLAY LIMIT");

/* Add an image and confirm the public page does not grow */
const extra = new FormData();
extra.append("title", "Newly added");
extra.append(
  "image",
  new Blob([Buffer.from("fake")], { type: "image/png" }),
  "new.png"
);

r = await call("POST", "/api/home-images", { body: extra });
check("Admin can add a home image", r.status === 201, `got ${r.status}`);

check(
  "Database now holds 13 home images",
  (await HomeImage.countDocuments()) === 13
);

const beforeCookie = cookie;
cookie = "";
r = await call("GET", "/api/public/home");
check(
  "Public home page still renders only 12 (layout unchanged)",
  r.data.images.length === 12,
  `got ${r.data.images.length}`
);
cookie = beforeCookie;

r = await call("PUT", "/api/settings", { body: { homeGalleryLimit: 13 } });
check("Admin can raise the limit deliberately", r.status === 200);

r = await call("GET", "/api/public/home");
check("Public home now renders 13", r.data.images.length === 13);

r = await call("PUT", "/api/settings", { body: { homeGalleryLimit: 14 } });
check("Limit above the CSS grid capacity is rejected", r.status === 400);

await call("PUT", "/api/settings", { body: { homeGalleryLimit: 12 } });

/* ---------------------------------------------------------
   EXPORTS
--------------------------------------------------------- */

section("EXPORTS");

const exportCheck = async (name, p, format, signature) => {
  const response = await call("GET", `${p}?format=${format}`, { raw: true });

  const buffer = Buffer.from(await response.arrayBuffer());

  const disposition = response.headers.get("content-disposition") || "";

  check(
    `${name} ${format.toUpperCase()} downloads`,
    response.status === 200 && disposition.includes("attachment"),
    `status ${response.status}`
  );

  if (format === "xlsx") {
    check(
      `${name} XLSX is a real workbook`,
      buffer[0] === 0x50 && buffer[1] === 0x4b,
      `magic ${buffer.subarray(0, 2).toString("hex")}`
    );
  } else {
    const text = buffer.toString("utf8");
    check(
      `${name} CSV has the expected header`,
      text.includes(signature),
      text.slice(0, 120)
    );
  }

  return buffer;
};

await exportCheck("Registrations", "/api/registrations/export", "csv", "Roll Number");
await exportCheck("Registrations", "/api/registrations/export", "xlsx");
await exportCheck("Members", "/api/members/export", "csv", "Roll Number");
await exportCheck("Members", "/api/members/export", "xlsx");
await exportCheck("Core team", "/api/core-team/export", "csv", "Designation");
await exportCheck("Core team", "/api/core-team/export", "xlsx");

const csvBody = await (
  await call("GET", "/api/registrations/export?format=csv", { raw: true })
).text();

check(
  "Registration CSV contains the submitted student",
  csvBody.includes("Test Student") && csvBody.includes("FA/2023/BSCS/598")
);

check(
  "Exports never contain a password column",
  !/password/i.test(csvBody)
);

/* ---------------------------------------------------------
   INVENTORY + DOCUMENTS
--------------------------------------------------------- */

section("INVENTORY AND DOCUMENTS");

const invForm = new FormData();
invForm.append("name", "Arduino Uno");
invForm.append("quantity", "12");
invForm.append("category", "Boards");
invForm.append(
  "image",
  new Blob([Buffer.from("png")], { type: "image/png" }),
  "arduino.png"
);

r = await call("POST", "/api/inventory", { body: invForm });
check("Inventory item created", r.status === 201, `got ${r.status}`);

const inventoryId = r.data.item._id;

r = await call("PATCH", `/api/inventory/${inventoryId}/quantity`, {
  body: { delta: -3 },
});
check("Quantity adjustment works", r.data?.item?.quantity === 9);

r = await call("PATCH", `/api/inventory/${inventoryId}/quantity`, {
  body: { delta: -100 },
});
check("Quantity cannot go negative", r.data?.item?.quantity === 0);

const docForm = new FormData();
docForm.append("name", "Minute Sheet Template");
docForm.append("category", "Minute Sheet");
docForm.append(
  "file",
  new Blob([Buffer.from("%PDF-1.4 test")], { type: "application/pdf" }),
  "minute-sheet.pdf"
);

r = await call("POST", "/api/documents", { body: docForm });
check("Document uploaded", r.status === 201, `got ${r.status}`);

const documentId = r.data.item._id;

const download = await call("GET", `/api/documents/${documentId}/download`, {
  raw: true,
});
check("Document downloads", download.status === 200);
check(
  "Download is served as an attachment",
  (download.headers.get("content-disposition") || "").includes("attachment")
);
check(
  "Downloaded bytes match what was uploaded",
  (await download.text()) === "%PDF-1.4 test"
);

const badDoc = new FormData();
badDoc.append("name", "Bad");
badDoc.append(
  "file",
  new Blob([Buffer.from("MZ")], { type: "application/x-msdownload" }),
  "virus.exe"
);

r = await call("POST", "/api/documents", { body: badDoc });
check("Executable document rejected", r.status === 400, `got ${r.status}`);

/* ---------------------------------------------------------
   ADMIN MANAGEMENT
--------------------------------------------------------- */

section("ADMIN MANAGEMENT");

r = await call("POST", "/api/admins", {
  body: {
    name: "Second Admin",
    designation: "Content Admin",
    email: "second@gears.test",
    password: "SecondPass123",
  },
});
check("New admin created", r.status === 201, `got ${r.status}`);
check("Create response hides the hash", !/passwordHash/.test(JSON.stringify(r.data)));

const secondId = r.data.item._id;

r = await call("POST", "/api/admins", {
  body: {
    name: "Dupe",
    designation: "X",
    email: "second@gears.test",
    password: "AnotherPass123",
  },
});
check("Duplicate admin email rejected", r.status === 409, `got ${r.status}`);

r = await call("POST", "/api/admins", {
  body: {
    name: "Weak",
    designation: "X",
    email: "weak@gears.test",
    password: "short",
  },
});
check("Weak password rejected", r.status === 400, `got ${r.status}`);

r = await call("GET", "/api/admins");
check("Admin list works", r.status === 200);
check(
  "Admin list never exposes a hash",
  !/passwordHash|\$2[aby]\$/.test(JSON.stringify(r.data))
);

const me = await call("GET", "/api/auth/me");

r = await call("DELETE", `/api/admins/${me.data.admin.id}`);
check("Cannot delete your own account", r.status === 400, `got ${r.status}`);

r = await call("PUT", `/api/admins/${me.data.admin.id}`, {
  body: { isActive: false },
});
check("Cannot deactivate your own account", r.status === 400, `got ${r.status}`);

/* Deactivated admin cannot sign in */
await call("PUT", `/api/admins/${secondId}`, { body: { isActive: false } });

const adminCookie = cookie;
cookie = "";

r = await call("POST", "/api/auth/login", {
  body: { email: "second@gears.test", password: "SecondPass123" },
});
check("Deactivated admin cannot sign in", r.status === 403, `got ${r.status}`);

cookie = adminCookie;

r = await call("DELETE", `/api/admins/${secondId}`);
check("Other admin can be deleted", r.status === 200);

r = await call("DELETE", `/api/admins/${me.data.admin.id}`);
check("Last remaining admin is protected", r.status === 400, `got ${r.status}`);

/* ---------------------------------------------------------
   CHANGE PASSWORD
--------------------------------------------------------- */

section("CHANGE PASSWORD");

r = await call("PUT", "/api/auth/change-password", {
  body: {
    currentPassword: "WrongCurrent1",
    newPassword: "BrandNewPass123",
    confirmPassword: "BrandNewPass123",
  },
});
check("Wrong current password rejected", r.status === 400, `got ${r.status}`);

r = await call("PUT", "/api/auth/change-password", {
  body: {
    currentPassword: "GearsAdmin123",
    newPassword: "BrandNewPass123",
    confirmPassword: "Mismatch123",
  },
});
check("Mismatched confirmation rejected", r.status === 400, `got ${r.status}`);

r = await call("PUT", "/api/auth/change-password", {
  body: {
    currentPassword: "GearsAdmin123",
    newPassword: "BrandNewPass123",
    confirmPassword: "BrandNewPass123",
  },
});
check("Password changed", r.status === 200, `got ${r.status}`);

cookie = "";

r = await call("POST", "/api/auth/login", {
  body: { email: "admin@gears.test", password: "GearsAdmin123" },
});
check("Old password no longer works", r.status === 401, `got ${r.status}`);

r = await call("POST", "/api/auth/login", {
  body: { email: "admin@gears.test", password: "BrandNewPass123" },
});
check("New password works", r.status === 200, `got ${r.status}`);

/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */

section("LOGOUT");

await call("POST", "/api/auth/logout");
cookie = "";

r = await call("GET", "/api/auth/me");
check("Session invalidated after logout", r.status === 401, `got ${r.status}`);

/* ---------------------------------------------------------
   PERSISTENCE ACROSS RESTART
--------------------------------------------------------- */

section("PERSISTENCE");

const { disconnectDatabase } = await import(
  `file://${SERVER}/src/config/db.js`
);

await disconnectDatabase();
await connectDatabase();

check(
  "Data survives a database reconnect",
  (await Member.countDocuments()) > 0 &&
    (await GalleryImage.countDocuments()) === 30
);

/* ---------------------------------------------------------
   DONE
--------------------------------------------------------- */

console.log(`\n${"=".repeat(52)}`);
console.log(`PASSED: ${pass}   FAILED: ${fail}`);

if (failures.length) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log("  - " + f));
}

server.close();
await disconnectDatabase();
await mongo.stop();

/* Clean up files this run wrote. */
await fs.rm(path.join(SERVER, "uploads"), { recursive: true, force: true });
await fs.mkdir(path.join(SERVER, "uploads"), { recursive: true });
await fs.writeFile(path.join(SERVER, "uploads/.gitkeep"), "");

process.exit(fail ? 1 : 0);
