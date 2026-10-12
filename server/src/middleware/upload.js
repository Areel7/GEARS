import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

const DOCUMENT_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const DOCUMENT_EXTENSIONS = /\.(pdf|docx?|xlsx?|pptx?)$/i;

/*
  Files are held in memory and handed to the storage driver, so nothing
  untrusted is ever written to disk under a client-controlled name.
  Both the MIME type and the extension must match the allow-list.
*/
const makeUploader = (mimes, extensions, limit, label, maxFiles = 1) =>
  multer({
    storage: multer.memoryStorage(),

    limits: { fileSize: limit, files: maxFiles },

    fileFilter: (_req, file, callback) => {
      const mimeOk = mimes.includes(file.mimetype);
      const extensionOk = extensions.test(file.originalname || "");

      if (!mimeOk || !extensionOk) {
        callback(
          ApiError.badRequest(
            `Unsupported file type. Allowed ${label}.`
          )
        );
        return;
      }

      callback(null, true);
    },
  });

export const uploadImage = makeUploader(
  IMAGE_MIMES,
  IMAGE_EXTENSIONS,
  env.maxImageSize,
  "images: JPG, PNG, WEBP, AVIF"
);

export const uploadDocument = makeUploader(
  DOCUMENT_MIMES,
  DOCUMENT_EXTENSIONS,
  env.maxDocumentSize,
  "documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX"
);

/*
  Accepts the two image fields used by core team and leadership.
  Uses its own multer instance with files: 2 so both `image` and
  `homeImage` can be uploaded in a single multipart request.
*/
const uploadTeamImagesMulter = makeUploader(
  IMAGE_MIMES,
  IMAGE_EXTENSIONS,
  env.maxImageSize,
  "images: JPG, PNG, WEBP, AVIF",
  2
);

export const uploadTeamImages = uploadTeamImagesMulter.fields([
  { name: "image", maxCount: 1 },
  { name: "homeImage", maxCount: 1 },
]);
