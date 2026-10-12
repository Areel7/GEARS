import { CoreTeam } from "../models/CoreTeam.js";
import { Leadership } from "../models/Leadership.js";
import { Alumni } from "../models/Alumni.js";
import { President } from "../models/President.js";
import { GalleryImage } from "../models/GalleryImage.js";
import { HomeImage } from "../models/HomeImage.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/*
  These payloads are shaped to match the props the existing public
  components already consume, so the frontend only swaps its data
  source and keeps its markup, classes and animations untouched.

  Nothing here exposes admin data, contact details or internal ids
  beyond the document id needed as a React key.
*/

const url = (file) => file?.url || null;

const mapLeadership = (item) => ({
  id: String(item._id),
  name: item.name,
  designation: item.designation,
  image: url(item.image),
  message: item.description,
  session: item.session || "",
});

const mapCoreTeam = (item) => ({
  id: String(item._id),
  name: item.member?.name || "",
  designation: item.designation,
  image: url(item.image),
  text: item.description,
});

const mapAlumni = (item) => ({
  id: String(item._id),
  name: item.name,
  /* The card label; the existing markup renders this as `year`. */
  year: item.title,
  designation: item.designation,
  description: item.description,
  image: url(item.image),
});

const mapPresident = (item) => ({
  id: String(item._id),
  name: item.name,
  session: item.session,
  designation: item.designation,
  description: item.description,
  image: url(item.image),
});

const activeSort = { order: 1, createdAt: 1 };

/* ------------------------------------------------------------------
   /api/public/team  -> the /team page
------------------------------------------------------------------ */

export const getPublicTeam = asyncHandler(async (_req, res) => {
  const [leadership, coreTeam, alumni, presidents] = await Promise.all([
    Leadership.find({ isActive: true }).sort(activeSort),
    CoreTeam.find({ isActive: true })
      .sort(activeSort)
      .populate("member", "name"),
    Alumni.find({ isActive: true }).sort(activeSort),
    President.find().sort(activeSort),
  ]);

  res.json({
    success: true,
    leadership: leadership.map(mapLeadership),
    coreTeam: coreTeam.map(mapCoreTeam),
    alumni: alumni.map(mapAlumni),
    presidents: presidents.map(mapPresident),
  });
});

/* ------------------------------------------------------------------
   /api/public/home  -> the home page
------------------------------------------------------------------ */

export const getPublicHome = asyncHandler(async (_req, res) => {
  const settings = await SiteSettings.getSettings();

  const [supervisors, coreMembers, images] = await Promise.all([
    Leadership.find({ isActive: true, showOnHome: true }).sort(activeSort),
    CoreTeam.find({ isActive: true, showOnHome: true })
      .sort(activeSort)
      .populate("member", "name"),
    HomeImage.find({ isActive: true })
      .sort(activeSort)
      /*
        The home grid is a fixed CSS layout, so the number of images
        rendered is capped by an explicit setting rather than growing
        every time an admin adds one.
      */
      .limit(settings.homeGalleryLimit),
  ]);

  res.json({
    success: true,

    /* "OUR TEAM" supervisor strip */
    supervisors: supervisors.map((item) => ({
      id: String(item._id),
      name: item.name,
      designation: item.designation,
      image: url(item.homeImage) || url(item.image),
    })),

    /* "OUR CORE TEAM" carousel */
    coreMembers: coreMembers.map((item) => ({
      id: String(item._id),
      name: item.member?.name || "",
      designation: item.designation,
      image: url(item.homeImage) || url(item.image),
      description: item.description,
    })),

    /* "OUR ACHIEVEMENTS" grid */
    images: images.map((item, index) => ({
      id: String(item._id),
      image: url(item.image),
      alt: item.alt || item.title || `Gallery Image ${index + 1}`,
    })),
  });
});

/* ------------------------------------------------------------------
   /api/public/gallery -> the /gallery page
------------------------------------------------------------------ */

export const getPublicGallery = asyncHandler(async (_req, res) => {
  const settings = await SiteSettings.getSettings();

  const images = await GalleryImage.find({ isActive: true })
    .sort(activeSort)
    .limit(settings.galleryLimit || 500);

  res.json({
    success: true,
    images: images.map((item, index) => ({
      id: String(item._id),
      image: url(item.image),
      alt: item.alt || item.title || `GEARS Gallery ${index + 1}`,
      category: item.category || "GEARS",
      title: item.title,
      description: item.description,
    })),
  });
});

/* Individually addressable sections, for pages that need only one. */

export const getPublicPresidents = asyncHandler(async (_req, res) => {
  const items = await President.find().sort(activeSort);
  res.json({ success: true, items: items.map(mapPresident) });
});

export const getPublicAlumni = asyncHandler(async (_req, res) => {
  const items = await Alumni.find({ isActive: true }).sort(activeSort);
  res.json({ success: true, items: items.map(mapAlumni) });
});

export const getPublicLeadership = asyncHandler(async (_req, res) => {
  const items = await Leadership.find({ isActive: true }).sort(activeSort);
  res.json({ success: true, items: items.map(mapLeadership) });
});

export const getPublicHomeImages = asyncHandler(async (_req, res) => {
  const settings = await SiteSettings.getSettings();

  const items = await HomeImage.find({ isActive: true })
    .sort(activeSort)
    .limit(settings.homeGalleryLimit);

  res.json({
    success: true,
    items: items.map((item, index) => ({
      id: String(item._id),
      image: url(item.image),
      alt: item.alt || item.title || `Gallery Image ${index + 1}`,
    })),
  });
});
