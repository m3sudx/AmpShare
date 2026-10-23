// Bookings are validated by the server in the CHARGER's time zone, so the booking page builds
// every date/time in that zone instead of the browser's.

interface Parts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
}

function partsInZone(utcMs: number, timeZone: string): Parts & { ss: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const get = (type: string) =>
    Number(fmt.formatToParts(new Date(utcMs)).find((p) => p.type === type)?.value);
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    hh: get("hour"),
    mm: get("minute"),
    ss: get("second"),
  };
}

function offsetMs(utcMs: number, timeZone: string): number {
  const p = partsInZone(utcMs, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - utcMs;
}

/** Current calendar date and minutes-since-midnight in the given zone */
export function nowInZone(timeZone: string, nowMs = Date.now()) {
  const p = partsInZone(nowMs, timeZone);
  return { y: p.y, m: p.m, d: p.d, minutes: p.hh * 60 + p.mm };
}

/** Wall-clock time in `timeZone` -> UTC ISO string */
export function zonedToIso(
  dateKey: string,
  minutesOfDay: number,
  timeZone: string,
): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minutesOfDay);
  const first = guess - offsetMs(guess, timeZone);
  const utc = guess - offsetMs(first, timeZone);
  return new Date(utc).toISOString();
}

export const toDateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** "YYYY-MM-DD" + n days (calendar arithmetic, zone independent) */
export function addDays(dateKey: string, n: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return {
    key: toDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()),
    dayOfWeek: date.getUTCDay(),
    day: date.getUTCDate(),
    month: date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
    weekday: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
  };
}

export const longDate = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** 570 -> "09:30" */
export const minutesToClock = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** "08:00:00" -> 480 ("00:00:00" as an end time means midnight = 1440) */
export function clockToMinutes(time: string, isEnd = false): number {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m;
  return isEnd && total === 0 ? 1440 : total;
}
