import { WEEKDAYS, type Weekday } from "./constants";

const WEEKDAY_INDEX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

export function weekdayOf(isoDate: string): Weekday | "sun" | null {
  if (!isIsoDate(isoDate)) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return WEEKDAY_INDEX[utc.getUTCDay()] ?? null;
}

export function isDeliveryWeekday(value: string | null): value is Weekday {
  return value != null && (WEEKDAYS as readonly string[]).includes(value);
}

/** Monday that starts the calendar week containing `isoDate`. */
export function mondayOf(isoDate: string): string | null {
  const weekday = weekdayOf(isoDate);
  if (!weekday) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const back = weekday === "sun" ? 6 : WEEKDAY_INDEX.indexOf(weekday) - 1;
  utc.setUTCDate(utc.getUTCDate() - back);
  return utc.toISOString().slice(0, 10);
}

export function floridaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return now.toISOString().slice(0, 10);
  return `${year}-${month}-${day}`;
}
