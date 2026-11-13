import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync, type SqlRow } from "node:sqlite";
import { classifyAddress, type AddressFlag } from "./address";
import {
  CAPS,
  PENDING_HOLD_MS,
  WEEKDAY_LABEL,
  WEEKDAYS,
  orderAmountCents,
  type Cadence,
  type Weekday,
} from "./constants";
import { validateRequest, type RequestInput } from "./parse";

export type SignupStatus = "interest" | "pending_payment" | "confirmed" | "canceled" | "fulfilled";
export type SignupKind = "waitlist" | "order";
export type LedgerDirection = "in" | "out";
export type LedgerCategory = "egg_sales" | "feed" | "cartons" | "gas" | "other" | "pay";
export type Payee = "gavin" | "hollis";

export type LedgerEntry = {
  id: string;
  createdAt: string;
  occurredOn: string;
  direction: LedgerDirection;
  category: LedgerCategory;
  amountCents: number;
  note: string;
  staffName: string;
  payee: Payee | null;
  weekStart: string | null;
};

export type Signup = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  addressFlag: AddressFlag;
  addressNote: string;
  dozens: number;
  cadence: Cadence;
  weekday: Weekday;
  kind: SignupKind;
  status: SignupStatus;
  amountCents: number | null;
  stripeSessionId: string | null;
  pendingExpiresAt: string | null;
  fulfilledAt: string | null;
  canceledAt: string | null;
};

export type CapacityDay = {
  weekday: Weekday;
  label: string;
  cap: number;
  reserved: number;
  remaining: number;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS signups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  address_flag TEXT NOT NULL,
  address_note TEXT NOT NULL,
  dozens INTEGER NOT NULL,
  cadence TEXT NOT NULL,
  weekday TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_cents INTEGER,
  stripe_session_id TEXT,
  pending_expires_at TEXT,
  fulfilled_at TEXT,
  canceled_at TEXT
);
CREATE INDEX IF NOT EXISTS signups_weekday_status ON signups (weekday, status);
CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  occurred_on TEXT NOT NULL,
  direction TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  note TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  payee TEXT,
  week_start TEXT
);
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  signup_id TEXT NOT NULL,
  delivered_on TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (signup_id, delivered_on)
);
CREATE TABLE IF NOT EXISTS route_order (
  weekday TEXT NOT NULL,
  signup_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (weekday, signup_id)
);
`;

function text(row: SqlRow, key: string): string {
  const value = row[key];
  return value == null ? "" : String(value);
}

function textOrNull(row: SqlRow, key: string): string | null {
  const value = row[key];
  return value == null ? null : String(value);
}

function mapLedger(row: SqlRow): LedgerEntry {
  const payee = textOrNull(row, "payee");
  return {
    id: text(row, "id"),
    createdAt: text(row, "created_at"),
    occurredOn: text(row, "occurred_on"),
    direction: text(row, "direction") as LedgerDirection,
    category: text(row, "category") as LedgerCategory,
    amountCents: Number(row.amount_cents),
    note: text(row, "note"),
    staffName: text(row, "staff_name"),
    payee: payee === "gavin" || payee === "hollis" ? payee : null,
    weekStart: textOrNull(row, "week_start"),
  };
}

function mapSignup(row: SqlRow): Signup {
  return {
    id: text(row, "id"),
    createdAt: text(row, "created_at"),
    name: text(row, "name"),
    email: text(row, "email"),
    phone: text(row, "phone"),
    address: text(row, "address"),
    addressFlag: text(row, "address_flag") as AddressFlag,
    addressNote: text(row, "address_note"),
    dozens: Number(row.dozens),
    cadence: text(row, "cadence") as Cadence,
    weekday: text(row, "weekday") as Weekday,
    kind: text(row, "kind") as SignupKind,
    status: text(row, "status") as SignupStatus,
    amountCents: row.amount_cents == null ? null : Number(row.amount_cents),
    stripeSessionId: textOrNull(row, "stripe_session_id"),
    pendingExpiresAt: textOrNull(row, "pending_expires_at"),
    fulfilledAt: textOrNull(row, "fulfilled_at"),
    canceledAt: textOrNull(row, "canceled_at"),
  };
}

export class FarmStore {
  constructor(private readonly db: DatabaseSync) {}

  close(): void {
    this.db.close();
  }

  getGreenlit(): boolean {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = 'greenlit'").get();
    return row?.value === "1";
  }

  setGreenlit(on: boolean): void {
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES ('greenlit', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(on ? "1" : "0");
  }

  listSignups(): Signup[] {
    return this.db
      .prepare("SELECT * FROM signups ORDER BY created_at DESC, id DESC")
      .all()
      .map(mapSignup);
  }

  getSignup(id: string): Signup | null {
    const row = this.db.prepare("SELECT * FROM signups WHERE id = ?").get(id);
    return row ? mapSignup(row) : null;
  }

  findBySession(sessionId: string): Signup | null {
    const row = this.db.prepare("SELECT * FROM signups WHERE stripe_session_id = ?").get(sessionId);
    return row ? mapSignup(row) : null;
  }

  reserved(weekday: Weekday, now = new Date()): number {
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(dozens), 0) AS dozen
         FROM signups
         WHERE weekday = ?
           AND kind = 'order'
           AND (
             status = 'confirmed'
             OR (status = 'pending_payment' AND pending_expires_at > ?)
           )`,
      )
      .get(weekday, now.toISOString());
    return Number(row?.dozen ?? 0);
  }

  capacity(now = new Date()): CapacityDay[] {
    return WEEKDAYS.map((weekday) => {
      const cap = CAPS[weekday];
      const reserved = this.reserved(weekday, now);
      return {
        weekday,
        label: WEEKDAY_LABEL[weekday],
        cap,
        reserved,
        remaining: Math.max(0, cap - reserved),
      };
    });
  }

  insertWaitlist(input: RequestInput, now = new Date()): Signup {
    const checked = validateRequest(input);
    if (!checked.ok) {
      throw new Error(checked.error);
    }
    const place = classifyAddress(input.address);
    return this.insert({
      input,
      now,
      kind: "waitlist",
      status: "interest",
      amountCents: null,
      pendingExpiresAt: null,
      place,
    });
  }

  /**
   * Holds dozen for a checkout. Refuses when the request would pass the day's
   * remaining promise. Caller must release the row if Stripe never starts.
   */
  beginOrder(
    input: RequestInput,
    now = new Date(),
  ): { ok: true; signup: Signup } | { ok: false; code: "capacity"; error: string } {
    const checked = validateRequest(input);
    if (!checked.ok) {
      if (checked.code === "capacity") {
        return { ok: false, code: "capacity", error: checked.error };
      }
      throw new Error(checked.error);
    }
    const cap = CAPS[input.weekday];
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const reserved = this.reserved(input.weekday, now);
      const remaining = cap - reserved;
      if (input.dozens > remaining) {
        this.db.exec("ROLLBACK");
        const label = WEEKDAY_LABEL[input.weekday];
        return {
          ok: false,
          code: "capacity",
          error: `${label} has ${remaining} dozen left. ${input.dozens} would go over.`,
        };
      }
      const place = classifyAddress(input.address);
      const signup = this.insert({
        input,
        now,
        kind: "order",
        status: "pending_payment",
        amountCents: orderAmountCents(input.dozens),
        pendingExpiresAt: new Date(now.getTime() + PENDING_HOLD_MS).toISOString(),
        place,
      });
      this.db.exec("COMMIT");
      return { ok: true, signup };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  attachSession(id: string, sessionId: string): void {
    this.db
      .prepare(
        `UPDATE signups SET stripe_session_id = ?
         WHERE id = ? AND status = 'pending_payment'`,
      )
      .run(sessionId, id);
  }

  releasePending(id: string): boolean {
    const result = this.db
      .prepare("DELETE FROM signups WHERE id = ? AND status = 'pending_payment'")
      .run(id);
    return result.changes > 0;
  }

  markConfirmed(id: string): Signup | null {
    this.db
      .prepare(
        `UPDATE signups
         SET status = 'confirmed', pending_expires_at = NULL
         WHERE id = ? AND kind = 'order' AND status = 'pending_payment'`,
      )
      .run(id);
    return this.getSignup(id);
  }

  cancel(id: string, now = new Date()): Signup | null {
    this.db
      .prepare(
        `UPDATE signups
         SET status = 'canceled', canceled_at = ?, pending_expires_at = NULL
         WHERE id = ? AND kind = 'order' AND status IN ('confirmed', 'pending_payment')`,
      )
      .run(now.toISOString(), id);
    return this.getSignup(id);
  }

  fulfill(id: string, now = new Date()): Signup | null {
    this.db
      .prepare(
        `UPDATE signups
         SET status = 'fulfilled', fulfilled_at = ?
         WHERE id = ? AND kind = 'order' AND cadence = 'one_time' AND status = 'confirmed'`,
      )
      .run(now.toISOString(), id);
    return this.getSignup(id);
  }

  listLedger(): LedgerEntry[] {
    return this.db
      .prepare("SELECT * FROM ledger ORDER BY occurred_on DESC, created_at DESC, id DESC")
      .all()
      .map(mapLedger);
  }

  insertLedger(entry: {
    occurredOn: string;
    direction: LedgerDirection;
    category: LedgerCategory;
    amountCents: number;
    note: string;
    staffName: string;
    payee?: Payee | null;
    weekStart?: string | null;
    now?: Date;
  }): LedgerEntry {
    const id = randomUUID();
    const now = entry.now ?? new Date();
    this.db
      .prepare(
        `INSERT INTO ledger (
           id, created_at, occurred_on, direction, category, amount_cents, note, staff_name, payee, week_start
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        now.toISOString(),
        entry.occurredOn,
        entry.direction,
        entry.category,
        entry.amountCents,
        entry.note,
        entry.staffName,
        entry.payee ?? null,
        entry.weekStart ?? null,
      );
    const saved = this.listLedger().find((row) => row.id === id);
    if (!saved) throw new Error("Ledger entry did not save.");
    return saved;
  }

  getCartons(): number {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = 'cartons'").get();
    const count = Number(row?.value ?? 0);
    return Number.isInteger(count) && count > 0 ? count : 0;
  }

  setCartonCount(count: number): void {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error("Carton count has to be a whole number, zero or more.");
    }
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES ('cartons', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(String(count));
  }

  adjustCartons(delta: number): { ok: true; count: number } | { ok: false; error: string } {
    if (!Number.isInteger(delta) || delta === 0) {
      return { ok: false, error: "Enter how many cartons to add or remove." };
    }
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const current = this.getCartons();
      const next = current + delta;
      if (next < 0) {
        this.db.exec("ROLLBACK");
        return { ok: false, error: `Only ${current} cartons on hand. That would go below zero.` };
      }
      this.setCartonCount(next);
      this.db.exec("COMMIT");
      return { ok: true, count: next };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  recordDelivery(signupId: string, deliveredOn: string, now = new Date()): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO deliveries (id, signup_id, delivered_on, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(randomUUID(), signupId, deliveredOn, now.toISOString());
  }

  isDeliveredOn(signupId: string, deliveredOn: string): boolean {
    const row = this.db
      .prepare("SELECT id FROM deliveries WHERE signup_id = ? AND delivered_on = ?")
      .get(signupId, deliveredOn);
    return Boolean(row);
  }

  latestDeliveryOn(signupId: string): string | null {
    const row = this.db
      .prepare("SELECT MAX(delivered_on) AS delivered_on FROM deliveries WHERE signup_id = ?")
      .get(signupId);
    return row?.delivered_on == null ? null : String(row.delivered_on);
  }

  latestDeliveries(): Map<string, string> {
    const rows = this.db
      .prepare("SELECT signup_id, MAX(delivered_on) AS delivered_on FROM deliveries GROUP BY signup_id")
      .all();
    const found = new Map<string, string>();
    for (const row of rows) {
      if (row.delivered_on != null) found.set(String(row.signup_id), String(row.delivered_on));
    }
    return found;
  }

  deliverySignupIds(deliveredOn: string): string[] {
    return this.db
      .prepare("SELECT signup_id FROM deliveries WHERE delivered_on = ?")
      .all(deliveredOn)
      .map((row) => String(row.signup_id));
  }

  confirmedOrders(weekday: Weekday): Signup[] {
    return this.db
      .prepare(
        `SELECT * FROM signups
         WHERE kind = 'order' AND status = 'confirmed' AND weekday = ?
         ORDER BY created_at ASC, id ASC`,
      )
      .all(weekday)
      .map(mapSignup);
  }

  routePosition(weekday: Weekday, signupId: string): number {
    const existing = this.db
      .prepare("SELECT position FROM route_order WHERE weekday = ? AND signup_id = ?")
      .get(weekday, signupId);
    if (existing) return Number(existing.position);
    const max = this.db
      .prepare("SELECT COALESCE(MAX(position), 0) AS n FROM route_order WHERE weekday = ?")
      .get(weekday);
    const position = Number(max?.n ?? 0) + 1;
    this.db
      .prepare("INSERT INTO route_order (weekday, signup_id, position) VALUES (?, ?, ?)")
      .run(weekday, signupId, position);
    return position;
  }

  swapRoutePositions(weekday: Weekday, firstId: string, secondId: string): void {
    const first = this.routePosition(weekday, firstId);
    const second = this.routePosition(weekday, secondId);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("UPDATE route_order SET position = ? WHERE weekday = ? AND signup_id = ?")
        .run(second, weekday, firstId);
      this.db
        .prepare("UPDATE route_order SET position = ? WHERE weekday = ? AND signup_id = ?")
        .run(first, weekday, secondId);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private insert(args: {
    input: RequestInput;
    now: Date;
    kind: SignupKind;
    status: SignupStatus;
    amountCents: number | null;
    pendingExpiresAt: string | null;
    place: { flag: AddressFlag; note: string };
  }): Signup {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO signups (
           id, created_at, name, email, phone, address, address_flag, address_note,
           dozens, cadence, weekday, kind, status, amount_cents, stripe_session_id,
           pending_expires_at, fulfilled_at, canceled_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL)`,
      )
      .run(
        id,
        args.now.toISOString(),
        args.input.name.trim(),
        args.input.email.trim(),
        args.input.phone.trim(),
        args.input.address.trim(),
        args.place.flag,
        args.place.note,
        args.input.dozens,
        args.input.cadence,
        args.input.weekday,
        args.kind,
        args.status,
        args.amountCents,
        args.pendingExpiresAt,
      );
    const saved = this.getSignup(id);
    if (!saved) throw new Error("Signup did not save.");
    return saved;
  }
}

export function openFarm(file: string): FarmStore {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = DELETE");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(SCHEMA);
  return new FarmStore(db);
}

let singleton: FarmStore | null = null;
let singletonPath: string | null = null;

function preferredFarmFile(): string {
  return path.join(process.cwd(), "data", "farm.sqlite");
}

// Netlify's server filesystem is read-only except for the temp directory.
// Leave DATABASE_PATH unset and still boot: the waitlist renders, and payments stay unconfigured.
function writableFarmFile(): string {
  const preferred = preferredFarmFile();
  try {
    mkdirSync(path.dirname(preferred), { recursive: true });
    return preferred;
  } catch {
    const fallback = path.join(tmpdir(), "wilderness-farms", "farm.sqlite");
    mkdirSync(path.dirname(fallback), { recursive: true });
    return fallback;
  }
}

export function farmPath(): string {
  return process.env.DATABASE_PATH || writableFarmFile();
}

export function getFarm(): FarmStore {
  const file = farmPath();
  if (!singleton || singletonPath !== file) {
    singleton?.close();
    singleton = openFarm(file);
    singletonPath = file;
  }
  return singleton;
}
