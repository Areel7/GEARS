import { SiteSettings } from "../models/SiteSettings.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toBoolean } from "../utils/validate.js";

const serialise = (settings) => ({
  registrationEnabled: settings.registrationEnabled,
  registrationClosedMessage: settings.registrationClosedMessage,
  homeGalleryLimit: settings.homeGalleryLimit,
  galleryLimit: settings.galleryLimit,
  updatedAt: settings.updatedAt,
  updatedBy: settings.updatedBy
    ? {
        id: settings.updatedBy._id,
        name: settings.updatedBy.name,
        designation: settings.updatedBy.designation,
      }
    : null,
});

const loadSettings = async () => {
  await SiteSettings.getSettings();

  return SiteSettings.findOne({ key: "site" }).populate(
    "updatedBy",
    "name designation"
  );
};

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await loadSettings();
  res.json({ success: true, settings: serialise(settings) });
});

/*
  Trimmed payload for the public site: it only needs to know whether
  the registration form should render, and what to say if it should not.
*/
export const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await SiteSettings.getSettings();

  res.json({
    success: true,
    settings: {
      registrationEnabled: settings.registrationEnabled,
      registrationClosedMessage: settings.registrationClosedMessage,
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();

  const enabled = toBoolean(req.body.registrationEnabled);
  if (enabled !== undefined) settings.registrationEnabled = enabled;

  if (req.body.registrationClosedMessage !== undefined) {
    const message = String(req.body.registrationClosedMessage).trim();

    settings.registrationClosedMessage =
      message || "Registration is currently closed.";
  }

  if (req.body.homeGalleryLimit !== undefined) {
    const limit = Number.parseInt(req.body.homeGalleryLimit, 10);

    /*
      The home grid is a hand-authored CSS layout with 13 slots, so a
      larger limit would leave images without a grid position.
    */
    if (!Number.isFinite(limit) || limit < 0 || limit > 13) {
      throw ApiError.badRequest(
        "Home gallery limit must be between 0 and 13"
      );
    }

    settings.homeGalleryLimit = limit;
  }

  if (req.body.galleryLimit !== undefined) {
    const limit = Number.parseInt(req.body.galleryLimit, 10);

    if (!Number.isFinite(limit) || limit < 0 || limit > 500) {
      throw ApiError.badRequest("Gallery limit must be between 0 and 500");
    }

    settings.galleryLimit = limit;
  }

  settings.updatedBy = req.admin._id;
  await settings.save();

  const fresh = await loadSettings();

  res.json({ success: true, settings: serialise(fresh) });
});

/* Dedicated endpoint for the registration ON/OFF switch. */
export const updateRegistrationSetting = asyncHandler(async (req, res) => {
  const enabled = toBoolean(req.body.registrationEnabled ?? req.body.enabled);

  if (enabled === undefined) {
    throw ApiError.badRequest("registrationEnabled must be true or false");
  }

  const settings = await SiteSettings.getSettings();

  settings.registrationEnabled = enabled;
  settings.updatedBy = req.admin._id;

  await settings.save();

  const fresh = await loadSettings();

  res.json({ success: true, settings: serialise(fresh) });
});
