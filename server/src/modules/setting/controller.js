import { z } from "zod";
import * as service from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const updateSchema = z.object({
  workspace: z.string().trim().min(1).max(120).optional(),
  emailNotifications: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  compactMode: z.boolean().optional()
}).strict();
export const get = asyncHandler(async (req, res) => res.json({ success: true, data: await service.get(req.user.id) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.user.id, req.body) }));
