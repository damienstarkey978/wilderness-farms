import { createHmac, timingSafeEqual } from "node:crypto";
import { PRICE_CENTS, WEEKDAY_LABEL, type Weekday, type Cadence } from "./constants";

export class PaymentsNotConfiguredError extends Error {
  constructor() {
    super("Payments are not configured.");
    this.name = "PaymentsNotConfiguredError";
  }
}

export function paymentsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export type CheckoutDraft = {
  signupId: string;
  email: string;
  phone: string;
  dozens: number;
  weekday: Weekday;
  cadence: Cadence;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSession = {
  id: string;
  url: string;
  amountTotal: number | null;
  paymentStatus: string;
  signupId: string;
};

type FetchLike = typeof fetch;

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new PaymentsNotConfiguredError();
  return key;
}

async function stripeForm(
  url: string,
  body: URLSearchParams | undefined,
  fetchImpl: FetchLike,
  method: "GET" | "POST",
): Promise<Record<string, unknown>> {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const json = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message || "Stripe refused the request.");
  }
  return json;
}

export async function createCheckoutSession(
  draft: CheckoutDraft,
  fetchImpl: FetchLike = fetch,
): Promise<{ id: string; url: string }> {
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", draft.successUrl);
  params.set("cancel_url", draft.cancelUrl);
  params.set("customer_email", draft.email);
  params.set("client_reference_id", draft.signupId);
  params.set("metadata[signup_id]", draft.signupId);
  params.set("metadata[phone]", draft.phone);
  params.set("metadata[weekday]", draft.weekday);
  params.set("metadata[cadence]", draft.cadence);
  params.set("phone_number_collection[enabled]", "true");
  params.set("line_items[0][quantity]", String(draft.dozens));
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(PRICE_CENTS));
  const day = WEEKDAY_LABEL[draft.weekday];
  const rhythm = draft.cadence === "weekly" ? "every week" : "one time";
  params.set("line_items[0][price_data][product_data][name]", `Wilderness Farms eggs, ${day} (${rhythm})`);
  params.set(
    "line_items[0][price_data][product_data][description]",
    "Organic eggs delivered in Ponte Vedra Beach. $10 a dozen.",
  );

  const json = await stripeForm("https://api.stripe.com/v1/checkout/sessions", params, fetchImpl, "POST");
  const id = String(json.id ?? "");
  const url = String(json.url ?? "");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Stripe did not return a checkout link.");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "checkout.stripe.com" || !id.startsWith("cs_")) {
    throw new Error("Stripe returned an unexpected checkout address.");
  }
  return { id, url };
}

export async function retrieveCheckoutSession(
  sessionId: string,
  fetchImpl: FetchLike = fetch,
): Promise<CheckoutSession> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    throw new Error("Unknown checkout session.");
  }
  const json = await stripeForm(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    undefined,
    fetchImpl,
    "GET",
  );
  const metadata = (json.metadata ?? {}) as { signup_id?: string };
  return {
    id: String(json.id ?? ""),
    url: String(json.url ?? ""),
    amountTotal: json.amount_total == null ? null : Number(json.amount_total),
    paymentStatus: String(json.payment_status ?? ""),
    signupId: metadata.signup_id || String(json.client_reference_id ?? ""),
  };
}

export function verifyStripeSignature(
  raw: string,
  header: string | null,
  secret: string,
  now = Date.now(),
): boolean {
  if (!header || !secret) return false;
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(now / 1000 - seconds) > 5 * 60) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  return signatures.some((signature) => {
    const actual = Buffer.from(signature);
    return actual.length === expectedBuf.length && timingSafeEqual(actual, expectedBuf);
  });
}
