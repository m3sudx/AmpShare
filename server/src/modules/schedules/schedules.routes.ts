import { Router } from "express";
import {
  createScheduleHandler,
  deleteScheduleHandler,
  listSchedulesHandler,
  updateScheduleHandler,
} from "./schedules.controller";
const router = Router();

router.get("/chargers/:chargerId/schedules", listSchedulesHandler);
router.post("/chargers/:chargerId/schedules", createScheduleHandler);
router.patch("/schedules/:id", updateScheduleHandler);
router.delete("/schedules/:id", deleteScheduleHandler);

export default router;