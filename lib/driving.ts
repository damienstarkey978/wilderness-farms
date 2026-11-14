export const DAY_TASKS = [
  { id: "feed", label: "Feed the chickens" },
  { id: "harvest", label: "Harvest eggs" },
  { id: "cartons", label: "Wash eggs and put in cartons" },
] as const;

export type DayTaskId = (typeof DAY_TASKS)[number]["id"];

export function isDayTask(value: string): value is DayTaskId {
  return DAY_TASKS.some((task) => task.id === value);
}

type AddressParts = { number: number | null; street: string; raw: string };

function addressParts(address: string): AddressParts {
  const raw = address.trim();
  const streetLine = raw.split(",")[0]?.trim() ?? raw;
  const match = streetLine.match(/^(\d+)\s+(.+)$/);
  if (!match) return { number: null, street: streetLine.toLowerCase().replace(/\s+/g, " "), raw };
  return {
    number: Number(match[1]),
    street: match[2].toLowerCase().replace(/\s+/g, " "),
    raw,
  };
}

/** Street, then house number. Works for any address string. Not a saved demo path. */
export function compareAddresses(a: string, b: string): number {
  const left = addressParts(a);
  const right = addressParts(b);
  if (left.street !== right.street) return left.street < right.street ? -1 : 1;
  if (left.number == null && right.number == null) return left.raw.localeCompare(right.raw);
  if (left.number == null) return 1;
  if (right.number == null) return -1;
  if (left.number !== right.number) return left.number - right.number;
  return left.raw.localeCompare(right.raw);
}

export function followGpsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
}
