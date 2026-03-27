// utils/propertyUpload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// temp upload folder
const rootUploadPath = path.join(process.cwd(), "upload");
const tmpFolder = path.join(rootUploadPath, "tmp");

// ensure tmp folder exists
if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true });

// ensure final folders exist
function ensureFolder(sub) {
  const p = path.join(rootUploadPath, sub);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
}
ensureFolder("properties/hero");
ensureFolder("properties/images");
ensureFolder("properties/brochure");

// allowed mimes
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const VIDEO_MIMES = ["video/mp4"];
const PDF_MIME = ["application/pdf"];
const ALL_ALLOWED = [...IMAGE_MIMES, ...VIDEO_MIMES, ...PDF_MIME];

// temp multer storage (dest -> upload/tmp)
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpFolder),
  filename: (req, file, cb) => {
    // use multer generated name (we will rename/move later)
    const ext = path.extname(file.originalname);
    const name = file.fieldname + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const tempUpload = multer({
  storage: tempStorage,
  limits: { fileSize: 150 * 1024 * 1024 }, // max single file 150MB; adjust if needed
  fileFilter: (req, file, cb) => {
    // basic allowed check
    if (!ALL_ALLOWED.includes(file.mimetype)) {
      return cb(new Error("File type not allowed"), false);
    }
    // per-field checks
    if (file.fieldname === "brochure" && !PDF_MIME.includes(file.mimetype)) {
      return cb(new Error("Brochure must be a PDF"), false);
    }
    if (file.fieldname === "gallery" && !IMAGE_MIMES.includes(file.mimetype)) {
      return cb(new Error("Gallery accepts images only"), false);
    }
    if (file.fieldname === "heroMedia" && !(IMAGE_MIMES.includes(file.mimetype) || VIDEO_MIMES.includes(file.mimetype))) {
      return cb(new Error("Hero media must be image or MP4"), false);
    }
    cb(null, true);
  },
});

/**
 * Middleware: handles multipart upload and moves files to final folders.
 * Usage: propertyUploadMiddleware (applies to upload.fields([...]) internally)
 */
function propertyUploadMiddleware() {
  // multer.fields configuration (accept all expected fields at once)
  const fieldsMiddleware = tempUpload.fields([
    { name: "heroMedia", maxCount: 3 },
    { name: "gallery",   maxCount: 6 },
    { name: "brochure",  maxCount: 1 },
  ]);

  // wrapper to run multer then move files
  return async function (req, res, next) {
    fieldsMiddleware(req, res, (err) => {
      if (err) {
        // Pass multer errors to next
        return next(err);
      }

      // If no files, just continue
      if (!req.files || Object.keys(req.files).length === 0) {
        req._movedFiles = true;
        return next();
      }

      // Move files from tmp -> respective folders and update req.files entries
      try {
        const result = {};

        // helper to move an array of files to given subfolder
        const moveFiles = (arr, subfolder) => {
          if (!arr || !arr.length) return [];
          const destFolder = path.join(rootUploadPath, subfolder);
          return arr.map((f) => {
            // new filename: keep original extension but create safe unique name
            const ext = path.extname(f.originalname) || path.extname(f.filename);
            const newName = f.fieldname + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
            const destPath = path.join(destFolder, newName);

            // move (rename) from tmp to dest
            fs.renameSync(f.path, destPath);

            // update file object fields to mimic multer's diskStorage output
            return {
              fieldname: f.fieldname,
              originalname: f.originalname,
              encoding: f.encoding,
              mimetype: f.mimetype,
              destination: destFolder,
              filename: newName,
              path: destPath,
              size: f.size,
            };
          });
        };

        // heroMedia -> upload/properties/hero
        if (Array.isArray(req.files.heroMedia)) {
          result.heroMedia = moveFiles(req.files.heroMedia, "properties/hero");
        }

        // gallery -> upload/properties/images
        if (Array.isArray(req.files.gallery)) {
          result.gallery = moveFiles(req.files.gallery, "properties/images");
        }

        // brochure -> upload/properties/brochure
        if (Array.isArray(req.files.brochure)) {
          result.brochure = moveFiles(req.files.brochure, "properties/brochure");
        }

        // replace req.files with new structure (arrays for each field)
        req.files = result;
        req._movedFiles = true;
        return next();
      } catch (moveErr) {
        // on failure, attempt to cleanup any moved files and pass error
        try {
          // Try to remove files that may have been moved
          if (req.files) {
            Object.values(req.files).flat().forEach((f) => {
              try {
                if (f && f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
              } catch (e) { /* ignore */ }
            });
          }
        } catch (cleanupErr) {
          // ignore
        }
        return next(moveErr);
      }
    });
  };
}

module.exports = { propertyUploadMiddleware };
