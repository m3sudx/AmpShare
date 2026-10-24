import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import * as hostPayoutsService from "./host-payouts.service";

export const getMyEarningsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const result = await hostPayoutsService.getHostEarnings(req.user.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const listAdminPayoutsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const statusFilter = req.query.status as string | undefined;
  const result = await hostPayoutsService.listAdminPayouts(statusFilter);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const recordManualPayoutHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { id } = req.params;
  const payout = await hostPayoutsService.recordManualPayout(req.user.id, id, req.body);

  res.status(200).json({
    success: true,
    data: { payout },
  });
});
