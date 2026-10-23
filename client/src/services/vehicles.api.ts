import { api } from "./api";
import type { Vehicle } from "../types/vehicle";

export async function listMyVehicles() {
  const res = await api.get("/vehicles");
  return res.data.data.vehicles as Vehicle[];
}
