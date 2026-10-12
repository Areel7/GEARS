import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";

const leadershipSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },

    designation: { type: String, trim: true, default: "", maxlength: 150 },

    /* Quoted message shown on the /team leadership list. */
    description: { type: String, trim: true, default: "", maxlength: 1000 },

    image: { type: fileSchema, default: () => ({}) },

    session: { type: String, trim: true, default: "" },

    /*
      The home page "OUR TEAM" strip shows a fixed subset of
      supervisors. These two fields preserve that exact selection
      and order instead of dumping every leadership record there.
    */
    showOnHome: { type: Boolean, default: false },
    homeImage: { type: fileSchema, default: () => ({}) },

    isActive: { type: Boolean, default: true },

    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Leadership = mongoose.model("Leadership", leadershipSchema);
