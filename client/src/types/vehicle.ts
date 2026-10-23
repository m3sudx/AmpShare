import type { PlugType } from "./charger";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  batteryCapacityKwh: number;
  plugType: PlugType;
}
