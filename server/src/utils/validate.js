import { ApiError } from "./ApiError.js";

export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export const requireFields = (body, fields) => {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    );
  });

  if (missing.length) {
    throw ApiError.badRequest(
      `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(
        ", "
      )}`,
      { fields: missing }
    );
  }
};

/*
  Password policy applied on the server for every password change,
  regardless of what the frontend allowed through.
*/
export const assertStrongPassword = (password) => {
  const value = String(password || "");

  if (value.length < 8) {
    throw ApiError.badRequest(
      "Password must be at least 8 characters long"
    );
  }

  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw ApiError.badRequest(
      "Password must contain at least one letter and one number"
    );
  }
};

/* Keeps only the listed keys, so clients cannot set internal fields. */
export const pick = (source = {}, keys = []) => {
  const result = {};

  keys.forEach((key) => {
    if (source[key] !== undefined) result[key] = source[key];
  });

  return result;
};

export const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase().trim();
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return undefined;
};
