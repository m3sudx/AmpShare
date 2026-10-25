import { pool } from "../config/db";
import { announceBookingUpdated, type BookingUpdateReason } from "./index";

// Fire-and-forget: a socket problem must never break a booking, session or payment
export async function broadcastBookingUpdate(
  bookingId: string,
  reason: BookingUpdateReason
): Promise<void> {
  try {
    const { rows } = await pool.query(
      `SELECT b.driver_id, c.host_id
       FROM bookings b
       JOIN chargers c ON c.id = b.charger_id
       WHERE b.id = $1`,
      [bookingId]
    );
    if (rows[0]) {
      announceBookingUpdated(bookingId, [rows[0].driver_id, rows[0].host_id], reason);
    }
  } catch (err) {
    console.error("broadcastBookingUpdate failed:", err);
  }
}