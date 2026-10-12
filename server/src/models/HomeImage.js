import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";

/*
  Images in the home page "OUR ACHIEVEMENTS" grid.
  That grid is a hand-authored CSS layout (.gallery-item-1 .. -13),
  so the public page renders at most `homeGalleryLimit` of these.
*/
const homeImageSchema = new mongoose.Schema(
  {
    image: { type: fileSchema, required: true },

    title: { type: String, trim: true, default: "", maxlength: 200 },

    alt: { type: String, trim: true, default: "", maxlength: 200 },

    order: { type: Number, default: 0, index: true },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const HomeImage = mongoose.model("HomeImage", homeImageSchema);
