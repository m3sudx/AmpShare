import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as controller from "./charging-sessions.controller";

const router = Router();
router.use(authenticate);

router.post("/", controller.start);
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/:id/finish", controller.finish);

export default router;
