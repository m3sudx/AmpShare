import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import * as controller from "./bookings.controller";

const router = Router();
router.use(authenticate);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/:id/confirm", controller.confirm);
router.post("/:id/cancel", controller.cancel);

export default router;
