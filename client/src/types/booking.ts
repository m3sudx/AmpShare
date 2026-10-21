import type { PlugType } from "./charger";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export interface BookingCharger {
  id: string;
  title: string;
  addressDescription: string;
  powerKw: number;
  plugType: PlugType;
}

export interface BookingVehicle {
  id: string;
  make: string;
  model: string;
  plugType: PlugType;
}

export interface BookingHost {
  id: string;
  fullName: string;
}

export interface Booking {
  id: string;
  driverId: string;
  chargerId: string;
  vehicleId: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  pricePerKwh: number;
  estimatedEnergyKwh: number | null;
  estimatedCost: number;
  finalCost: number | null;
  expiresAt: string | null;
  createdAt: string;
  charger: BookingCharger;
  vehicle: BookingVehicle;
  host: BookingHost;
}

export interface CreateBookingInput {
  chargerId: string;
  vehicleId: string;
  startTime: string; // ISO
  endTime: string; // ISO
}

export type SessionStatus = "ACTIVE" | "FINISHED";

export interface ChargingSession {
  id: string;
  bookingId: string;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  energyDeliveredKwh: number;
  pricePerKwh: number;
  finalCost: number | null;
  booking: { startTime: string; endTime: string };
  charger: {
    title: string;
    addressDescription: string;
    powerKw: number;
    plugType: PlugType;
  };
  vehicle: { make: string; model: string };
}
