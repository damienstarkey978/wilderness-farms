"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, STAFF_COOKIE, isStaffId } from "@/lib/constants";
import { changeCartons, setCartons } from "@/lib/cartons";
import { getFarm } from "@/lib/db";
import { type SignupFormState, type StaffFormState } from "@/lib/form-state";
import {
  adminCookieValid,
  adminPasswordConfigured,
  passwordMatches,
  readStaffCookie,
  signAdminCookie,
  signStaffCookie,
} from "@/lib/auth";
import { recordMoney, recordWeeklyPay } from "@/lib/ledger";
import { placeEarlyAccess, placeOrder } from "@/lib/orders";
import { parseEarlyAccess, parseForm } from "@/lib/parse";
import { markStopDelivered, reorderStop } from "@/lib/route";

function refreshFarm() {
  revalidatePath("/", "layout");
  revalidatePath("/signup");
  revalidatePath("/delivery");
  revalidatePath("/admin");
  revalidatePath("/staff");
  revalidatePath("/staff/route");
  revalidatePath("/order/success");
}

async function requireAdmin() {
  const jar = await cookies();
  if (!adminCookieValid(jar.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }
}

async function requireStaff() {
  const jar = await cookies();
  const staffId = readStaffCookie(jar.get(STAFF_COOKIE)?.value);
  if (!staffId) redirect("/staff/login");
  return staffId;
}

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) throw new Error("Missing host.");
  return `${proto}://${host}`;
}

export async function submitSignup(
  _prev: SignupFormState | null,
  formData: FormData,
): Promise<SignupFormState> {
  const farm = getFarm();
  if (!farm.getGreenlit()) {
    const parsed = parseEarlyAccess(formData);
    if (!parsed.ok) return { ok: false, code: parsed.code, error: parsed.error };
    if ("spam" in parsed) {
      return { ok: true, kind: "waitlist", name: "" };
    }
    const saved = placeEarlyAccess(farm, parsed.value);
    if (!saved.ok) return { ok: false, code: saved.code, error: saved.error };
    refreshFarm();
    return {
      ok: true,
      kind: "waitlist",
      name: saved.signup.name,
      duplicate: saved.duplicate,
      flag: saved.signup.addressFlag,
      flagNote: saved.signup.addressNote,
    };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) return { ok: false, code: parsed.code, error: parsed.error };

  const ordered = await placeOrder(farm, parsed.value, { origin: await originFromHeaders() });
  if (!ordered.ok) return { ok: false, code: ordered.code, error: ordered.error };
  refreshFarm();
  redirect(ordered.url);
}

export async function login(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!adminPasswordConfigured()) {
    return {
      error: "Set ADMIN_PASSWORD on the server. The local default is only for development.",
    };
  }
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    return { error: "That password doesn't match." };
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signAdminCookie(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function setGreenlit(formData: FormData): Promise<void> {
  await requireAdmin();
  getFarm().setGreenlit(formData.get("greenlit") === "1");
  refreshFarm();
  redirect("/admin");
}

export async function cancelSignup(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  getFarm().cancel(id);
  refreshFarm();
  redirect("/admin");
}

export async function fulfillSignup(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  getFarm().fulfill(id);
  refreshFarm();
  redirect("/admin");
}

export async function staffLogin(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  if (!adminPasswordConfigured()) {
    return { error: "Set ADMIN_PASSWORD on the server. The local default is only for development." };
  }
  const who = String(formData.get("who") ?? "");
  if (!isStaffId(who)) return { error: "Choose Damien, Howard, Gavin, or Hollis." };
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) return { error: "That password doesn't match." };
  const jar = await cookies();
  jar.set(STAFF_COOKIE, signStaffCookie(who), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/staff");
}

export async function staffLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(STAFF_COOKIE);
  redirect("/staff/login");
}

export async function addLedgerEntry(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const staffId = await requireStaff();
  const saved = recordMoney(getFarm(), {
    direction: String(formData.get("direction") ?? ""),
    category: String(formData.get("category") ?? ""),
    occurredOn: String(formData.get("occurredOn") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    note: String(formData.get("note") ?? ""),
    staffId,
  });
  if (!saved.ok) return { error: saved.error };
  refreshFarm();
  return { ok: "Saved on the ledger." };
}

export async function addWeeklyPay(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const staffId = await requireStaff();
  const saved = recordWeeklyPay(getFarm(), {
    weekOf: String(formData.get("weekOf") ?? ""),
    gavinAmount: String(formData.get("gavinAmount") ?? ""),
    hollisAmount: String(formData.get("hollisAmount") ?? ""),
    note: String(formData.get("note") ?? ""),
    staffId,
  });
  if (!saved.ok) return { error: saved.error };
  refreshFarm();
  const names = saved.entries.map((entry) => (entry.payee === "hollis" ? "Hollis" : "Gavin")).join(" and ");
  return { ok: `Pay out saved for ${names}.` };
}

export async function setCartonCount(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  await requireStaff();
  const saved = setCartons(getFarm(), String(formData.get("count") ?? ""));
  if (!saved.ok) return { error: saved.error };
  refreshFarm();
  return { ok: `${saved.count} cartons on hand.` };
}

export async function adjustCartonCount(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  await requireStaff();
  const saved = changeCartons(getFarm(), String(formData.get("delta") ?? ""));
  if (!saved.ok) return { error: saved.error };
  refreshFarm();
  return { ok: `${saved.count} cartons on hand.` };
}

export async function markDelivered(formData: FormData): Promise<void> {
  await requireStaff();
  const date = String(formData.get("date") ?? "");
  const id = String(formData.get("id") ?? "");
  const saved = markStopDelivered(getFarm(), id, date);
  refreshFarm();
  const query = new URLSearchParams({ date });
  if (!saved.ok) query.set("error", saved.error);
  redirect(`/staff/route?${query}`);
}

export async function moveStop(formData: FormData): Promise<void> {
  await requireStaff();
  const date = String(formData.get("date") ?? "");
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "down" ? "down" : "up";
  const saved = reorderStop(getFarm(), date, id, direction);
  const query = new URLSearchParams({ date });
  if (!saved.ok) query.set("error", saved.error);
  redirect(`/staff/route?${query}`);
}
