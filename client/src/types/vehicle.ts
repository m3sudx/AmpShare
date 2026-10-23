import type { PlugType } from "./charger";

export type { PlugType } from "./charger";

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  batteryCapacityKwh: number;
  plugType: PlugType;
  createdAt: string;
}

export interface CreateVehiclePayload {
  make: string;
  model: string;
  batteryCapacityKwh: number;
  plugType: PlugType;
}

export interface UpdateVehiclePayload {
  make?: string;
  model?: string;
  batteryCapacityKwh?: number;
  plugType?: PlugType;
}

export const PLUG_TYPE_OPTIONS: {
  value: PlugType;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: "GB/T",
    label: "GB/T",
    shortLabel: "GB/T",
    description: "GB/T charging connector",
  },
  {
    value: "TYPE_2",
    label: "Type 2",
    shortLabel: "Type 2",
    description: "Type 2 charging connector",
  },
  {
    value: "CCS2",
    label: "CCS2",
    shortLabel: "CCS2",
    description: "Combined Charging System 2",
  },
];
