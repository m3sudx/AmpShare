import type { Booking, BookingStatus } from "../types/booking";

export const PLUG_LABELS: Record<string, string> = {
  TYPE_1: "Type 1",
  TYPE_2: "Type 2",
  CCS: "CCS",
  CCS2: "CCS2",
  CHADEMO: "CHAdeMO",
  GB_T: "GB/T",
  TESLA: "Tesla",
};

export function effectiveStatus(booking: Booking, now: number): BookingStatus {
  if (booking.status === "PENDING" && booking.expiresAt) {
    const expiry = new Date(booking.expiresAt).getTime();
    if (Number.isFinite(expiry) && expiry <= now) return "EXPIRED";
  }
  return booking.status;
}

export function formatEtb(value: number): string {
  return `${value.toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

export function formatDuration(start: string, end: string): string {
  const minutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

export function minutesUntil(expiry: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(expiry).getTime() - now) / 60_000));
}

export function shortRef(id: string): string {
  return id.replaceAll("-", "").slice(-8).toUpperCase();
}
