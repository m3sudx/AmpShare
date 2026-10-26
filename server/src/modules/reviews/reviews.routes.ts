import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as controller from "./reviews.controller";

const router = Router();

router.post("/bookings/:bookingId/review", authenticate, controller.create);
router.get("/bookings/:bookingId/review", authenticate, controller.getForBooking);
router.get("/chargers/:chargerId/reviews", authenticate, controller.listForCharger);

export default router;