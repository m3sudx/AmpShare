// "00:46:10" style clock for a running session
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// 1120000 -> "18 h 40 min", 2700000 -> "45 min"
export function formatHoursMinutes(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function formatHoursMinutesText(ms: number): string {
  const { hours, minutes } = formatHoursMinutes(ms);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}
