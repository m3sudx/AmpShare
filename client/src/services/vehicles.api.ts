import { api } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  Vehicle,
  VehicleListResponse,
  VehicleResponse,
} from "../types/vehicle";

/**
 * List all vehicles belonging to the authenticated driver.
 * GET /api/vehicles
 */
export async function getVehiclesRequest(): Promise<VehicleListResponse> {
  const res = await api.get<ApiResponse<VehicleListResponse>>("/vehicles");
  return res.data.data;
}

/**
 * Retrieve one owned vehicle by its UUID.
 * GET /api/vehicles/:id
 */
export async function getVehicleByIdRequest(id: string): Promise<Vehicle> {
  const res = await api.get<ApiResponse<VehicleResponse>>(`/vehicles/${id}`);
  return res.data.data.vehicle;
}

/**
 * Create a new vehicle for the authenticated driver.
 * POST /api/vehicles
 */
export async function createVehicleRequest(
  payload: CreateVehiclePayload
): Promise<Vehicle> {
  const res = await api.post<ApiResponse<VehicleResponse>>("/vehicles", payload);
  return res.data.data.vehicle;
}

/**
 * Update supported fields of an owned vehicle.
 * PATCH /api/vehicles/:id
 */
export async function updateVehicleRequest(
  id: string,
  payload: UpdateVehiclePayload
): Promise<Vehicle> {
  const res = await api.patch<ApiResponse<VehicleResponse>>(
    `/vehicles/${id}`,
    payload
  );
  return res.data.data.vehicle;
}

/**
 * Delete an owned vehicle.
 * Expects HTTP 204 No Content (empty response body).
 * DELETE /api/vehicles/:id
 */
export async function deleteVehicleRequest(id: string): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}
