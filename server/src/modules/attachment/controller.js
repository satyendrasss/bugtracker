import fs from "node:fs";
import path from "node:path";
import * as service from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list(req.params.issueId) }));
export const upload = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.params.issueId, req.user.id, req.file) }));
export const download = asyncHandler(async (req, res) => {
  const item = await service.get(req.params.id);
  const fullPath = path.resolve(process.env.UPLOAD_DIR || "uploads", item.storedName);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ success: false, message: "File is missing from storage." });
  res.download(fullPath, item.originalName);
});
export const remove = asyncHandler(async (req, res) => { await service.remove(req.params.id, req.user); res.json({ success: true, message: "Attachment deleted." }); });
