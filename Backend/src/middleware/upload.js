import fs from "fs";
import path from "path";
import multer from "multer";

const profileUploadDir = path.join(process.cwd(), "uploads", "profiles");

fs.mkdirSync(profileUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, profileUploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const employeeId = req.authUser?.employeeId || "user";
    const safeEmployeeId = employeeId.replace(/[^a-zA-Z0-9-_]/g, "");

    cb(null, `${safeEmployeeId}-${Date.now()}${ext}`);
  },
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (_req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  const error = new Error("Only JPG, PNG, and WEBP images are allowed.");
  error.statusCode = 400;
  cb(error, false);
};

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});
