import { Router } from "express";
import { authenticate, optionalAuthenticate, requireRole } from "../../middleware/auth";
import {
  createScheduleHandler,
  deleteScheduleHandler,
  listSchedulesHandler,
  updateScheduleHandler,
} from "./schedules.controller";

const router = Router();

router.get("/chargers/:chargerId/schedules", optionalAuthenticate, listSchedulesHandler);
router.post("/chargers/:chargerId/schedules", authenticate, requireRole("HOST"), createScheduleHandler);
router.patch("/schedules/:id", authenticate, requireRole("HOST"), updateScheduleHandler);
router.delete("/schedules/:id", authenticate, requireRole("HOST"), deleteScheduleHandler);

export default router;