import mongoose from "mongoose";

/*
  Single settings document.
  `key` is fixed so we can upsert without ever creating a second row.
*/
const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "site",
      unique: true,
      immutable: true,
    },

    registrationEnabled: { type: Boolean, default: true },

    /* Registration closed message shown on the public page. */
    registrationClosedMessage: {
      type: String,
      trim: true,
      default: "Registration is currently closed.",
    },

    /*
      Display limits keep the public layout stable when new images are
      added in the admin. The existing site shows 12 home images and
      30 gallery images, so those are the defaults.
    */
    homeGalleryLimit: { type: Number, default: 12, min: 0, max: 13 },
    galleryLimit: { type: Number, default: 60, min: 0 },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSettings = async function getSettings() {
  const existing = await this.findOne({ key: "site" });
  if (existing) return existing;

  return this.create({ key: "site" });
};

export const SiteSettings = mongoose.model(
  "SiteSettings",
  siteSettingsSchema
);
