import { z } from "zod";
import * as service from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const roles = ["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "QA_ENGINEER", "REPORTER"];
const statuses = ["ACTIVE", "INVITED", "DISABLED"];
export const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(roles).optional(),
  status: z.enum(statuses).optional()
});
export const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(roles).optional(),
  status: z.enum(statuses).optional()
});
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  res.json({ success: true, data: await service.list({ search: req.query.search, role: req.query.role, status: req.query.status, page, limit }) });
});
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await service.get(req.params.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body) }));
export const remove = asyncHandler(async (req, res) => { await service.remove(req.params.id, req.user.id); res.json({ success: true, message: "User disabled." }); });
