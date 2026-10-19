import type { QueryResultRow } from "pg";
import { pool } from "../../config/db"; 
import { AppError } from "../../utils/app-error.js"; 
import type { CreateScheduleInput, UpdateScheduleInput } from "./schedules.validation";

// ---------- types ----------
interface ScheduleRow extends QueryResultRow {
  id: string;
  charger_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: Date;
}

// Shape sent to the client (camelCase)
export interface Schedule {
  id: string;
  chargerId: string;
  dayOfWeek: number;
  startTime: string; // "HH:MM:SS"
  endTime: string; // "HH:MM:SS"
  createdAt: string;
}

const SCHEDULE_COLUMNS = `
  s.id, s.charger_id, s.day_of_week, s.start_time, s.end_time, s.created_at
`;

function mapScheduleRow(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    chargerId: row.charger_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at.toISOString(),
  };
}

// ---------- DB error translation ----------
function getPgErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

// Turns constraint violations into clean HTTP errors. Anything else is re-thrown.
function rethrowScheduleError(error: unknown): never {
  switch (getPgErrorCode(error)) {
    case "23P01": // no_overlapping_daily_schedules (exclusion)
      throw new AppError("This time window overlaps an existing schedule for that day", 409);
    case "23505": // charger_schedules_unique_window
      throw new AppError("This schedule window already exists", 409);
    case "23514": // valid_schedule_time
      throw new AppError("endTime must be after startTime", 400);
    default:
      throw error;
  }
}

// ---------- create ----------
export async function createSchedule(
  chargerId: string,
  hostId: string,
  input: CreateScheduleInput
): Promise<Schedule | null> {
  try {
    const result = await pool.query<ScheduleRow>(
      `INSERT INTO charger_schedules (charger_id, day_of_week, start_time, end_time)
       SELECT c.id, $3::smallint, $4::time, $5::time
       FROM chargers c
       WHERE c.id = $1 AND c.host_id = $2
       RETURNING id, charger_id, day_of_week, start_time, end_time, created_at`,
      [chargerId, hostId, input.dayOfWeek, input.startTime, input.endTime]
    );
    const row = result.rows[0];
    return row ? mapScheduleRow(row) : null;
  } catch (error) {
    return rethrowScheduleError(error);
  }
}

// ---------- list ----------
export async function listSchedulesByCharger(
  chargerId: string,
  viewerId?: string
): Promise<Schedule[] | null> {
  const access = await pool.query(
    `SELECT 1
     FROM chargers
     WHERE id = $1 AND (is_active = TRUE OR host_id = $2::uuid)`,
    [chargerId, viewerId ?? null]
  );
  if (access.rowCount === 0) return null;

  const result = await pool.query<ScheduleRow>(
    `SELECT ${SCHEDULE_COLUMNS}
     FROM charger_schedules s
     WHERE s.charger_id = $1
     ORDER BY s.day_of_week ASC, s.start_time ASC`,
    [chargerId]
  );
  return result.rows.map(mapScheduleRow);
}

// ---------- update ----------
export async function updateSchedule(
  id: string,
  hostId: string,
  input: UpdateScheduleInput
): Promise<Schedule | null> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  if (input.dayOfWeek !== undefined) {
    values.push(input.dayOfWeek);
    assignments.push(`day_of_week = $${values.length}::smallint`);
  }
  if (input.startTime !== undefined) {
    values.push(input.startTime);
    assignments.push(`start_time = $${values.length}::time`);
  }
  if (input.endTime !== undefined) {
    values.push(input.endTime);
    assignments.push(`end_time = $${values.length}::time`);
  }
  if (assignments.length === 0) {
    throw new Error("updateSchedule called with no fields");
  }

  values.push(id);
  const idPos = values.length;
  values.push(hostId);
  const hostPos = values.length;

  try {
    const result = await pool.query<ScheduleRow>(
      `UPDATE charger_schedules AS s
       SET ${assignments.join(", ")}
       FROM chargers c
       WHERE s.id = $${idPos}
         AND s.charger_id = c.id
         AND c.host_id = $${hostPos}
       RETURNING ${SCHEDULE_COLUMNS}`,
      values
    );
    const row = result.rows[0];
    return row ? mapScheduleRow(row) : null;
  } catch (error) {
    return rethrowScheduleError(error);
  }
}

// ---------- delete ----------
export async function deleteSchedule(id: string, hostId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM charger_schedules s
     USING chargers c
     WHERE s.id = $1
       AND s.charger_id = c.id
       AND c.host_id = $2`,
    [id, hostId]
  );
  return (result.rowCount ?? 0) > 0;
}