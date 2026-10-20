export type BookingStatus =
  | "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export interface Booking {
  id: string;
  driverId: string;
  chargerId: string;
  vehicleId: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  pricePerKwh: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookingInput {
  chargerId: string;
  vehicleId: string;
  startTime: string; // ISO
  endTime: string; // ISO
}

export interface ChargingSession {
  id: string;
  bookingId: string;
  startedAt: string;
  endedAt: string | null;
  energyDeliveredKwh: number | null;
}