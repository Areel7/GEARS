import mongoose from "mongoose";
import { fileSchema } from "./fileSchema.js";

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    image: { type: fileSchema, default: () => ({}) },

    category: { type: String, trim: true, default: "", maxlength: 100 },

    notes: { type: String, trim: true, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

inventorySchema.index({ name: "text" });

export const Inventory = mongoose.model("Inventory", inventorySchema);
