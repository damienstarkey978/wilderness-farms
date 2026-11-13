import { staffName, type PayeeId, type StaffId } from "./constants";
import { isIsoDate, mondayOf } from "./dates";
import type { FarmStore, LedgerCategory, LedgerEntry } from "./db";

const OUT_CATEGORIES = ["feed", "cartons", "gas", "other"] as const;

export function parsePositiveCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const cents = Number(trimmed);
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  return cents;
}

export function recordMoney(
  farm: FarmStore,
  input: {
    direction: string;
    category: string;
    occurredOn: string;
    amount: string;
    note: string;
    staffId: StaffId;
  },
): { ok: true; entry: LedgerEntry } | { ok: false; error: string } {
  if (input.direction !== "in" && input.direction !== "out") {
    return { ok: false, error: "Choose money in or money out." };
  }
  let category: LedgerCategory;
  if (input.direction === "in") {
    category = "egg_sales";
  } else if ((OUT_CATEGORIES as readonly string[]).includes(input.category)) {
    category = input.category as LedgerCategory;
  } else {
    return { ok: false, error: "Choose feed, cartons, gas, or other." };
  }
  if (!isIsoDate(input.occurredOn)) return { ok: false, error: "Enter the date." };
  const amountCents = parsePositiveCents(input.amount);
  if (amountCents == null) return { ok: false, error: "Enter the amount in cents. $10 is 1000." };
  const note = input.note.trim();
  if (!note) return { ok: false, error: "Add a note so the ledger says what this was." };
  const entry = farm.insertLedger({
    occurredOn: input.occurredOn,
    direction: input.direction,
    category,
    amountCents,
    note,
    staffName: staffName(input.staffId),
  });
  return { ok: true, entry };
}

export function recordWeeklyPay(
  farm: FarmStore,
  input: {
    weekOf: string;
    gavinAmount: string;
    hollisAmount: string;
    note: string;
    staffId: StaffId;
  },
): { ok: true; entries: LedgerEntry[] } | { ok: false; error: string } {
  const weekStart = mondayOf(input.weekOf);
  if (!weekStart) return { ok: false, error: "Enter the week." };
  const people: { payee: PayeeId; amount: string }[] = [
    { payee: "gavin", amount: input.gavinAmount },
    { payee: "hollis", amount: input.hollisAmount },
  ];
  const paying = people.filter((person) => person.amount.trim() !== "");
  if (paying.length === 0) return { ok: false, error: "Enter a pay amount for Gavin, Hollis, or both." };
  const amounts: { payee: PayeeId; amountCents: number }[] = [];
  for (const person of paying) {
    const amountCents = parsePositiveCents(person.amount);
    if (amountCents == null) {
      const name = person.payee === "gavin" ? "Gavin" : "Hollis";
      return { ok: false, error: `Enter ${name}'s pay in cents. $10 is 1000.` };
    }
    amounts.push({ payee: person.payee, amountCents });
  }
  const extra = input.note.trim();
  const entries = amounts.map((person) => {
    const name = person.payee === "gavin" ? "Gavin" : "Hollis";
    return farm.insertLedger({
      occurredOn: weekStart,
      direction: "out",
      category: "pay",
      amountCents: person.amountCents,
      note: extra || `Weekly pay for ${name}`,
      staffName: staffName(input.staffId),
      payee: person.payee,
      weekStart,
    });
  });
  return { ok: true, entries };
}

export function ledgerTotals(entries: LedgerEntry[]): { inCents: number; outCents: number } {
  return entries.reduce(
    (totals, entry) => {
      if (entry.direction === "in") totals.inCents += entry.amountCents;
      else totals.outCents += entry.amountCents;
      return totals;
    },
    { inCents: 0, outCents: 0 },
  );
}
