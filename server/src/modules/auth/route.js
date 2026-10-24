import { Router } from "express";
import { login, loginSchema, logout, profile, updateProfile, updateProfileSchema, register, registerSchema } from "./controller.js";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, profile);
router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);
router.post("/logout", requireAuth, logout);
export default router;
