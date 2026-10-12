import { Router } from "express";
import rateLimit from "express-rate-limit";

import { requireAuth } from "../middleware/auth.js";
import {
  uploadImage,
  uploadDocument,
  uploadTeamImages,
} from "../middleware/upload.js";
import { createContentRouter } from "./contentRoutes.js";

import * as auth from "../controllers/authController.js";
import * as admins from "../controllers/adminController.js";
import * as settings from "../controllers/settingsController.js";
import * as registrations from "../controllers/registrationController.js";
import * as members from "../controllers/memberController.js";
import * as coreTeam from "../controllers/coreTeamController.js";
import * as inventory from "../controllers/inventoryController.js";
import * as documents from "../controllers/documentController.js";
import * as publicApi from "../controllers/publicController.js";
import { getDashboard } from "../controllers/dashboardController.js";

import { President } from "../models/President.js";
import { Alumni } from "../models/Alumni.js";
import { Leadership } from "../models/Leadership.js";
import { GalleryImage } from "../models/GalleryImage.js";
import { HomeImage } from "../models/HomeImage.js";

import {
  REGISTRATION_STATUSES,
  MEMBER_STATUSES,
  CORE_TEAM_DESIGNATIONS,
  DOCUMENT_CATEGORIES,
  GENDERS,
} from "../constants/enums.js";

const router = Router();

/* ------------------------------------------------------------------
   RATE LIMITS
------------------------------------------------------------------ */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Try again in 15 minutes.",
  },
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many submissions from this network. Try again later.",
  },
});

/* ------------------------------------------------------------------
   AUTH
------------------------------------------------------------------ */

router.post("/auth/login", loginLimiter, auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", requireAuth, auth.me);
router.put(
  "/auth/profile",
  requireAuth,
  uploadImage.single("avatar"),
  auth.updateProfile
);
router.put("/auth/change-password", requireAuth, auth.changePassword);

/* ------------------------------------------------------------------
   PUBLIC  (no authentication - read only, public content only)
------------------------------------------------------------------ */

router.get("/public/settings", settings.getPublicSettings);
router.get("/public/settings/registration", settings.getPublicSettings);
router.get("/public/home", publicApi.getPublicHome);
router.get("/public/home-images", publicApi.getPublicHomeImages);
router.get("/public/team", publicApi.getPublicTeam);
router.get("/public/gallery", publicApi.getPublicGallery);
router.get("/public/president", publicApi.getPublicPresidents);
router.get("/public/alumni", publicApi.getPublicAlumni);
router.get("/public/leadership", publicApi.getPublicLeadership);

/* Public registration submission - the controller re-checks the switch. */
router.post(
  "/registrations/public",
  submissionLimiter,
  uploadImage.single("picture"),
  registrations.submitRegistration
);

/* ------------------------------------------------------------------
   SETTINGS
------------------------------------------------------------------ */

router.get("/settings", requireAuth, settings.getSettings);
router.put("/settings", requireAuth, settings.updateSettings);
router.put(
  "/settings/registration",
  requireAuth,
  settings.updateRegistrationSetting
);

/* Status values, so the admin UI never hard-codes them. */
router.get("/constants", requireAuth, (_req, res) => {
  res.json({
    success: true,
    registrationStatuses: REGISTRATION_STATUSES,
    memberStatuses: MEMBER_STATUSES,
    coreTeamDesignations: CORE_TEAM_DESIGNATIONS,
    documentCategories: DOCUMENT_CATEGORIES,
    genders: GENDERS,
  });
});

/* ------------------------------------------------------------------
   DASHBOARD
------------------------------------------------------------------ */

router.get("/dashboard", requireAuth, getDashboard);

/* ------------------------------------------------------------------
   REGISTRATIONS
------------------------------------------------------------------ */

router.get("/registrations", requireAuth, registrations.listRegistrations);
router.get(
  "/registrations/export",
  requireAuth,
  registrations.exportRegistrations
);
router.post(
  "/registrations",
  requireAuth,
  uploadImage.single("picture"),
  registrations.createRegistration
);
router.get("/registrations/:id", requireAuth, registrations.getRegistration);
router.put(
  "/registrations/:id",
  requireAuth,
  uploadImage.single("picture"),
  registrations.updateRegistration
);
router.patch(
  "/registrations/:id/status",
  requireAuth,
  registrations.updateRegistrationStatus
);
router.delete(
  "/registrations/:id",
  requireAuth,
  registrations.deleteRegistration
);

/* ------------------------------------------------------------------
   MEMBERS
------------------------------------------------------------------ */

router.get("/members", requireAuth, members.listMembers);
router.get("/members/export", requireAuth, members.exportMembers);
router.post("/members", requireAuth, members.createMember);
router.get("/members/:id", requireAuth, members.getMember);
router.put("/members/:id", requireAuth, members.updateMember);
router.patch("/members/:id/status", requireAuth, members.updateMemberStatus);
router.delete("/members/:id", requireAuth, members.deleteMember);

/* ------------------------------------------------------------------
   CORE TEAM
------------------------------------------------------------------ */

router.get("/core-team", requireAuth, coreTeam.listCoreTeam);
router.get("/core-team/export", requireAuth, coreTeam.exportCoreTeam);
router.get(
  "/core-team/eligible",
  requireAuth,
  coreTeam.listEligibleMembers
);
router.post(
  "/core-team",
  requireAuth,
  uploadTeamImages,
  coreTeam.createCoreTeamMember
);
router.get("/core-team/:id", requireAuth, coreTeam.getCoreTeamMember);
router.put(
  "/core-team/:id",
  requireAuth,
  uploadTeamImages,
  coreTeam.updateCoreTeamMember
);
router.delete("/core-team/:id", requireAuth, coreTeam.removeFromCoreTeam);

/* ------------------------------------------------------------------
   INVENTORY
------------------------------------------------------------------ */

router.get("/inventory", requireAuth, inventory.listInventory);
router.post(
  "/inventory",
  requireAuth,
  uploadImage.single("image"),
  inventory.createInventoryItem
);
router.get("/inventory/:id", requireAuth, inventory.getInventoryItem);
router.put(
  "/inventory/:id",
  requireAuth,
  uploadImage.single("image"),
  inventory.updateInventoryItem
);
router.patch(
  "/inventory/:id/quantity",
  requireAuth,
  inventory.adjustQuantity
);
router.delete("/inventory/:id", requireAuth, inventory.deleteInventoryItem);

/* ------------------------------------------------------------------
   DOCUMENTS
------------------------------------------------------------------ */

router.get("/documents", requireAuth, documents.listDocuments);
router.post(
  "/documents",
  requireAuth,
  uploadDocument.single("file"),
  documents.createDocument
);
router.get("/documents/:id", requireAuth, documents.getDocument);
router.get(
  "/documents/:id/download",
  requireAuth,
  documents.downloadDocument
);
router.put(
  "/documents/:id",
  requireAuth,
  uploadDocument.single("file"),
  documents.updateDocument
);
router.delete("/documents/:id", requireAuth, documents.deleteDocument);

/* ------------------------------------------------------------------
   ADMINS
------------------------------------------------------------------ */

router.get("/admins", requireAuth, admins.listAdmins);
router.post(
  "/admins",
  requireAuth,
  uploadImage.single("avatar"),
  admins.createAdmin
);
router.get("/admins/:id", requireAuth, admins.getAdmin);
router.put(
  "/admins/:id",
  requireAuth,
  uploadImage.single("avatar"),
  admins.updateAdmin
);
router.patch(
  "/admins/:id/password",
  requireAuth,
  admins.resetAdminPassword
);
router.delete("/admins/:id", requireAuth, admins.deleteAdmin);

/* ------------------------------------------------------------------
   CONTENT RESOURCES
------------------------------------------------------------------ */

router.use(
  "/president",
  createContentRouter({
    model: President,
    label: "President",
    folder: "presidents",
    textFields: ["name", "designation", "description", "startYear", "endYear"],
    numberFields: ["order"],
    booleanFields: ["isCurrent"],
    imageFields: [{ name: "image", required: false }],
    searchFields: ["name", "startYear", "endYear"],
  })
);

router.use(
  "/alumni",
  createContentRouter({
    model: Alumni,
    label: "Alumni record",
    folder: "alumni",
    textFields: ["name", "title", "designation", "description", "year"],
    numberFields: ["order"],
    booleanFields: ["isActive"],
    imageFields: [{ name: "image", required: false }],
    searchFields: ["name", "title", "designation", "year"],
  })
);

router.use(
  "/leadership",
  createContentRouter({
    model: Leadership,
    label: "Leadership record",
    folder: "leadership",
    textFields: ["name", "designation", "description", "session"],
    numberFields: ["order"],
    booleanFields: ["isActive", "showOnHome"],
    imageFields: [
      { name: "image", required: false },
      { name: "homeImage", required: false },
    ],
    searchFields: ["name", "designation"],
  })
);

router.use(
  "/gallery",
  createContentRouter({
    model: GalleryImage,
    label: "Gallery image",
    folder: "gallery",
    textFields: ["title", "description", "category", "alt"],
    numberFields: ["order"],
    booleanFields: ["isActive"],
    imageFields: [{ name: "image", required: true }],
    searchFields: ["title", "description", "category"],
  })
);

router.use(
  "/home-images",
  createContentRouter({
    model: HomeImage,
    label: "Home image",
    folder: "home",
    textFields: ["title", "alt"],
    numberFields: ["order"],
    booleanFields: ["isActive"],
    imageFields: [{ name: "image", required: true }],
    searchFields: ["title", "alt"],
  })
);

export default router;
