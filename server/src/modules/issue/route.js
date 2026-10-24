import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";

const router = Router();
router.get("/", controller.list);
router.post("/", validate(controller.createSchema), controller.create);
router.get("/:id", controller.get);
router.patch("/:id", validate(controller.updateSchema), controller.update);
router.delete("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), controller.remove);
router.post("/:id/comments", validate(controller.commentSchema), controller.addComment);
router.delete("/:id/comments/:commentId", controller.deleteComment);
export default router;
