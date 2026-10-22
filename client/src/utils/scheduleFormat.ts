import type { Schedule } from "../types/schedule";

export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first (0 = Sunday)
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toHHMM = (t: string) => t.slice(0, 5);

export function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function slotsForDay(schedules: Schedule[], day: number) {
  return schedules
    .filter((s) => s.dayOfWeek === day)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

export function formatSlot(s: Schedule) {
  return `${toHHMM(s.startTime)} – ${toHHMM(s.endTime)}`;
}

// today's weekday index (0 = Sunday) in the charger's own time zone
export function todayIndex(timeZone: string) {
  try {
    const name = new Date().toLocaleDateString("en-US", { weekday: "short", timeZone });
    const i = DAY_SHORT.indexOf(name);
    return i === -1 ? new Date().getDay() : i;
  } catch {
    return new Date().getDay();
  }
}