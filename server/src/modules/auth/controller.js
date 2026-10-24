import { z } from "zod";
import * as service from "./service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128)
});
export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128)
});

export const register = asyncHandler(async (req, res) => {
  const result = await service.register(req.body);
  res.status(201).json({ success: true, message: "Account created.", data: result });
});
export const login = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.login(req.body) });
});
export const profile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getProfile(req.user.id) });
});
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(255).optional()
}).strict();
export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateProfile(req.user.id, req.body) });
});
export const logout = asyncHandler(async (req, res) => {
  // Access tokens are stateless. The client should discard its token.
  res.json({ success: true, message: "Signed out. Discard the access token on the client." });
});
