import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";

/*
  A core team appointment. Name/roll/email are NOT copied here:
  they are read through the Member reference so the record can
  never go stale. Only appointment-specific data lives here.
*/
const coreTeamSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
      maxlength: 120,
    },

    description: { type: String, trim: true, default: "", maxlength: 1000 },

    /* Shown on the /team page. */
    image: { type: fileSchema, default: () => ({}) },

    /* Shown in the home page core-team carousel. */
    homeImage: { type: fileSchema, default: () => ({}) },

    startYear: { type: String, trim: true, default: "" },
    endYear: { type: String, trim: true, default: "" },

    /*
      isActive is driven by the status of the linked member:
      set to false when a Core Member is demoted, so the public
      page hides them without destroying the historical record.
    */
    isActive: { type: Boolean, default: true, index: true },

    showOnHome: { type: Boolean, default: true },

    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* One active appointment per member. */
coreTeamSchema.index(
  { member: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export const CoreTeam = mongoose.model("CoreTeam", coreTeamSchema);
