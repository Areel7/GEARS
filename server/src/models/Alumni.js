import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";

const alumniSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },

    /* Rendered as the card label, e.g. "ALUMNI OF THE YEAR". */
    title: {
      type: String,
      trim: true,
      default: "ALUMNI OF THE YEAR",
      maxlength: 150,
    },

    designation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    description: { type: String, trim: true, default: "", maxlength: 1000 },

    image: { type: fileSchema, default: () => ({}) },

    year: { type: String, trim: true, default: "" },

    isActive: { type: Boolean, default: true },

    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Alumni = mongoose.model("Alumni", alumniSchema);
