import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";

const presidentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },

    designation: {
      type: String,
      trim: true,
      default: "President",
      maxlength: 120,
    },

    description: { type: String, trim: true, default: "", maxlength: 1000 },

    image: { type: fileSchema, default: () => ({}) },

    startYear: { type: String, trim: true, default: "" },

    /* Empty end year + isCurrent renders as "2025 - Present". */
    endYear: { type: String, trim: true, default: "" },

    isCurrent: { type: Boolean, default: false },

    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* Session label the public /team page renders verbatim. */
presidentSchema.virtual("session").get(function session() {
  if (!this.startYear) return this.endYear || "";
  const end = this.isCurrent ? "Present" : this.endYear;
  return end ? `${this.startYear} - ${end}` : this.startYear;
});

presidentSchema.set("toJSON", { virtuals: true });
presidentSchema.set("toObject", { virtuals: true });

export const President = mongoose.model("President", presidentSchema);
