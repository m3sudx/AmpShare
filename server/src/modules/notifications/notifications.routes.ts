import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as controller from "./controller";

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.post("/read-all", controller.readAll);
router.patch("/:id/read", controller.read);

export default router;