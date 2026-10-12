import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";
import {
  REGISTRATION_STATUS,
  REGISTRATION_STATUSES,
  GENDERS,
} from "../constants/enums.js";

/*
  Mirrors the existing public registration form exactly:
  studentName, rollNumber, section, semester, fatherName,
  cnic, phone, email, gender, picture.
*/
const registrationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      maxlength: 150,
    },

    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      trim: true,
      uppercase: true,
      maxlength: 50,
    },

    section: { type: String, required: true, trim: true, maxlength: 20 },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    cnic: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{5}-\d{7}-\d$/, "CNIC must look like 35202-1234567-1"],
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^03\d{9}$/, "Phone must look like 03XXXXXXXXX"],
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },

    gender: { type: String, enum: GENDERS, required: true },

    picture: { type: fileSchema, default: () => ({}) },

    status: {
      type: String,
      enum: REGISTRATION_STATUSES,
      default: REGISTRATION_STATUS.PENDING,
      index: true,
    },

    /* Link to the Member created when status becomes "Member". */
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },

    source: {
      type: String,
      enum: ["public", "admin"],
      default: "public",
    },

    notes: { type: String, trim: true, default: "", maxlength: 2000 },

    registrationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

registrationSchema.index({ rollNumber: 1 });
registrationSchema.index({ email: 1 });
registrationSchema.index({ createdAt: -1 });
registrationSchema.index({ studentName: "text", rollNumber: "text", email: "text" });

export const Registration = mongoose.model(
  "Registration",
  registrationSchema
);
