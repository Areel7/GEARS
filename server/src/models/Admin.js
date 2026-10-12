import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileSchema } from "./fileSchema.js";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },

    /*
      Never selected by default, so no query can leak it accidentally.
    */
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    avatar: { type: fileSchema, default: () => ({}) },

    isActive: { type: Boolean, default: true },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* Belt and braces: strip the hash from any serialised output. */
const hideSecrets = (doc, ret) => {
  delete ret.passwordHash;
  delete ret.__v;
  return ret;
};

adminSchema.set("toJSON", { transform: hideSecrets });
adminSchema.set("toObject", { transform: hideSecrets });

adminSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

adminSchema.methods.verifyPassword = function verifyPassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

export const Admin = mongoose.model("Admin", adminSchema);
