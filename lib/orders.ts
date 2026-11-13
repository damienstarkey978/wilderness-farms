import { WEEKDAY_LABEL } from "./constants";
import type { FarmStore, Signup } from "./db";
import { validateRequest, type RequestInput } from "./parse";
import {
  PaymentsNotConfiguredError,
  createCheckoutSession,
  paymentsConfigured,
  retrieveCheckoutSession,
  type CheckoutSession,
} from "./stripe";

export type InterestResult =
  | {
      ok: true;
      kind: "waitlist";
      signup: Signup;
    }
  | { ok: false; code: "validation" | "capacity"; error: string };

export type OrderResult =
  | { ok: true; kind: "checkout"; url: string; signup: Signup }
  | { ok: false; code: "validation" | "capacity" | "payments" | "closed" | "stripe"; error: string };

export type SettleResult =
  | { ok: true; signup: Signup }
  | { ok: false; code: "payments" | "unpaid" | "missing" | "mismatch" | "stripe"; error: string };

const PAYMENTS_COPY =
  "Payments are not configured. Nothing was charged, and no dozen were reserved.";

export function placeInterest(farm: FarmStore, input: RequestInput): InterestResult {
  const checked = validateRequest(input);
  if (!checked.ok) return checked;
  const signup = farm.insertWaitlist(input);
  return { ok: true, kind: "waitlist", signup };
}

export async function placeOrder(
  farm: FarmStore,
  input: RequestInput,
  opts: { origin: string; fetchImpl?: typeof fetch; now?: Date },
): Promise<OrderResult> {
  if (!farm.getGreenlit()) {
    return {
      ok: false,
      code: "closed",
      error: "The farm is still on the waitlist. This form saves interest. It does not place an order.",
    };
  }
  const checked = validateRequest(input);
  if (!checked.ok) return checked;
  const day = farm.capacity(opts.now).find((item) => item.weekday === input.weekday);
  if (!day || input.dozens > day.remaining) {
    const label = WEEKDAY_LABEL[input.weekday];
    const left = day?.remaining ?? 0;
    return {
      ok: false,
      code: "capacity",
      error: `${label} has ${left} dozen left. ${input.dozens} would go over.`,
    };
  }
  if (!paymentsConfigured()) {
    return { ok: false, code: "payments", error: PAYMENTS_COPY };
  }

  const held = farm.beginOrder(input, opts.now);
  if (!held.ok) return held;

  try {
    const session = await createCheckoutSession(
      {
        signupId: held.signup.id,
        email: held.signup.email,
        phone: held.signup.phone,
        dozens: held.signup.dozens,
        weekday: held.signup.weekday,
        cadence: held.signup.cadence,
        successUrl: `${opts.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${opts.origin}/signup?payment=canceled&hold=${held.signup.id}`,
      },
      opts.fetchImpl,
    );
    farm.attachSession(held.signup.id, session.id);
    const signup = farm.getSignup(held.signup.id) ?? held.signup;
    return { ok: true, kind: "checkout", url: session.url, signup };
  } catch (error) {
    farm.releasePending(held.signup.id);
    if (error instanceof PaymentsNotConfiguredError) {
      return { ok: false, code: "payments", error: PAYMENTS_COPY };
    }
    const message = error instanceof Error ? error.message : "Stripe could not start the payment.";
    return {
      ok: false,
      code: "stripe",
      error: `${message} Nothing was charged, and no dozen were reserved.`,
    };
  }
}

export async function settleCheckout(
  farm: FarmStore,
  sessionId: string,
  fetchImpl?: typeof fetch,
): Promise<SettleResult> {
  if (!paymentsConfigured()) {
    return { ok: false, code: "payments", error: PAYMENTS_COPY };
  }
  let session: CheckoutSession;
  try {
    session = await retrieveCheckoutSession(sessionId, fetchImpl);
  } catch (error) {
    if (error instanceof PaymentsNotConfiguredError) {
      return { ok: false, code: "payments", error: PAYMENTS_COPY };
    }
    const message = error instanceof Error ? error.message : "Could not read the payment.";
    return { ok: false, code: "stripe", error: message };
  }

  const signup = farm.findBySession(session.id) ?? (session.signupId ? farm.getSignup(session.signupId) : null);
  if (!signup || signup.kind !== "order" || (signup.stripeSessionId && signup.stripeSessionId !== session.id)) {
    return { ok: false, code: "missing", error: "We couldn't find that order. Nothing new was reserved." };
  }
  if (session.signupId && session.signupId !== signup.id) {
    return { ok: false, code: "mismatch", error: "The payment didn't match the order. It was not marked reserved." };
  }
  if (session.paymentStatus !== "paid") {
    return {
      ok: false,
      code: "unpaid",
      error: "Stripe has not marked this payment as paid. Nothing was reserved.",
    };
  }
  if (session.amountTotal !== signup.amountCents) {
    return {
      ok: false,
      code: "mismatch",
      error: "The payment amount didn't match the order. It was not marked reserved.",
    };
  }
  if (signup.status === "confirmed") return { ok: true, signup };
  if (signup.status !== "pending_payment") {
    return { ok: false, code: "missing", error: "That order is no longer waiting on payment." };
  }
  const confirmed = farm.markConfirmed(signup.id);
  if (!confirmed || confirmed.status !== "confirmed") {
    return { ok: false, code: "missing", error: "The payment came back, but the order could not be reserved." };
  }
  return { ok: true, signup: confirmed };
}

export function cadenceLabel(cadence: Signup["cadence"]): string {
  return cadence === "weekly" ? "every week" : "one time";
}

export function reservationSentence(signup: Signup): string {
  const day = WEEKDAY_LABEL[signup.weekday];
  if (signup.cadence === "weekly") {
    return `${signup.dozens} dozen every ${day}, until you cancel.`;
  }
  return `${signup.dozens} dozen on a ${day}. It counts against ${day} until we mark it delivered.`;
}
