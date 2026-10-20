export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// "08:00:00" -> "08:00"
export const trimSeconds = (time: string) => time.slice(0, 5);

export const formatPrice = (value: number) => `${value.toFixed(2)} ETB / kWh`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });