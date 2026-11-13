import { createHmac, timingSafeEqual } from "node:crypto";
import { DEFAULT_ADMIN_PASSWORD, isStaffId, type StaffId } from "./constants";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function adminPasswordConfigured(): boolean {
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0) return true;
  return process.env.NODE_ENV !== "production";
}

export function adminPassword(): string {
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0) {
    return process.env.ADMIN_PASSWORD;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set ADMIN_PASSWORD.");
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function passwordMatches(given: string): boolean {
  if (!adminPasswordConfigured()) return false;
  const expected = Buffer.from(adminPassword());
  const actual = Buffer.from(given);
  if (expected.length !== actual.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function signAdminCookie(now = Date.now()): string {
  const exp = String(now + SESSION_MS);
  const sig = createHmac("sha256", adminPassword()).update(exp).digest("base64url");
  return `${exp}.${sig}`;
}

export function adminCookieValid(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminPasswordConfigured()) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
  const expected = createHmac("sha256", adminPassword()).update(exp).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signStaffCookie(staffId: StaffId, now = Date.now()): string {
  const exp = String(now + SESSION_MS);
  const payload = `${exp}.${staffId}`;
  const sig = createHmac("sha256", adminPassword()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readStaffCookie(token: string | undefined, now = Date.now()): StaffId | null {
  if (!token || !adminPasswordConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [exp, staffId, sig] = parts;
  if (!exp || !staffId || !sig || !isStaffId(staffId)) return null;
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return null;
  const expected = createHmac("sha256", adminPassword()).update(`${exp}.${staffId}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return staffId;
}
