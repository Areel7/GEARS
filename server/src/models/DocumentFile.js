import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";
import { DOCUMENT_CATEGORIES } from "../constants/enums.js";

/* Reusable GEARS document templates (minute sheets, letters, forms...). */
const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Document name is required"],
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      enum: DOCUMENT_CATEGORIES,
      default: "Other",
      index: true,
    },

    description: { type: String, trim: true, default: "", maxlength: 1000 },

    file: { type: fileSchema, required: true },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

documentSchema.index({ name: "text", description: "text" });

export const DocumentFile = mongoose.model("Document", documentSchema);
