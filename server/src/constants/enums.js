/* =========================================================
   SHARED STATUS CONSTANTS
   Used by models, controllers and (mirrored) by the admin UI.
========================================================= */

export const REGISTRATION_STATUS = {
  PENDING: "Pending",
  MEMBER: "Member",
  FAILED: "Failed",
};

export const REGISTRATION_STATUSES = Object.values(REGISTRATION_STATUS);

export const MEMBER_STATUS = {
  MEMBER: "Member",
  CORE_MEMBER: "Core Member",
  ALUMNI: "Alumni",
  TERMINATE: "Terminate",
};

export const MEMBER_STATUSES = Object.values(MEMBER_STATUS);

/*
  Core team designations.
  Stored as a free string so new roles can be added without a migration;
  this list is only the suggested set shown in the admin dropdown.
  The existing GEARS roles are included so the static data migrates cleanly.
*/
export const CORE_TEAM_DESIGNATIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Information Secretary",
  "Technical Head",
  "Inventory Head",
  "Finance Secretary",
  "Media Head",
  "Documentation Head",
  "Lego Head",
];

export const GENDERS = ["Male", "Female"];

export const DOCUMENT_CATEGORIES = [
  "Minute Sheet",
  "Official Letter",
  "Certificate",
  "Form",
  "Report",
  "Other",
];
