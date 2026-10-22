import { api } from "./api";
import type {
  Charger, CreateChargerInput, NearbyCharger, Pagination, PlugType, UpdateChargerInput,
} from "../types/charger";

export async function getNearbyChargers(params: {
  lat: number; lng: number; radius?: number; plugType?: PlugType; limit?: number;
}) {
  const res = await api.get("/chargers/nearby", { params });
  return res.data.data.chargers as NearbyCharger[]; 
}

export async function listChargers(params: {
  plugType?: PlugType; minPowerKw?: number; maxPricePerKwh?: number; page?: number; limit?: number;
}) {
  const res = await api.get("/chargers", { params });
  return res.data.data as { chargers: Charger[]; pagination: Pagination };
}

export async function getCharger(id: string) {
  const res = await api.get(`/chargers/${id}`);
  return res.data.data.charger as Charger;
}

export async function listMyChargers() {
  const res = await api.get("/chargers/mine");
  return res.data.data.chargers as Charger[];
}

export async function createCharger(input: CreateChargerInput) {
  const res = await api.post("/chargers", input);
  return res.data.data.charger as Charger;
}

export async function updateCharger(id: string, input: UpdateChargerInput) {
  const res = await api.patch(`/chargers/${id}`, input);
  return res.data.data.charger as Charger;
}

export async function deleteCharger(id: string) {
  await api.delete(`/chargers/${id}`);
}