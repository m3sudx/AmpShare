import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  payoutIdParamsSchema,
  recordManualPayoutBodySchema,
} from "./host-payouts.validation";
import * as controller from "./host-payouts.controller";

const router = Router();

// Host earnings (accessible by users with HOST role)
router.get(
  "/my-earnings",
  authenticate,
  requireRole("HOST"),
  controller.getMyEarningsHandler,
);

// Admin payout management (accessible strictly by users with ADMIN role)
router.get(
  "/admin",
  authenticate,
  requireRole("ADMIN"),
  controller.listAdminPayoutsHandler,
);

router.post(
  "/admin/:id/record",
  authenticate,
  requireRole("ADMIN"),
  validate({
    params: payoutIdParamsSchema,
    body: recordManualPayoutBodySchema,
  }),
  controller.recordManualPayoutHandler,
);

export default router;
