import type { Booking, BookingStatus } from "../types/booking";
import type { PlugType } from "../types/charger";

export const PLUG_LABELS: Record<PlugType, string> = {
  "GB/T": "GB/T",
  TYPE_2: "Type 2",
  CCS2: "CCS 2",
};

// The server expires PENDING bookings lazily, so a stale PENDING one is shown as Expired.
export function effectiveStatus(
  booking: Pick<Booking, "status" | "expiresAt">,
  now: number,
): BookingStatus {
  if (
    booking.status === "PENDING" &&
    booking.expiresAt &&
    new Date(booking.expiresAt).getTime() <= now
  ) {
    return "EXPIRED";
  }
  return booking.status;
}

export function minutesUntil(iso: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 60000));
}

export function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export const shortRef = (id: string) => id.slice(0, 6).toUpperCase();

export const formatEtb = (value: number) => `${value.toFixed(2)} ETB`;
