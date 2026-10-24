import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/httpError.js";

export async function list(issueId) {
  const issue = await prisma.issue.findFirst({ where: { id: issueId, deletedAt: null }, select: { id: true } });
  if (!issue) throw new HttpError(404, "Issue not found.");
  return prisma.attachment.findMany({ where: { issueId }, orderBy: { createdAt: "desc" } });
}
export async function create(issueId, userId, file) {
  if (!file) throw new HttpError(400, "Choose a file to upload.");
  const issue = await prisma.issue.findFirst({ where: { id: issueId, deletedAt: null }, select: { id: true } });
  if (!issue) {
    await fs.unlink(file.path).catch(() => {});
    throw new HttpError(404, "Issue not found.");
  }
  return prisma.attachment.create({
    data: { issueId, uploadedById: userId, originalName: file.originalname, storedName: file.filename, mimeType: file.mimetype, size: file.size }
  });
}
export async function get(id) {
  const item = await prisma.attachment.findUnique({ where: { id } });
  if (!item) throw new HttpError(404, "Attachment not found.");
  return item;
}
export async function remove(id, user) {
  const item = await get(id);
  if (item.uploadedById !== user.id && user.role !== "ADMIN") throw new HttpError(403, "Only the uploader or an administrator can delete this attachment.");
  const fullPath = path.resolve(process.env.UPLOAD_DIR || "uploads", item.storedName);
  await fs.unlink(fullPath).catch(() => {});
  await prisma.attachment.delete({ where: { id } });
}
