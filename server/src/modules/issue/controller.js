import { z } from "zod";
import * as service from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const dueDate = z.string().datetime().optional().nullable();
export const createSchema = z.object({
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().min(1).max(30000),
  type: z.enum(["BUG", "TASK", "IMPROVEMENT", "FEATURE"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  projectId: z.string().min(1),
  assigneeId: z.string().optional().nullable(),
  dueDate
});
export const updateSchema = createSchema.partial();
export const commentSchema = z.object({ body: z.string().trim().min(1).max(10000) });
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  res.json({ success: true, data: await service.list({ search: req.query.search, projectId: req.query.projectId, status: req.query.status, priority: req.query.priority, assigneeId: req.query.assigneeId, page, limit }) });
});
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await service.get(req.params.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body, req.user.id) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body) }));
export const remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); res.json({ success: true, message: "Issue archived." }); });
export const addComment = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.addComment(req.params.id, req.user.id, req.body.body) }));
export const deleteComment = asyncHandler(async (req, res) => { await service.deleteComment(req.params.id, req.params.commentId, req.user); res.json({ success: true, message: "Comment deleted." }); });
