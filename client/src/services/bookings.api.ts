import { api } from "./api";
import type { Booking, BookingStatus, ChargingSession, CreateBookingInput } from "../types/booking";

export async function createBooking(input: CreateBookingInput) {
  const res = await api.post("/bookings", input);
  return res.data.data.booking as Booking;
}

export async function listBookings(status?: BookingStatus) {
  const res = await api.get("/bookings", { params: { status } });
  return res.data.data.bookings as Booking[];
}

export async function getBooking(id: string) {
  const res = await api.get(`/bookings/${id}`);
  return res.data.data.booking as Booking;
}

export async function confirmBooking(id: string) {
  const res = await api.post(`/bookings/${id}/confirm`);
  return res.data.data.booking as Booking;
}

export async function cancelBooking(id: string) {
  const res = await api.post(`/bookings/${id}/cancel`);
  return res.data.data.booking as Booking;
}

export async function startSession(bookingId: string) {
  const res = await api.post("/charging-sessions", { bookingId });
  return res.data.data as { session: ChargingSession; bookingStatus: BookingStatus };
}

export async function listSessions() {
  const res = await api.get("/charging-sessions");
  return res.data.data.sessions as ChargingSession[];
}

export async function getSession(id: string) {
  const res = await api.get(`/charging-sessions/${id}`);
  return res.data.data.session as ChargingSession;
}

export async function finishSession(id: string, energyDeliveredKwh: number) {
  const res = await api.post(`/charging-sessions/${id}/finish`, { energyDeliveredKwh });
  return res.data.data as { session: ChargingSession; bookingStatus: BookingStatus };
}