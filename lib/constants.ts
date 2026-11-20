export const PRICE_CENTS = 1000;
export const LAYING_START = "March 2027";
export const PENDING_HOLD_MS = 30 * 60 * 1000;
export const ADMIN_COOKIE = "wf_admin";
export const STAFF_COOKIE = "wf_staff";
export const VISITOR_COOKIE = "wf_visitor";
export const DEFAULT_ADMIN_PASSWORD = "wilderness-local";

export const STAFF = [
  { id: "damien", name: "Damien" },
  { id: "howard", name: "Howard" },
  { id: "gavin", name: "Gavin" },
  { id: "hollis", name: "Hollis" },
] as const;
export type StaffId = (typeof STAFF)[number]["id"];
export type PayeeId = "gavin" | "hollis";

export function isStaffId(value: string): value is StaffId {
  return STAFF.some((person) => person.id === value);
}

export function staffName(id: StaffId): string {
  return STAFF.find((person) => person.id === id)?.name ?? id;
}

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type Cadence = "weekly" | "one_time";

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

/** Monday includes Sunday's lay. Tue–Sat are one day's production. */
export const CAPS: Record<Weekday, number> = {
  mon: 50,
  tue: 25,
  wed: 25,
  thu: 25,
  fri: 25,
  sat: 25,
};

export function isWeekday(value: string): value is Weekday {
  return (WEEKDAYS as readonly string[]).includes(value);
}

export function isCadence(value: string): value is Cadence {
  return value === "weekly" || value === "one_time";
}

export function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function orderAmountCents(dozens: number): number {
  return dozens * PRICE_CENTS;
}
