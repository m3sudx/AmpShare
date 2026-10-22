export type PlugType = "GB/T" | "TYPE_2" | "CCS2";

export interface Charger {
  id: string;
  hostId?: string; // only returned to the owner
  title: string;
  addressDescription: string;
  powerKw: number;
  plugType: PlugType;
  pricePerKwh: number;
  isActive: boolean;
  timezoneName: string;
  location: { latitude: number; longitude: number };
  createdAt: string;
}
export interface NearbyCharger {
  id: string;
  title: string;
  powerKw: number;
  plugType: PlugType;
  pricePerKwh: number;
  location: { latitude: number; longitude: number };
  distanceMeters: number;
}

export interface CreateChargerInput {
  title: string;
  addressDescription: string;
  powerKw: number;
  plugType: PlugType;
  pricePerKwh: number;
  timezoneName?: string;
  location: { latitude: number; longitude: number };
}
export type UpdateChargerInput = Partial<CreateChargerInput> & { isActive?: boolean };

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}