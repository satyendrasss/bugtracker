import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";

const router = Router();
router.get("/", controller.list);
router.post("/", requireRole("ADMIN", "PROJECT_MANAGER"), validate(controller.createSchema), controller.create);
router.get("/:id", controller.get);
router.patch("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), validate(controller.updateSchema), controller.update);
router.delete("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), controller.remove);
export default router;
