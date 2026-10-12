import { Registration } from "../models/Registration.js";
import { Member } from "../models/Member.js";
import { CoreTeam } from "../models/CoreTeam.js";
import { Inventory } from "../models/Inventory.js";
import { DocumentFile } from "../models/DocumentFile.js";
import { GalleryImage } from "../models/GalleryImage.js";
import { HomeImage } from "../models/HomeImage.js";
import { Admin } from "../models/Admin.js";
import { SiteSettings } from "../models/SiteSettings.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  REGISTRATION_STATUS,
  MEMBER_STATUS,
} from "../constants/enums.js";

/* Every number here is a live count. Nothing is stubbed. */
export const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalRegistrations,
    pendingRegistrations,
    memberRegistrations,
    failedRegistrations,
    totalMembers,
    coreMembers,
    alumniMembers,
    coreTeamRecords,
    inventoryItems,
    inventoryUnits,
    documents,
    galleryImages,
    homeImages,
    admins,
    settings,
    recentRegistrations,
    recentMembers,
    recentInventory,
  ] = await Promise.all([
    Registration.countDocuments(),
    Registration.countDocuments({ status: REGISTRATION_STATUS.PENDING }),
    Registration.countDocuments({ status: REGISTRATION_STATUS.MEMBER }),
    Registration.countDocuments({ status: REGISTRATION_STATUS.FAILED }),
    Member.countDocuments(),
    Member.countDocuments({ status: MEMBER_STATUS.CORE_MEMBER }),
    Member.countDocuments({ status: MEMBER_STATUS.ALUMNI }),
    CoreTeam.countDocuments({ isActive: true }),
    Inventory.countDocuments(),
    Inventory.aggregate([
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]),
    DocumentFile.countDocuments(),
    GalleryImage.countDocuments({ isActive: true }),
    HomeImage.countDocuments({ isActive: true }),
    Admin.countDocuments({ isActive: true }),
    SiteSettings.getSettings(),
    Registration.find()
      .sort("-createdAt")
      .limit(6)
      .select("studentName rollNumber status createdAt"),
    Member.find()
      .sort("-createdAt")
      .limit(6)
      .select("name rollNumber status createdAt"),
    Inventory.find()
      .sort("-updatedAt")
      .limit(6)
      .select("name quantity updatedAt"),
  ]);

  res.json({
    success: true,

    stats: {
      totalRegistrations,
      pendingRegistrations,
      memberRegistrations,
      failedRegistrations,
      totalMembers,
      coreMembers,
      alumniMembers,
      coreTeamRecords,
      inventoryItems,
      inventoryUnits: inventoryUnits[0]?.total || 0,
      documents,
      galleryImages,
      homeImages,
      admins,
    },

    registrationEnabled: settings.registrationEnabled,

    recent: {
      registrations: recentRegistrations,
      members: recentMembers,
      inventory: recentInventory,
    },
  });
});
