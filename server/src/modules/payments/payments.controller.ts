import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import * as paymentsService from "./payments.service";

export const initiatePaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { bookingId, customerPhone } = req.body;
  const result = await paymentsService.initiatePayment(req.user.id, bookingId, customerPhone);

  res.status(201).json({
    success: true,
    data: result,
  });
});

export const getPaymentForBookingHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { bookingId } = req.params;
  const result = await paymentsService.getPaymentForBooking(req.user.id, bookingId, req.user.roles);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const verifyPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { id } = req.params;
  const payment = await paymentsService.verifyPayment(req.user.id, id, req.user.roles);

  res.status(200).json({
    success: true,
    data: { payment },
  });
});

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const signature = (req.headers["x-epay-signature"] || req.headers["x-signature"]) as string | undefined;
  const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));

  const result = await paymentsService.handleWebhook(rawBody, signature);

  res.status(200).json({
    received: true,
    result,
  });
});
