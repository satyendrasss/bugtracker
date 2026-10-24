import { z } from "zod";
import * as service from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const optionalText = z.string().trim().max(2000).optional().nullable();
export const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  key: z.string().trim().min(2).max(10).regex(/^[A-Za-z][A-Za-z0-9]*$/),
  description: optionalText,
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  leadId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable()
});
export const updateSchema = createSchema.partial();
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  res.json({ success: true, data: await service.list({ search: req.query.search, status: req.query.status, page, limit }) });
});
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await service.get(req.params.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body) }));
export const remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); res.json({ success: true, message: "Project archived." }); });
