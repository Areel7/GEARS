/* Escapes user input before it is used inside a RegExp. */
export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildSearch = (search, fields) => {
  const term = String(search || "").trim();
  if (!term || !fields.length) return null;

  const pattern = new RegExp(escapeRegex(term), "i");

  return { $or: fields.map((field) => ({ [field]: pattern })) };
};

export const parsePagination = (query, defaultLimit = 25) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

  const rawLimit = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(rawLimit, 1), 200);

  return { page, limit, skip: (page - 1) * limit };
};

/*
  Only allows sorting by a known-safe field so a caller cannot
  probe arbitrary paths or build an expensive sort.
*/
export const parseSort = (query, allowed, fallback = "-createdAt") => {
  const requested = String(query.sort || "").trim();
  if (!requested) return fallback;

  const field = requested.replace(/^-/, "");
  if (!allowed.includes(field)) return fallback;

  return requested;
};
