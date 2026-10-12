/* =========================================================
   ADMIN HELPERS

   Kept out of ui.jsx so that file only exports components,
   which is what fast refresh needs to work reliably.
========================================================= */

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Never";

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* Builds multipart bodies for endpoints that accept file uploads. */
export const toFormData = (fields, files = {}) => {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, value);
  });

  Object.entries(files).forEach(([key, file]) => {
    if (file) form.append(key, file, file.name);
  });

  return form;
};
