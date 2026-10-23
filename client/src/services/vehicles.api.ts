import { api } from "./api";
import type {
  Vehicle,
  CreateVehiclePayload,
  UpdateVehiclePayload,
} from "../types/vehicle";

export async function listMyVehicles(): Promise<Vehicle[]> {
  const res = await api.get("/vehicles");
  return res.data.data.vehicles as Vehicle[];
}

export async function getVehiclesRequest(): Promise<Vehicle[]> {
  return listMyVehicles();
}

export async function createVehicleRequest(
  payload: CreateVehiclePayload
): Promise<Vehicle> {
  const res = await api.post("/vehicles", payload);
  return res.data.data.vehicle as Vehicle;
}

export async function getVehicleByIdRequest(
  id: string
): Promise<Vehicle> {
  const res = await api.get(`/vehicles/${id}`);
  return res.data.data.vehicle as Vehicle;
}

export async function updateVehicleRequest(
  id: string,
  payload: UpdateVehiclePayload
): Promise<Vehicle> {
  const res = await api.patch(`/vehicles/${id}`, payload);
  return res.data.data.vehicle as Vehicle;
}

export async function deleteVehicleRequest(
  id: string
): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}
