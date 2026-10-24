import { pool } from "../../config/db";
import { emitToUser } from "../../socket";
import { AppError } from "../../utils/app-error";

type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED";

type BookingInfo = {
  id: string;
  driverId: string;
  startTime: Date | string;
  charger: { title: string };
  host: { id: string };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toNotification(row: any) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    bookingId: row.booking_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

const fmt = (d: Date | string) =>
  new Date(d).toLocaleString("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    dateStyle: "medium",
    timeStyle: "short",
  });

// Saves the notification, then pushes it live. Never breaks the booking if it fails.
async function notifyUser(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId: string;
}) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, booking_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.userId, input.type, input.title, input.body, input.bookingId],
    );
    emitToUser(input.userId, "notification", toNotification(rows[0]));
  } catch (err) {
    console.error("Failed to create notification", err);
  }
}

export const notifyBookingCreated = (b: BookingInfo) =>
  notifyUser({
    userId: b.host.id,
    type: "BOOKING_CREATED",
    title: "New booking request",
    body: `${b.charger.title} was requested for ${fmt(b.startTime)}.`,
    bookingId: b.id,
  });

export const notifyBookingConfirmed = (b: BookingInfo) =>
  notifyUser({
    userId: b.driverId,
    type: "BOOKING_CONFIRMED",
    title: "Booking confirmed",
    body: `${b.charger.title} is confirmed for ${fmt(b.startTime)}.`,
    bookingId: b.id,
  });

// cancelledBy is the user who cancelled; the other side is notified
export const notifyBookingCancelled = (b: BookingInfo, cancelledBy: string) =>
  notifyUser({
    userId: cancelledBy === b.driverId ? b.host.id : b.driverId,
    type: "BOOKING_CANCELLED",
    title: "Booking cancelled",
    body: `The booking for ${b.charger.title} on ${fmt(b.startTime)} was cancelled.`,
    bookingId: b.id,
  });

export async function listNotifications(
  userId: string,
  opts: { unreadOnly?: boolean; limit?: number },
) {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const { rows } = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1 AND ($2::boolean = false OR read_at IS NULL)
     ORDER BY created_at DESC LIMIT $3`,
    [userId, Boolean(opts.unreadOnly), limit],
  );
  const count = await pool.query(
    `SELECT count(*)::int AS n FROM notifications
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return {
    notifications: rows.map(toNotification),
    unreadCount: count.rows[0].n as number,
  };
}

export async function markRead(userId: string, id: string) {
  if (!UUID.test(id)) throw new AppError("Notification not found", 404);
  const { rows } = await pool.query(
    `UPDATE notifications SET read_at = COALESCE(read_at, now())
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId],
  );
  if (rows.length === 0) throw new AppError("Notification not found", 404);
  return toNotification(rows[0]);
}

export async function markAllRead(userId: string) {
  await pool.query(
    `UPDATE notifications SET read_at = now()
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
}