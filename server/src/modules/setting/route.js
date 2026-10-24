import { Router } from "express";
import * as controller from "./controller.js";
import { validate } from "../../middleware/validate.js";
const router = Router();
router.get("/", controller.get);
router.patch("/", validate(controller.updateSchema), controller.update);
export default router;
