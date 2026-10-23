import type { Schedule } from "../types/schedule";

export interface TimeWindow {
  start: number; // minutes after midnight, in the charger's local time
  end: number;
}

export const STEP_MINUTES = 30;
export const DURATION_OPTIONS = [30, 60, 90, 120, 180];

// The server rejects bookings that cross midnight, so nothing may end after 23:59.
const LAST_MINUTE = 24 * 60 - 1;

const pad = (n: number) => String(n).padStart(2, "0");

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function formatMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function describeMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function partsIn(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
}

// "2026-10-21" for the given moment, as seen in the charger's timezone
export function todayKey(timestamp: number, timeZone: string): string {
  const p = partsIn(timestamp, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// 0 = Sunday, matching the schedules and the server
export function dayOfWeek(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

// Converts a wall-clock time in the charger's timezone to the real UTC moment
export function zonedTimeToUtc(
  dateKey: string,
  minutes: number,
  timeZone: string,
): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const wallClockAsUtc = Date.UTC(y, m - 1, d, 0, minutes);
  const p = partsIn(wallClockAsUtc, timeZone);
  const offset =
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
    wallClockAsUtc;
  return new Date(wallClockAsUtc - offset);
}

// null means the schedule could not be loaded; the server then validates the time
export function windowsFor(
  schedules: Schedule[] | null,
  day: number,
): TimeWindow[] {
  if (schedules === null) return [{ start: 0, end: LAST_MINUTE }];
  return schedules
    .filter((s) => s.dayOfWeek === day)
    .map((s) => ({
      start: toMinutes(s.startTime),
      end: Math.min(toMinutes(s.endTime), LAST_MINUTE),
    }))
    .sort((a, b) => a.start - b.start);
}

export function startTimes(windows: TimeWindow[], duration: number): number[] {
  const times: number[] = [];
  for (const w of windows) {
    for (let t = w.start; t + duration <= w.end; t += STEP_MINUTES)
      times.push(t);
  }
  return times;
}

export function dateLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function dateParts(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
  return {
    weekday: format({ weekday: "short" }),
    day: format({ day: "numeric" }),
    month: format({ month: "short" }),
  };
}
