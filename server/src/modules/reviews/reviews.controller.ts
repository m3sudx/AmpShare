import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import * as service from "./reviews.service";
import {
  bookingIdParams,
  chargerIdParams,
  createReviewBody,
  listReviewsQuery,
} from "./reviews.validation";

type Parsed<T> = (
  | { success: true; data: T }
  | { success: false; error: { issues: { message: string }[] } }
);

function parse<T>(schema: { safeParse(data: unknown): Parsed<T> }, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }
  return result.data;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = parse(bookingIdParams, req.params);
  const body = parse(createReviewBody, req.body);
  const review = await service.createReview(req.user!.id, bookingId, body);
  res.status(201).json({ success: true, data: { review } });
});

export const getForBooking = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = parse(bookingIdParams, req.params);
  const data = await service.getBookingReview(req.user!.id, bookingId);
  res.json({ success: true, data });
});

export const listForCharger = asyncHandler(async (req: Request, res: Response) => {
  const { chargerId } = parse(chargerIdParams, req.params);
  const query = parse(listReviewsQuery, req.query);
  const data = await service.listChargerReviews(chargerId, query);
  res.json({ success: true, data });
});