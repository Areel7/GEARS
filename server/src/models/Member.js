import mongoose from "mongoose";
import { MEMBER_STATUS, MEMBER_STATUSES } from "../constants/enums.js";

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 150,
    },

    /*
      Unique when present, but optional: the core team members migrated
      from the original site have no roll number on record, and inventing
      one would be worse than leaving it for an admin to fill in.
    */
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      default: undefined,
      maxlength: 50,
    },

    phone: { type: String, trim: true, default: "" },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    status: {
      type: String,
      enum: MEMBER_STATUSES,
      default: MEMBER_STATUS.MEMBER,
      index: true,
    },

    /* Set when the member originated from a public registration. */
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      default: null,
    },
  },
  { timestamps: true }
);

memberSchema.index({ createdAt: -1 });
memberSchema.index({ name: "text", rollNumber: "text", email: "text" });

export const Member = mongoose.model("Member", memberSchema);
