export type PlugType = "GB/T" | "TYPE_2" | "CCS2";

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  batteryCapacityKwh: number;
  plugType: PlugType;
  createdAt: string;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  count: number;
}

export interface VehicleResponse {
  vehicle: Vehicle;
}

export interface CreateVehiclePayload {
  make: string;
  model: string;
  batteryCapacityKwh: number;
  plugType: PlugType;
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export interface PlugTypeOption {
  value: PlugType;
  label: string;
  shortLabel: string;
  description: string;
}

export const PLUG_TYPE_OPTIONS: PlugTypeOption[] = [
  {
    value: "GB/T",
    label: "GB/T (DC Fast & AC)",
    shortLabel: "GB/T",
    description: "Standard connector for Chinese imported EVs (e.g., BYD, VW ID series)",
  },
  {
    value: "CCS2",
    label: "CCS 2 (Combo 2)",
    shortLabel: "CCS 2",
    description: "Combined AC/DC fast charging standard common on European/global EVs",
  },
  {
    value: "TYPE_2",
    label: "Type 2 (Mennekes)",
    shortLabel: "Type 2",
    description: "Standard AC charging connector for European and international vehicles",
  },
];
