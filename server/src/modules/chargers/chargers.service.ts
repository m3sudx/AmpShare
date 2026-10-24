import { pool } from "../../config/db";
import type { QueryResultRow } from "pg";
import { announceAvailability, announceChargersChanged } from "../../socket";
import type {
  CreateChargerInput,
  ListChargersQuery,
  NearbyChargersQuery,
  UpdateChargerInput,
} from "./chargers.validation";

// ---------- GET /api/chargers/nearby ----------

interface NearbyChargerRow extends QueryResultRow {
  id: string;
  title: string;
  power_kw: number | string;
  plug_type: string;
  price_per_kwh: number | string;
  latitude: number | string;
  longitude: number | string;
  distance_meters: number | string;
}

export interface NearbyCharger {
  id: string;
  title: string;
  powerKw: number;
  plugType: string;
  pricePerKwh: number;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceMeters: number;
}

export async function findNearbyChargers(
  query: NearbyChargersQuery
): Promise<NearbyCharger[]> {
  const sql = `
    SELECT
      id,
      title,
      power_kw,
      plug_type,
      price_per_kwh,

      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,

      ST_Distance(
        location,
        ST_SetSRID(
          ST_MakePoint($1, $2),
          4326
        )::geography
      ) AS distance_meters

    FROM chargers

    WHERE is_active = TRUE

      AND ST_DWithin(
        location,
        ST_SetSRID(
          ST_MakePoint($1, $2),
          4326
        )::geography,
        $3
      )

      AND ($4::text IS NULL OR plug_type::text = $4::text)

    ORDER BY distance_meters ASC

    LIMIT $5;
  `;

  const values = [
    query.lng,
    query.lat,
    query.radius,
    query.plugType ?? null,
    query.limit,
  ];

  const result = await pool.query<NearbyChargerRow>(sql, values);

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    powerKw: Number(row.power_kw),
    plugType: row.plug_type,
    pricePerKwh: Number(row.price_per_kwh),
    location: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    distanceMeters: Number(row.distance_meters),
  }));
}

// ---------- POST /api/chargers ----------

interface ChargerRow extends QueryResultRow {
  id: string;
  host_id: string;
  title: string;
  address_description: string;
  power_kw: number | string;
  plug_type: string;
  price_per_kwh: number | string;
  is_active: boolean;
  timezone_name: string;
  latitude: number | string;
  longitude: number | string;
  created_at: Date;
}

export interface Charger {
  id: string;
  hostId: string;
  title: string;
  addressDescription: string;
  powerKw: number;
  plugType: string;
  pricePerKwh: number;
  isActive: boolean;
  timezoneName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
}

export async function createCharger(
  hostId: string,
  input: CreateChargerInput
): Promise<Charger> {
  const sql = `
    INSERT INTO chargers (
      host_id,
      title,
      address_description,
      power_kw,
      plug_type,
      price_per_kwh,
      is_active,
      timezone_name,
      location
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      FALSE,
      $7,
      ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography
    )
    RETURNING
      id,
      host_id,
      title,
      address_description,
      power_kw,
      plug_type,
      price_per_kwh,
      is_active,
      timezone_name,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      created_at;
  `;

  const values = [
    hostId,
    input.title,
    input.addressDescription,
    input.powerKw,
    input.plugType,
    input.pricePerKwh,
    input.timezoneName,
    input.location.longitude,
    input.location.latitude,
  ];

  const result = await pool.query<ChargerRow>(sql, values);
  const row = result.rows[0];

  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    addressDescription: row.address_description,
    powerKw: Number(row.power_kw),
    plugType: row.plug_type,
    pricePerKwh: Number(row.price_per_kwh),
    isActive: row.is_active,
    timezoneName: row.timezone_name,
    location: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    createdAt: row.created_at.toISOString(),
  };
}


// ---------- GET /api/chargers ----------

interface ChargerSummaryRow extends QueryResultRow {
  id: string;
  title: string;
  address_description: string;
  power_kw: number | string;
  plug_type: string;
  price_per_kwh: number | string;
  timezone_name: string;
  latitude: number | string;
  longitude: number | string;
}

export interface ChargerSummary {
  id: string;
  title: string;
  addressDescription: string;
  powerKw: number;
  plugType: string;
  pricePerKwh: number;
  timezoneName: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface ListChargersResult {
  chargers: ChargerSummary[];
  total: number;
}

export async function listChargers(
  query: ListChargersQuery
): Promise<ListChargersResult> {
  const whereClause = `
    WHERE is_active = TRUE
      AND ($1::text IS NULL OR plug_type::text = $1::text)
      AND ($2::numeric IS NULL OR power_kw >= $2::numeric)
      AND ($3::numeric IS NULL OR price_per_kwh <= $3::numeric)
  `;

  const listSql = `
    SELECT
      id,
      title,
      address_description,
      power_kw,
      plug_type,
      price_per_kwh,
      timezone_name,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude
    FROM chargers
    ${whereClause}
    ORDER BY created_at DESC, id ASC
    LIMIT $4 OFFSET $5;
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM chargers
    ${whereClause};
  `;

  const filterValues = [
    query.plugType ?? null,
    query.minPowerKw ?? null,
    query.maxPricePerKwh ?? null,
  ];

  const offset = (query.page - 1) * query.limit;

  const [listResult, countResult] = await Promise.all([
    pool.query<ChargerSummaryRow>(listSql, [
      ...filterValues,
      query.limit,
      offset,
    ]),
    pool.query<{ total: string }>(countSql, filterValues),
  ]);

  return {
    chargers: listResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      addressDescription: row.address_description,
      powerKw: Number(row.power_kw),
      plugType: row.plug_type,
      pricePerKwh: Number(row.price_per_kwh),
      timezoneName: row.timezone_name,
      location: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
    })),
    total: Number(countResult.rows[0].total),
  };
}


// ---------- GET /api/chargers/:id ----------

export interface ChargerDetail extends Omit<Charger, "hostId"> {
  hostId?: string; // only present when the viewer is the owner
}

function mapChargerRow(row: ChargerRow): Charger {
  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    addressDescription: row.address_description,
    powerKw: Number(row.power_kw),
    plugType: row.plug_type,
    pricePerKwh: Number(row.price_per_kwh),
    isActive: row.is_active,
    timezoneName: row.timezone_name,
    location: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    createdAt: row.created_at.toISOString(),
  };
}

export async function getChargerById(
  id: string,
  viewerId?: string
): Promise<ChargerDetail | null> {
  const sql = `
    SELECT
      id,
      host_id,
      title,
      address_description,
      power_kw,
      plug_type,
      price_per_kwh,
      is_active,
      timezone_name,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      created_at
    FROM chargers
    WHERE id = $1
      AND (is_active = TRUE OR host_id = $2::uuid);
  `;

  const result = await pool.query<ChargerRow>(sql, [id, viewerId ?? null]);
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  const { hostId, ...charger } = mapChargerRow(row);

  return row.host_id === viewerId ? { ...charger, hostId } : charger;
}


// ---------- GET /api/chargers/mine ----------

export async function listChargersByHost(
  hostId: string
): Promise<Charger[]> {
  const sql = `
    SELECT
      id,
      host_id,
      title,
      address_description,
      power_kw,
      plug_type,
      price_per_kwh,
      is_active,
      timezone_name,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      created_at
    FROM chargers
    WHERE host_id = $1
    ORDER BY created_at DESC, id ASC;
  `;

  const result = await pool.query<ChargerRow>(sql, [hostId]);

  return result.rows.map(mapChargerRow);
}



// ---------- PATCH /api/chargers/:id ----------

export async function updateCharger(
  id: string,
  hostId: string,
  input: UpdateChargerInput
): Promise<Charger | null> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  // Column names below are fixed literals (a whitelist); only values are parameters.
  const setColumn = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (input.title !== undefined) setColumn("title", input.title);
  if (input.addressDescription !== undefined)
    setColumn("address_description", input.addressDescription);
  if (input.powerKw !== undefined) setColumn("power_kw", input.powerKw);
  if (input.plugType !== undefined) setColumn("plug_type", input.plugType);
  if (input.pricePerKwh !== undefined)
    setColumn("price_per_kwh", input.pricePerKwh);
  if (input.timezoneName !== undefined)
    setColumn("timezone_name", input.timezoneName);
  if (input.isActive !== undefined) setColumn("is_active", input.isActive);

  if (input.location !== undefined) {
    values.push(input.location.longitude, input.location.latitude);
    assignments.push(
      `location = ST_SetSRID(ST_MakePoint($${values.length - 1}, $${values.length}), 4326)::geography`
    );
  }

  if (assignments.length === 0) {
    throw new Error("updateCharger called with no fields to update");
  }

  values.push(id, hostId);

  const sql = `
    UPDATE chargers
    SET ${assignments.join(", ")}
    WHERE id = $${values.length - 1}
      AND host_id = $${values.length}
    RETURNING
      id,
      host_id,
      title,
      address_description,
      power_kw,
      plug_type,
      price_per_kwh,
      is_active,
      timezone_name,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      created_at;
  `;

  const result = await pool.query<ChargerRow>(sql, values);
  const row = result.rows[0];

  if (!row) return null;

  // Live update: viewers of this charger and everyone browsing the list refetch
  announceAvailability(row.id, "CHARGER_UPDATED");
  announceChargersChanged(row.id);

  return mapChargerRow(row);
}

// ---------- DELETE /api/chargers/:id ----------

export type DeleteChargerResult = "deleted" | "not_found" | "has_bookings";

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23503"
  );
}

export async function deleteCharger(
  id: string,
  hostId: string
): Promise<DeleteChargerResult> {
  try {
    const result = await pool.query(
      `DELETE FROM chargers WHERE id = $1 AND host_id = $2`,
      [id, hostId]
    );

    if (result.rowCount === 0) return "not_found";

    // Live update: the charger no longer exists
    announceAvailability(id, "CHARGER_UPDATED");
    announceChargersChanged(id);

    return "deleted";
  } catch (error) {
    // 23503 = foreign_key_violation: a booking still references this charger.
    if (isForeignKeyViolation(error)) {
      return "has_bookings";
    }

    throw error;
  }
}