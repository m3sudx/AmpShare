import { pool } from "../../config/db";
import { AppError } from "../../utils/app-error";
import { hasPgCode, withTransaction } from "../../utils/db-helpers";

type Db = { query: (text: string, params?: any[]) => Promise<any> };

const SESSION_COLS = `s.id, s.booking_id, s.started_at, s.ended_at, s.energy_delivered_kwh,
  b.status AS booking_status, b.start_time AS booking_start_time, b.end_time AS booking_end_time,
  b.price_per_kwh_at_booking, b.final_cost,
  c.title AS charger_title, c.address_description AS charger_address,
  c.power_kw AS charger_power_kw, c.plug_type AS charger_plug_type,
  v.make AS vehicle_make, v.model AS vehicle_model`;

const SESSION_FROM = `FROM charging_sessions s
  JOIN bookings b ON b.id = s.booking_id
  JOIN chargers c ON c.id = b.charger_id
  JOIN vehicles v ON v.id = b.vehicle_id`;

function toSession(row: any) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    status: row.ended_at === null ? "ACTIVE" : "FINISHED",
    startedAt: row.started_at,
    endedAt: row.ended_at,
    energyDeliveredKwh: Number(row.energy_delivered_kwh),
    pricePerKwh: Number(row.price_per_kwh_at_booking),
    finalCost: row.final_cost === null ? null : Number(row.final_cost),
    booking: {
      startTime: row.booking_start_time,
      endTime: row.booking_end_time,
    },
    charger: {
      title: row.charger_title,
      addressDescription: row.charger_address,
      powerKw: Number(row.charger_power_kw),
      plugType: row.charger_plug_type,
    },
    vehicle: { make: row.vehicle_make, model: row.vehicle_model },
  };
}

// userId = null means "no access filter" (only used inside transactions that already checked access)
async function loadSession(db: Db, id: string, userId: string | null) {
  const { rows } = await db.query(
    `SELECT ${SESSION_COLS} ${SESSION_FROM}
     WHERE s.id = $1 AND ($2::uuid IS NULL OR b.driver_id = $2 OR c.host_id = $2)`,
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function startSession(userId: string, bookingId: string) {
  try {
    return await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT b.id, b.status, b.driver_id, c.host_id,
                EXISTS (SELECT 1 FROM charging_sessions s WHERE s.booking_id = b.id) AS has_session
         FROM bookings b JOIN chargers c ON c.id = b.charger_id
         WHERE b.id = $1 FOR UPDATE OF b`,
        [bookingId],
      );
      const booking = rows[0];
      if (
        !booking ||
        (booking.driver_id !== userId && booking.host_id !== userId)
      ) {
        throw new AppError("Booking not found", 404);
      }
      if (booking.has_session) {
        throw new AppError("A session already exists for this booking", 409);
      }
      if (booking.status !== "CONFIRMED") {
        throw new AppError(
          `Booking is ${booking.status} and cannot start a session`,
          409,
        );
      }

      const inserted = await client.query(
        "INSERT INTO charging_sessions (booking_id, started_at) VALUES ($1, now()) RETURNING id",
        [bookingId],
      );
      await client.query(
        "UPDATE bookings SET status = 'ACTIVE' WHERE id = $1",
        [bookingId],
      );

      const session = await loadSession(client, inserted.rows[0].id, null);
      return {
        session: toSession(session),
        bookingStatus: session.booking_status,
      };
    });
  } catch (err) {
    if (hasPgCode(err, "23505")) {
      throw new AppError("A session already exists for this booking", 409);
    }
    throw err;
  }
}

export async function listSessions(userId: string) {
  const { rows } = await pool.query(
    `SELECT ${SESSION_COLS} ${SESSION_FROM}
     WHERE b.driver_id = $1 OR c.host_id = $1
     ORDER BY s.created_at DESC`,
    [userId],
  );
  return rows.map(toSession);
}

export async function getSession(userId: string, id: string) {
  const row = await loadSession(pool, id, userId);
  if (!row) throw new AppError("Session not found", 404);
  return { session: toSession(row), bookingStatus: row.booking_status };
}

export async function finishSession(
  userId: string,
  id: string,
  energyKwh: number,
) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT s.id, s.booking_id, s.ended_at, b.status, c.host_id
       FROM charging_sessions s
       JOIN bookings b ON b.id = s.booking_id
       JOIN chargers c ON c.id = b.charger_id
       WHERE s.id = $1 FOR UPDATE OF s, b`,
      [id],
    );
    const row = rows[0];
    // Only the charger owner may finish; everyone else gets 404
    if (!row || row.host_id !== userId)
      throw new AppError("Session not found", 404);
    if (row.ended_at !== null || row.status !== "ACTIVE") {
      throw new AppError("Session is already finished", 409);
    }

    await client.query(
      `UPDATE charging_sessions
       SET ended_at = GREATEST(now(), started_at), energy_delivered_kwh = $2
       WHERE id = $1`,
      [id, energyKwh],
    );
    await client.query(
      `UPDATE bookings
       SET status = 'COMPLETED',
           final_cost = ROUND($2::numeric * price_per_kwh_at_booking, 2)
       WHERE id = $1`,
      [row.booking_id, energyKwh],
    );

    const session = await loadSession(client, id, null);
    return {
      session: toSession(session),
      bookingStatus: session.booking_status,
    };
  });
}
