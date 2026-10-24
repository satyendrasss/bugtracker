import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";

const router = Router();
router.use(requireRole("ADMIN"));
router.get("/", controller.list);
router.post("/", validate(controller.createSchema), controller.create);
router.get("/:id", controller.get);
router.patch("/:id", validate(controller.updateSchema), controller.update);
router.delete("/:id", controller.remove);
export default router;
