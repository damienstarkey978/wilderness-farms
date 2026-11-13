import type { FarmStore } from "./db";

export function setCartons(
  farm: FarmStore,
  raw: string,
): { ok: true; count: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: "Enter the carton count as a whole number." };
  const count = Number(trimmed);
  if (!Number.isSafeInteger(count)) return { ok: false, error: "That carton count is too large." };
  farm.setCartonCount(count);
  return { ok: true, count };
}

export function changeCartons(
  farm: FarmStore,
  raw: string,
): { ok: true; count: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: "Enter how many cartons to add or remove, as a whole number." };
  }
  const delta = Number(trimmed);
  if (!Number.isSafeInteger(delta)) return { ok: false, error: "That carton change is too large." };
  return farm.adjustCartons(delta);
}
