import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  initiatePaymentBodySchema,
  paymentIdParamsSchema,
  bookingIdParamsSchema,
} from "./payments.validation";
import * as controller from "./payments.controller";

const router = Router();

// Public webhook endpoint for payment provider callbacks
router.post("/webhook", controller.webhookHandler);

// Protected customer & station endpoints
router.post(
  "/initiate",
  authenticate,
  validate({ body: initiatePaymentBodySchema }),
  controller.initiatePaymentHandler,
);

router.get(
  "/booking/:bookingId",
  authenticate,
  validate({ params: bookingIdParamsSchema }),
  controller.getPaymentForBookingHandler,
);

router.post(
  "/:id/verify",
  authenticate,
  validate({ params: paymentIdParamsSchema }),
  controller.verifyPaymentHandler,
);

export default router;
