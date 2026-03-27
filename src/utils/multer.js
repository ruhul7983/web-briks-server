// utils/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const rootUploadPath = path.join(process.cwd(), "upload");

if (!fs.existsSync(rootUploadPath)) {
  fs.mkdirSync(rootUploadPath, { recursive: true });
}

/**
 * createUploader(subfolder, options)
 */
function createUploader(subfolder, options = {}) {
  const { maxSize = 150 * 1024 * 1024, allowedMimeTypes = null } = options;
  const fullPath = path.join(rootUploadPath, subfolder);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const fileName =
        file.fieldname +
        "-" +
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        ext;
      cb(null, fileName);
    },
  });

  const defaultAllowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "video/mp4",
    "application/pdf",
  ];

  const allowed = Array.isArray(allowedMimeTypes) ? allowedMimeTypes : defaultAllowed;

  return multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter(req, file, cb) {
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error("File type not allowed"), false);
      }
      cb(null, true);
    },
  });
}

module.exports = { createUploader };
