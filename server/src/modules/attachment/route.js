import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import * as controller from "./controller.js";
import { HttpError } from "../../utils/httpError.js";

const router = Router();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const maxBytes = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).slice(0, 12)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname || file.originalname.length > 255) return cb(new HttpError(400, "Invalid file name."));
    cb(null, true);
  }
});

router.get("/issue/:issueId", controller.list);
router.post("/issue/:issueId", (req, res, next) => upload.single("file")(req, res, error => {
  if (error) return next(error instanceof multer.MulterError ? new HttpError(400, error.code === "LIMIT_FILE_SIZE" ? `File exceeds ${process.env.MAX_FILE_SIZE_MB || 10} MB.` : error.message) : error);
  next();
}), controller.upload);
router.get("/:id/download", controller.download);
router.delete("/:id", controller.remove);
export default router;
