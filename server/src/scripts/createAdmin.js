/* =========================================================
   CREATE AN ADMIN ACCOUNT

   Credentials come from environment variables only - nothing is
   ever hard-coded, and the password is hashed before it is saved.

   Usage:
     SEED_ADMIN_NAME="..." SEED_ADMIN_DESIGNATION="..." \
     SEED_ADMIN_EMAIL="..." SEED_ADMIN_PASSWORD="..." \
     npm run create-admin

   or fill the SEED_ADMIN_* values in server/.env first.
========================================================= */

import { env, assertEnv } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { Admin } from "../models/Admin.js";
import { assertStrongPassword, isEmail } from "../utils/validate.js";

const run = async () => {
  assertEnv();

  const { name, designation, email, password } = env.seedAdmin;

  const missing = [];

  if (!name) missing.push("SEED_ADMIN_NAME");
  if (!designation) missing.push("SEED_ADMIN_DESIGNATION");
  if (!email) missing.push("SEED_ADMIN_EMAIL");
  if (!password) missing.push("SEED_ADMIN_PASSWORD");

  if (missing.length) {
    console.error(
      `\nMissing: ${missing.join(", ")}\nSet them in server/.env or inline, then run again.\n`
    );
    process.exit(1);
  }

  if (!isEmail(email)) {
    console.error("\nSEED_ADMIN_EMAIL is not a valid email address.\n");
    process.exit(1);
  }

  assertStrongPassword(password);

  await connectDatabase();

  const normalised = email.toLowerCase().trim();

  const existing = await Admin.findOne({ email: normalised });

  if (existing) {
    console.error(`\nAn admin with ${normalised} already exists.\n`);
    await disconnectDatabase();
    process.exit(1);
  }

  const admin = new Admin({ name, designation, email: normalised });

  await admin.setPassword(password);
  await admin.save();

  console.log(`\nCreated admin: ${admin.name} <${admin.email}>\n`);

  await disconnectDatabase();
};

run().catch(async (error) => {
  console.error("\nFailed:", error.message);
  await disconnectDatabase();
  process.exit(1);
});
