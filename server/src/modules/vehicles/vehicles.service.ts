import { pool } from "../../config/db";
import { AppError } from "../../utils/app-error";
import type { CreateVehicleInput } from "./vehicles.validation";

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
