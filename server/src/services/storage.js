import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_ROOT = path.resolve(here, "../../uploads");

/* ------------------------------------------------------------------
   SAFE NAMES
   The client filename is never trusted: it is only used to derive an
   extension, and the stored name is generated server side.
------------------------------------------------------------------ */

const EXTENSION_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
};

const safeExtension = (file) => {
  const fromMime = EXTENSION_BY_MIME[file.mimetype];
  if (fromMime) return fromMime;

  const raw = path.extname(file.originalname || "").toLowerCase();
  return /^\.[a-z0-9]{1,6}$/.test(raw) ? raw : "";
};

const generateName = (file) =>
  `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExtension(
    file
  )}`;

const sanitiseOriginalName = (name = "") =>
  path
    .basename(String(name))
    .replace(/[^\w.\- ]+/g, "_")
    .slice(0, 150);

/* ------------------------------------------------------------------
   LOCAL DRIVER
------------------------------------------------------------------ */

const localDriver = {
  async save(file, folder = "misc") {
    const dir = path.join(UPLOAD_ROOT, folder);
    await fs.mkdir(dir, { recursive: true });

    const fileName = generateName(file);
    await fs.writeFile(path.join(dir, fileName), file.buffer);

    const relative = `${folder}/${fileName}`;

    return {
      url: `${env.publicApiUrl}/uploads/${relative}`,
      publicId: relative,
      provider: "local",
      originalName: sanitiseOriginalName(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
    };
  },

  async remove(publicId) {
    if (!publicId) return;

    /* Refuse anything that could escape the uploads directory. */
    const target = path.resolve(UPLOAD_ROOT, publicId);
    if (!target.startsWith(UPLOAD_ROOT + path.sep)) return;

    await fs.rm(target, { force: true });
  },
};

/* ------------------------------------------------------------------
   CLOUDINARY DRIVER
------------------------------------------------------------------ */

let cloudinaryClient = null;

const getCloudinary = async () => {
  if (cloudinaryClient) return cloudinaryClient;

  const { v2 } = await import("cloudinary");

  v2.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });

  cloudinaryClient = v2;
  return cloudinaryClient;
};

const cloudinaryDriver = {
  async save(file, folder = "misc") {
    const client = await getCloudinary();

    const isImage = file.mimetype.startsWith("image/");

    const uploaded = await new Promise((resolve, reject) => {
      const stream = client.uploader.upload_stream(
        {
          folder: `${env.cloudinary.folder}/${folder}`,
          resource_type: isImage ? "image" : "raw",
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );

      stream.end(file.buffer);
    });

    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      provider: "cloudinary",
      originalName: sanitiseOriginalName(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
    };
  },

  async remove(publicId, mimeType = "") {
    if (!publicId) return;

    const client = await getCloudinary();

    await client.uploader.destroy(publicId, {
      resource_type: mimeType.startsWith("image/") ? "image" : "raw",
      invalidate: true,
    });
  },
};

/* ------------------------------------------------------------------
   PUBLIC API
------------------------------------------------------------------ */

const useCloudinary =
  env.storageDriver === "cloudinary" &&
  Boolean(
    env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret
  );

if (env.storageDriver === "cloudinary" && !useCloudinary) {
  console.warn(
    "[storage] STORAGE_DRIVER=cloudinary but credentials are incomplete - falling back to local disk storage."
  );
}

const driver = useCloudinary ? cloudinaryDriver : localDriver;

export const storage = {
  driverName: useCloudinary ? "cloudinary" : "local",

  saveFile: (file, folder) => driver.save(file, folder),

  /*
    Deleting stored files must never break the request that triggered
    it, so failures are logged rather than thrown.
  */
  async removeFile(fileRef) {
    if (!fileRef?.publicId) return;

    try {
      const target =
        fileRef.provider === "cloudinary" ? cloudinaryDriver : localDriver;

      await target.remove(fileRef.publicId, fileRef.mimeType || "");
    } catch (error) {
      console.error(
        `[storage] failed to remove ${fileRef.publicId}:`,
        error.message
      );
    }
  },
};
