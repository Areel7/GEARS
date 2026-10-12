import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/* eslint-disable-next-line no-unused-vars */
export const errorHandler = (error, req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong";
  let details = error.details || null;

  /* Mongoose validation */
  if (error.name === "ValidationError") {
    statusCode = 400;
    details = Object.fromEntries(
      Object.entries(error.errors).map(([field, item]) => [
        field,
        item.message,
      ])
    );
    message = "Please check the highlighted fields";
  }

  /* Invalid ObjectId */
  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier";
    details = null;
  }

  /* Duplicate key */
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || "value";
    message = `A record with this ${field} already exists`;
    details = null;
  }

  if (error instanceof multer.MulterError) {
    statusCode = 400;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? "File is too large"
        : "File upload failed";
  }

  if (statusCode >= 500) {
    console.error("[error]", error);
  }

  /* Never leak internals to the client. */
  const body = {
    success: false,
    message: statusCode >= 500 ? "Internal server error" : message,
  };

  if (details) body.details = details;

  if (!env.isProduction && statusCode >= 500) {
    body.debug = error.message;
  }

  res.status(statusCode).json(body);
};
