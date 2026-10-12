import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";

/* Images on the public /gallery page. */
const galleryImageSchema = new mongoose.Schema(
  {
    image: { type: fileSchema, required: true },

    title: { type: String, trim: true, default: "", maxlength: 200 },

    description: { type: String, trim: true, default: "", maxlength: 1000 },

    /* Rendered in the card overlay; the existing site uses "GEARS". */
    category: { type: String, trim: true, default: "GEARS", maxlength: 100 },

    alt: { type: String, trim: true, default: "", maxlength: 200 },

    order: { type: Number, default: 0, index: true },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const GalleryImage = mongoose.model(
  "GalleryImage",
  galleryImageSchema
);
