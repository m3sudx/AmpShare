import { pool } from "../../config/db";
import { announceAvailability, announceChargersChanged } from "../../socket";
import { AppError } from "../../utils/app-error";
import { hasPgCode } from "../../utils/db-helpers";
import type { CreateReviewInput, ListReviewsQuery } from "./reviews.validation";

export interface Review {
  id: string;
  bookingId: string;
  chargerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
}

// "Abel Tesfaye" -> "Abel T." so a driver's full name is never shown to others
function shortName(fullName: string): string {
  const [first = "Driver", second] = fullName.trim().split(/\s+/);
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
}

function toReview(row: any): Review {
  return {
    id: row.id,
    bookingId: row.booking_id,
    chargerId: row.charger_id,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
    reviewerName: shortName(row.full_name ?? ""),
  };
}

const REVIEW_SELECT = `
  SELECT r.id, r.booking_id, r.charger_id, r.rating, r.comment, r.created_at, u.full_name
  FROM reviews r
  JOIN users u ON u.id = r.driver_id`;

// ---------- POST /bookings/:bookingId/review ----------

export async function createReview(
  driverId: string,
  bookingId: string,
  input: CreateReviewInput,
): Promise<Review> {
  const { rows } = await pool.query(
    `SELECT b.id, b.driver_id, b.charger_id, b.status,
            EXISTS (
              SELECT 1 FROM payments p
              WHERE p.booking_id = b.id AND p.status = 'SUCCEEDED'
            ) AS paid
     FROM bookings b
     WHERE b.id = $1`,
    [bookingId],
  );
  const booking = rows[0];

  // Only the booking's own driver may review; everyone else gets "not found"
  if (!booking || booking.driver_id !== driverId) {
    throw new AppError("Booking not found", 404);
  }
  if (booking.status !== "COMPLETED" || !booking.paid) {
    throw new AppError("You can review a charger once your session is paid", 409);
  }

  let reviewId: string;
  try {
    const inserted = await pool.query(
      `INSERT INTO reviews (booking_id, charger_id, driver_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [bookingId, booking.charger_id, driverId, input.rating, input.comment ?? null],
    );
    reviewId = inserted.rows[0].id;
  } catch (err) {
    if (hasPgCode(err, "23505")) {
      throw new AppError("You already reviewed this booking", 409);
    }
    throw err;
  }

  const saved = await pool.query(`${REVIEW_SELECT} WHERE r.id = $1`, [reviewId]);

  // Live update: the new average shows on charger cards and the details page
  announceChargersChanged(booking.charger_id);
  announceAvailability(booking.charger_id, "CHARGER_UPDATED");

  return toReview(saved.rows[0]);
}

// ---------- GET /bookings/:bookingId/review ----------

export async function getBookingReview(userId: string, bookingId: string) {
  const { rows } = await pool.query(
    `SELECT b.id, b.driver_id, b.status, c.host_id,
            EXISTS (
              SELECT 1 FROM payments p
              WHERE p.booking_id = b.id AND p.status = 'SUCCEEDED'
            ) AS paid
     FROM bookings b
     JOIN chargers c ON c.id = b.charger_id
     WHERE b.id = $1`,
    [bookingId],
  );
  const booking = rows[0];
  if (!booking || (booking.driver_id !== userId && booking.host_id !== userId)) {
    throw new AppError("Booking not found", 404);
  }

  const existing = await pool.query(`${REVIEW_SELECT} WHERE r.booking_id = $1`, [bookingId]);
  const review = existing.rows[0] ? toReview(existing.rows[0]) : null;

  return {
    review,
    // The driver may write one only after paying, and only once
    canReview:
      booking.driver_id === userId &&
      booking.status === "COMPLETED" &&
      booking.paid === true &&
      review === null,
  };
}

// ---------- GET /chargers/:chargerId/reviews ----------

export async function listChargerReviews(chargerId: string, query: ListReviewsQuery) {
  const exists = await pool.query("SELECT 1 FROM chargers WHERE id = $1", [chargerId]);
  if (exists.rowCount === 0) throw new AppError("Charger not found", 404);

  const offset = (query.page - 1) * query.limit;

  const [list, summary] = await Promise.all([
    pool.query(
      `${REVIEW_SELECT}
       WHERE r.charger_id = $1
       ORDER BY r.created_at DESC, r.id ASC
       LIMIT $2 OFFSET $3`,
      [chargerId, query.limit, offset],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count,
              ROUND(AVG(rating)::numeric, 1) AS average,
              COUNT(*) FILTER (WHERE rating = 1)::int AS s1,
              COUNT(*) FILTER (WHERE rating = 2)::int AS s2,
              COUNT(*) FILTER (WHERE rating = 3)::int AS s3,
              COUNT(*) FILTER (WHERE rating = 4)::int AS s4,
              COUNT(*) FILTER (WHERE rating = 5)::int AS s5
       FROM reviews
       WHERE charger_id = $1`,
      [chargerId],
    ),
  ]);

  const s = summary.rows[0];
  return {
    reviews: list.rows.map(toReview),
    summary: {
      count: s.count as number,
      average: s.average === null ? null : Number(s.average),
      distribution: { 1: s.s1, 2: s.s2, 3: s.s3, 4: s.s4, 5: s.s5 },
    },
    page: query.page,
    limit: query.limit,
  };
}