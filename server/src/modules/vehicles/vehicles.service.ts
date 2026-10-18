import { pool } from "../../config/db";
import { AppError } from "../../utils/app-error";
import type { CreateVehicleInput, UpdateVehicleInput } from "./vehicles.validation";

export interface VehicleResponse {
  id: string;
  driverId: string;
  make: string;
  model: string;
  batteryCapacityKwh: number;
  plugType: "GB/T" | "TYPE_2" | "CCS2";
  createdAt: string;
}

export function formatVehicleResponse(row: {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  battery_capacity_kwh: string | number;
  plug_type: "GB/T" | "TYPE_2" | "CCS2";
  created_at: string | Date;
}): VehicleResponse {
  return {
    id: row.id,
    driverId: row.driver_id,
    make: row.make,
    model: row.model,
    batteryCapacityKwh: Number(row.battery_capacity_kwh),
    plugType: row.plug_type,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * Registers a new vehicle for the authenticated driver.
 */
export const createVehicle = async (
  driverId: string,
  input: CreateVehicleInput
): Promise<VehicleResponse> => {
  const query = `
    INSERT INTO vehicles (driver_id, make, model, battery_capacity_kwh, plug_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, driver_id, make, model, battery_capacity_kwh, plug_type, created_at
  `;

  const values = [
    driverId,
    input.make,
    input.model,
    input.batteryCapacityKwh,
    input.plugType,
  ];

  const result = await pool.query(query, values);
  return formatVehicleResponse(result.rows[0]);
};

/**
 * Lists all vehicles owned by the authenticated driver.
 */
export const getVehiclesByDriver = async (
  driverId: string
): Promise<{ vehicles: VehicleResponse[]; count: number }> => {
  const query = `
    SELECT id, driver_id, make, model, battery_capacity_kwh, plug_type, created_at
    FROM vehicles
    WHERE driver_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [driverId]);
  const vehicles = result.rows.map(formatVehicleResponse);

  return {
    vehicles,
    count: vehicles.length,
  };
};

/**
 * Retrieves a vehicle by ID for the authenticated driver.
 * Returns 404 if vehicle does not exist or belongs to another user.
 */
export const getVehicleById = async (
  driverId: string,
  vehicleId: string
): Promise<VehicleResponse> => {
  const query = `
    SELECT id, driver_id, make, model, battery_capacity_kwh, plug_type, created_at
    FROM vehicles
    WHERE id = $1 AND driver_id = $2
  `;

  const result = await pool.query(query, [vehicleId, driverId]);

  if (result.rowCount === 0) {
    throw new AppError("Vehicle not found", 404);
  }

  return formatVehicleResponse(result.rows[0]);
};

/**
 * Updates permitted vehicle fields for the authenticated driver.
 * Returns 404 if vehicle is not found or not owned by driver.
 */
export const updateVehicle = async (
  driverId: string,
  vehicleId: string,
  input: UpdateVehicleInput
): Promise<VehicleResponse> => {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.make !== undefined) {
    setClauses.push(`make = $${paramIndex++}`);
    values.push(input.make);
  }
  if (input.model !== undefined) {
    setClauses.push(`model = $${paramIndex++}`);
    values.push(input.model);
  }
  if (input.batteryCapacityKwh !== undefined) {
    setClauses.push(`battery_capacity_kwh = $${paramIndex++}`);
    values.push(input.batteryCapacityKwh);
  }
  if (input.plugType !== undefined) {
    setClauses.push(`plug_type = $${paramIndex++}`);
    values.push(input.plugType);
  }

  if (setClauses.length === 0) {
    throw new AppError("No fields provided for update", 400);
  }

  values.push(vehicleId);
  const vehicleIdParam = `$${paramIndex++}`;
  values.push(driverId);
  const driverIdParam = `$${paramIndex++}`;

  const query = `
    UPDATE vehicles
    SET ${setClauses.join(", ")}
    WHERE id = ${vehicleIdParam} AND driver_id = ${driverIdParam}
    RETURNING id, driver_id, make, model, battery_capacity_kwh, plug_type, created_at
  `;

  const result = await pool.query(query, values);

  if (result.rowCount === 0) {
    throw new AppError("Vehicle not found", 404);
  }

  return formatVehicleResponse(result.rows[0]);
};

/**
 * Deletes a vehicle owned by the authenticated driver.
 * Returns 404 if vehicle does not exist or belongs to another user.
 * Returns 409 Conflict if vehicle is referenced by existing bookings (FK RESTRICT).
 */
export const deleteVehicle = async (
  driverId: string,
  vehicleId: string
): Promise<void> => {
  try {
    const query = `
      DELETE FROM vehicles
      WHERE id = $1 AND driver_id = $2
    `;

    const result = await pool.query(query, [vehicleId, driverId]);

    if (result.rowCount === 0) {
      throw new AppError("Vehicle not found", 404);
    }
  } catch (error: any) {
    if (error?.code === "23503") {
      throw new AppError(
        "Vehicle cannot be deleted while a booking references it",
        409
      );
    }
    throw error;
  }
};
