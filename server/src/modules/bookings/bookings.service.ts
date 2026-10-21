import type { PoolClient } from "pg";
import { pool } from "../../config/db";
import { AppError } from "../../utils/app-error";
import { hasPgCode, withTransaction } from "../../utils/db-helpers";

const PENDING_HOLD_MINUTES = 15;

type Db = { query: (text: string, params?: any[]) => Promise<any> };

// Explicit columns so qr_handshake_token never leaks
const COLS = `b.id, b.driver_id, b.charger_id, b.vehicle_id, b.status, b.start_time, b.end_time,
  b.price_per_kwh_at_booking, b.estimated_energy_kwh, b.estimated_cost, b.final_cost,
  b.expires_at, b.created_at,
  c.title AS charger_title, c.address_description AS charger_address,
  c.power_kw AS charger_power_kw, c.plug_type AS charger_plug_type,
  v.make AS vehicle_make, v.model AS vehicle_model, v.plug_type AS vehicle_plug_type,
  h.id AS host_id, h.full_name AS host_name`;

const FROM = `FROM bookings b
  JOIN chargers c ON c.id = b.charger_id
  JOIN vehicles v ON v.id = b.vehicle_id
  JOIN users h ON h.id = c.host_id`;

function toBooking(row: any) {
  return {
    id: row.id,
    driverId: row.driver_id,
    chargerId: row.charger_id,
    vehicleId: row.vehicle_id,
    status: row.status,
    startTime: row.start_time,
    endTime: row.end_time,
    pricePerKwh: Number(row.price_per_kwh_at_booking),
    estimatedEnergyKwh:
      row.estimated_energy_kwh === null
        ? null
        : Number(row.estimated_energy_kwh),
    estimatedCost: Number(row.estimated_cost),
    finalCost: row.final_cost === null ? null : Number(row.final_cost),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    charger: {
      id: row.charger_id,
      title: row.charger_title,
      addressDescription: row.charger_address,
      powerKw: Number(row.charger_power_kw),
      plugType: row.charger_plug_type,
    },
    vehicle: {
      id: row.vehicle_id,
      make: row.vehicle_make,
      model: row.vehicle_model,
      plugType: row.vehicle_plug_type,
    },
    host: { id: row.host_id, fullName: row.host_name },
  };
}

async function fetchBooking(db: Db, id: string) {
  const { rows } = await db.query(`SELECT ${COLS} ${FROM} WHERE b.id = $1`, [
    id,
  ]);
  return toBooking(rows[0]);
}

export async function createBooking(
  driverId: string,
  input: {
    chargerId: string;
    vehicleId: string;
    startTime: string;
    endTime: string;
  },
) {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  try {
    return await withTransaction(async (client) => {
      const vehicle = await client.query(
        "SELECT id FROM vehicles WHERE id = $1 AND driver_id = $2",
        [input.vehicleId, driverId],
      );
      if (vehicle.rowCount === 0) throw new AppError("Vehicle not found", 404);

      const chargerRes = await client.query(
        "SELECT id, power_kw, price_per_kwh, is_active, timezone_name FROM chargers WHERE id = $1",
        [input.chargerId],
      );
      if (chargerRes.rowCount === 0)
        throw new AppError("Charger not found", 404);
      const charger = chargerRes.rows[0];
      if (!charger.is_active)
        throw new AppError("Charger is not available for booking", 409);

      // The whole interval must sit inside one schedule window, in the charger's local time
      const fits = await client.query(
        `WITH local AS (
           SELECT ($2::timestamptz AT TIME ZONE $4::text) AS s,
                  ($3::timestamptz AT TIME ZONE $4::text) AS e
         )
         SELECT EXISTS (
           SELECT 1 FROM charger_schedules cs, local l
           WHERE cs.charger_id = $1
             AND l.s::date = l.e::date
             AND cs.day_of_week = EXTRACT(DOW FROM l.s)::int
             AND cs.start_time <= l.s::time
             AND cs.end_time >= l.e::time
         ) AS fits`,
        [charger.id, start, end, charger.timezone_name],
      );
      if (!fits.rows[0].fits) {
        throw new AppError(
          "Requested time is outside the charger's schedule",
          400,
        );
      }

      // Expired holds still block the slot until their status changes
      await client.query(
        `UPDATE bookings SET status = 'EXPIRED'
         WHERE charger_id = $1 AND status = 'PENDING' AND expires_at <= now()`,
        [charger.id],
      );

      const hours = (end.getTime() - start.getTime()) / 3_600_000;
      const energy = Math.round(Number(charger.power_kw) * hours * 1000) / 1000;
      const price = Number(charger.price_per_kwh);
      const cost = Math.round(energy * price * 100) / 100;

      const inserted = await client.query(
        `INSERT INTO bookings
           (driver_id, charger_id, vehicle_id, start_time, end_time, status,
            price_per_kwh_at_booking, estimated_energy_kwh, estimated_cost, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8, now() + make_interval(mins => $9::int))
         RETURNING id`,
        [
          driverId,
          charger.id,
          input.vehicleId,
          start,
          end,
          price,
          energy,
          cost,
          PENDING_HOLD_MINUTES,
        ],
      );
      return fetchBooking(client, inserted.rows[0].id);
    });
  } catch (err) {
    if (hasPgCode(err, "23P01"))
      throw new AppError("Time slot is not available", 409);
    throw err;
  }
}

export async function listBookings(userId: string, status?: string) {
  const { rows } = await pool.query(
    `SELECT ${COLS} ${FROM}
     WHERE (b.driver_id = $1 OR c.host_id = $1)
       AND ($2::booking_status IS NULL OR b.status = $2::booking_status)
     ORDER BY b.start_time DESC`,
    [userId, status ?? null],
  );
  return rows.map(toBooking);
}

export async function getBooking(userId: string, id: string) {
  const { rows } = await pool.query(
    `SELECT ${COLS} ${FROM}
     WHERE b.id = $1 AND (b.driver_id = $2 OR c.host_id = $2)`,
    [id, userId],
  );
  if (rows.length === 0) throw new AppError("Booking not found", 404);
  return toBooking(rows[0]);
}

async function lockBooking(client: PoolClient, id: string) {
  const { rows } = await client.query(
    `SELECT b.id, b.status, b.driver_id, b.expires_at, c.host_id
     FROM bookings b JOIN chargers c ON c.id = b.charger_id
     WHERE b.id = $1 FOR UPDATE OF b`,
    [id],
  );
  return rows[0];
}

type ConfirmResult =
  | { ok: true; booking: ReturnType<typeof toBooking> }
  | { ok: false; conflict: string };

export async function confirmBooking(hostId: string, id: string) {
  const result = await withTransaction<ConfirmResult>(async (client) => {
    const row = await lockBooking(client, id);
    if (!row || row.host_id !== hostId)
      throw new AppError("Booking not found", 404);

    if (row.status !== "PENDING") {
      return {
        ok: false,
        conflict: `Booking is ${row.status} and cannot be confirmed`,
      };
    }

    if (new Date(row.expires_at) <= new Date()) {
      // Return instead of throwing, so this EXPIRED update is committed, not rolled back
      await client.query(
        "UPDATE bookings SET status = 'EXPIRED' WHERE id = $1",
        [id],
      );
      return { ok: false, conflict: "Booking has expired" };
    }

    await client.query(
      "UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1",
      [id],
    );
    return { ok: true, booking: await fetchBooking(client, id) };
  });

  if (!result.ok) throw new AppError(result.conflict, 409);
  return result.booking;
}

export async function cancelBooking(userId: string, id: string) {
  return withTransaction(async (client) => {
    const row = await lockBooking(client, id);
    if (!row || (row.driver_id !== userId && row.host_id !== userId)) {
      throw new AppError("Booking not found", 404);
    }
    if (!["PENDING", "CONFIRMED"].includes(row.status)) {
      throw new AppError(
        `Booking is ${row.status} and cannot be cancelled`,
        409,
      );
    }
    await client.query(
      "UPDATE bookings SET status = 'CANCELLED' WHERE id = $1",
      [id],
    );
    return fetchBooking(client, id);
  });
}
