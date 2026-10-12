/* =========================================================
   GEARS MIGRATION / SEED

   Imports the content that currently lives in the frontend
   static data files into MongoDB, uploading each image through
   the configured storage driver.

   Safety rules:
     - Never touches a collection that already has documents
       unless --force is passed for that collection.
     - Never writes a hard-coded password: the initial admin is
       created only from SEED_ADMIN_* environment variables.
     - Prints exactly what it did.

   Usage:
     npm run seed
     npm run seed -- --force            (wipe + reseed content)
     npm run seed -- --only=gallery,home
     npm run seed -- --registration=on  (enable public registration)
========================================================= */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env, assertEnv } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { storage } from "../services/storage.js";

import { Admin } from "../models/Admin.js";
import { Member } from "../models/Member.js";
import { CoreTeam } from "../models/CoreTeam.js";
import { Leadership } from "../models/Leadership.js";
import { Alumni } from "../models/Alumni.js";
import { President } from "../models/President.js";
import { GalleryImage } from "../models/GalleryImage.js";
import { HomeImage } from "../models/HomeImage.js";
import { SiteSettings } from "../models/SiteSettings.js";

import { MEMBER_STATUS } from "../constants/enums.js";
import * as data from "./staticData.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/* server/src/scripts -> project root -> src/assets/images */
const ASSETS = path.resolve(here, "../../../src/assets/images");

/* ---------------------------------------------------------
   ARGUMENTS
--------------------------------------------------------- */

const args = process.argv.slice(2);

const force = args.includes("--force");

const onlyArg = args.find((value) => value.startsWith("--only="));

const only = onlyArg
  ? onlyArg.slice(7).split(",").map((value) => value.trim())
  : null;

const registrationArg = args.find((value) =>
  value.startsWith("--registration=")
);

const wants = (name) => !only || only.includes(name);

/* ---------------------------------------------------------
   IMAGE HELPERS
--------------------------------------------------------- */

const MIME_BY_EXTENSION = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/* The static data has at least one filename whose case does not
   match the file on disk, so lookups are case-insensitive. */
const resolveAsset = async (relativePath) => {
  if (!relativePath) return null;

  const full = path.join(ASSETS, relativePath);

  try {
    await fs.access(full);
    return full;
  } catch {
    /* fall through to the case-insensitive search */
  }

  const dir = path.dirname(full);
  const wanted = path.basename(full).toLowerCase();

  try {
    const entries = await fs.readdir(dir);
    const match = entries.find((entry) => entry.toLowerCase() === wanted);

    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
};

const uploadAsset = async (relativePath, folder) => {
  const full = await resolveAsset(relativePath);

  if (!full) {
    if (relativePath) {
      console.warn(`  ! image not found, skipping: ${relativePath}`);
    }
    return null;
  }

  const buffer = await fs.readFile(full);
  const extension = path.extname(full).toLowerCase();

  return storage.saveFile(
    {
      buffer,
      originalname: path.basename(full),
      mimetype: MIME_BY_EXTENSION[extension] || "image/jpeg",
      size: buffer.length,
    },
    folder
  );
};

/* Reproduces the numeric filename sort the frontend globs use. */
const listFolder = async (folder) => {
  const dir = path.join(ASSETS, folder);

  const entries = await fs.readdir(dir);

  return entries
    .filter((entry) => MIME_BY_EXTENSION[path.extname(entry).toLowerCase()])
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
};

const readableName = (fileName) =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

/* ---------------------------------------------------------
   GUARD

   Refuses to touch a collection that already holds data unless
   --force is given, so running this against production is safe.
--------------------------------------------------------- */

const guard = async (label, model) => {
  const count = await model.countDocuments();

  if (count === 0) return true;

  if (!force) {
    console.log(
      `  - ${label}: ${count} existing record(s), skipped (use --force to replace)`
    );
    return false;
  }

  console.log(`  ! ${label}: --force, removing ${count} existing record(s)`);

  /* Remove the stored files too, so nothing is orphaned. */
  const existing = await model.find();

  for (const doc of existing) {
    for (const field of ["image", "homeImage"]) {
      if (doc[field]?.publicId) await storage.removeFile(doc[field]);
    }
  }

  await model.deleteMany({});

  return true;
};

/* ---------------------------------------------------------
   SEED STEPS
--------------------------------------------------------- */

const seedAdmin = async () => {
  const { name, designation, email, password } = env.seedAdmin;

  const existing = await Admin.countDocuments();

  if (existing > 0) {
    console.log(`  - admins: ${existing} already exist, skipped`);
    return;
  }

  if (!name || !designation || !email || !password) {
    console.log(
      "  ! admins: no account created. Set SEED_ADMIN_NAME, SEED_ADMIN_DESIGNATION,\n" +
        "    SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env, then run:\n" +
        "      npm run create-admin"
    );
    return;
  }

  const admin = new Admin({
    name,
    designation,
    email: email.toLowerCase(),
  });

  await admin.setPassword(password);
  await admin.save();

  console.log(`  + admins: created ${admin.email}`);
};

const seedLeadership = async () => {
  if (!(await guard("leadership", Leadership))) return;

  for (const entry of data.leadership) {
    const image = await uploadAsset(entry.image, "leadership");

    const homeImage = entry.homeImage
      ? await uploadAsset(entry.homeImage, "leadership")
      : null;

    await Leadership.create({
      name: entry.name,
      designation: entry.designation,
      description: entry.description,
      image: image || {},
      homeImage: homeImage || {},
      showOnHome: entry.showOnHome,
      order: entry.order,
      isActive: true,
    });
  }

  console.log(`  + leadership: ${data.leadership.length} records`);
};

const seedCoreTeam = async () => {
  const membersReady = await guard("core team", CoreTeam);
  if (!membersReady) return;

  let created = 0;

  for (const entry of data.coreTeam) {
    /*
      Members come first: the core team record only references a
      member, so the two can never disagree about a name.
    */
    let member = await Member.findOne({ name: entry.name });

    if (!member) {
      member = await Member.create({
        name: entry.name,
        status: MEMBER_STATUS.CORE_MEMBER,
      });
    } else if (member.status !== MEMBER_STATUS.CORE_MEMBER) {
      member.status = MEMBER_STATUS.CORE_MEMBER;
      await member.save();
    }

    const image = await uploadAsset(entry.image, "core-team");
    const homeImage = await uploadAsset(entry.homeImage, "core-team");

    await CoreTeam.create({
      member: member._id,
      designation: entry.designation,
      description: entry.description,
      image: image || {},
      homeImage: homeImage || {},
      order: entry.order,
      isActive: true,
      showOnHome: true,
    });

    created += 1;
  }

  console.log(
    `  + core team: ${created} records (and their member records)`
  );
};

const seedAlumni = async () => {
  if (!(await guard("alumni", Alumni))) return;

  for (const entry of data.alumni) {
    const image = entry.image
      ? await uploadAsset(entry.image, "alumni")
      : null;

    await Alumni.create({
      name: entry.name,
      title: entry.title,
      designation: entry.designation,
      image: image || {},
      order: entry.order,
      isActive: true,
    });
  }

  console.log(`  + alumni: ${data.alumni.length} records`);
};

const seedPresidents = async () => {
  if (!(await guard("presidents", President))) return;

  for (const entry of data.presidents) {
    const image = await uploadAsset(entry.image, "presidents");

    await President.create({
      name: entry.name,
      designation: "President",
      startYear: entry.startYear,
      endYear: entry.endYear,
      image: image || {},
      order: entry.order,
      isCurrent: false,
    });
  }

  console.log(`  + presidents: ${data.presidents.length} records`);
};

const seedHomeImages = async () => {
  if (!(await guard("home images", HomeImage))) return;

  const files = await listFolder(data.homeImageFolder);

  for (const [index, fileName] of files.entries()) {
    const image = await uploadAsset(
      `${data.homeImageFolder}/${fileName}`,
      "home"
    );

    if (!image) continue;

    await HomeImage.create({
      image,
      title: readableName(fileName),
      alt: readableName(fileName) || `Gallery Image ${index + 1}`,
      order: index,
      isActive: true,
    });
  }

  console.log(`  + home images: ${files.length} images`);
};

const seedGallery = async () => {
  if (!(await guard("gallery", GalleryImage))) return;

  const files = await listFolder(data.galleryImageFolder);

  for (const [index, fileName] of files.entries()) {
    const image = await uploadAsset(
      `${data.galleryImageFolder}/${fileName}`,
      "gallery"
    );

    if (!image) continue;

    const readable = readableName(fileName).replace(/\d+/g, "").trim();

    await GalleryImage.create({
      image,
      alt: readable || `GEARS Gallery ${index + 1}`,
      category: "GEARS",
      order: index,
      isActive: true,
    });
  }

  console.log(`  + gallery: ${files.length} images`);
};

const seedSettings = async () => {
  const settings = await SiteSettings.getSettings();

  const files = await listFolder(data.homeImageFolder);

  settings.homeGalleryLimit = Math.min(files.length, 13);

  if (registrationArg) {
    settings.registrationEnabled = registrationArg.endsWith("on");
  } else if (settings.isNew || settings.createdAt === settings.updatedAt) {
    /*
      The current live site has its registration links removed, so a
      first run matches that state rather than silently opening it.
    */
    settings.registrationEnabled = false;
  }

  await settings.save();

  console.log(
    `  + settings: registration ${
      settings.registrationEnabled ? "ON" : "OFF"
    }, home gallery limit ${settings.homeGalleryLimit}`
  );
};

/* ---------------------------------------------------------
   RUN
--------------------------------------------------------- */

const run = async () => {
  assertEnv();

  await connectDatabase();

  console.log(`\nSeeding GEARS content (storage: ${storage.driverName})\n`);

  if (wants("admin")) await seedAdmin();
  if (wants("leadership")) await seedLeadership();
  if (wants("core-team")) await seedCoreTeam();
  if (wants("alumni")) await seedAlumni();
  if (wants("presidents")) await seedPresidents();
  if (wants("home")) await seedHomeImages();
  if (wants("gallery")) await seedGallery();
  if (wants("settings")) await seedSettings();

  console.log("\nDone.\n");

  await disconnectDatabase();
};

run().catch(async (error) => {
  console.error("\nSeed failed:", error);
  await disconnectDatabase();
  process.exit(1);
});
