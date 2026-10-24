import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./service.js";
export const summary = asyncHandler(async (_req, res) => res.json({ success: true, data: await service.summary() }));
