import mongoose from "mongoose";

/*
  Stored-file reference.
  MongoDB only ever holds metadata + a URL.
  The binary itself lives on disk (local driver) or Cloudinary.
*/
export const fileSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: "" },

    /* Identifier used to delete the file from its provider. */
    publicId: { type: String, trim: true, default: "" },

    provider: {
      type: String,
      enum: ["local", "cloudinary"],
      default: "local",
    },

    originalName: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);
