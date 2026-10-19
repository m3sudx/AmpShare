import { asyncHandler } from "../../utils/async-handler";
import { parseOrThrow } from "../../utils/validate";
import * as service from "./bookings.service";
import {
  bookingIdParamSchema,
  createBookingSchema,
  listBookingsQuerySchema,
} from "./bookings.validation";

export const create = asyncHandler(async (req, res) => {
  const input = parseOrThrow(createBookingSchema, req.body);
  const booking = await service.createBooking(req.user!.id, input);
  res.status(201).json({ success: true, data: { booking } });
});

export const list = asyncHandler(async (req, res) => {
  const { status } = parseOrThrow(listBookingsQuerySchema, req.query);
  const bookings = await service.listBookings(req.user!.id, status);
  res
    .status(200)
    .json({ success: true, data: { bookings, count: bookings.length } });
});

export const getOne = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(bookingIdParamSchema, req.params);
  const booking = await service.getBooking(req.user!.id, id);
  res.status(200).json({ success: true, data: { booking } });
});

export const confirm = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(bookingIdParamSchema, req.params);
  const booking = await service.confirmBooking(req.user!.id, id);
  res.status(200).json({ success: true, data: { booking } });
});

export const cancel = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(bookingIdParamSchema, req.params);
  const booking = await service.cancelBooking(req.user!.id, id);
  res.status(200).json({ success: true, data: { booking } });
});
