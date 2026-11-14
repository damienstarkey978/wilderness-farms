import assert from "node:assert/strict";
import { chmodSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createHmac } from "node:crypto";
import { classifyAddress } from "../lib/address";
import { adminCookieValid, passwordMatches, signAdminCookie } from "../lib/auth";
import { DEFAULT_ADMIN_PASSWORD, PRICE_CENTS } from "../lib/constants";
import { signupsToCsv } from "../lib/csv";
import { farmPath, openFarm, type FarmStore } from "../lib/db";
import { placeEarlyAccess, placeInterest, placeOrder, settleCheckout } from "../lib/orders";
import { parseEarlyAccess, parseForm, type EarlyAccessInput, type RequestInput } from "../lib/parse";
import { verifyStripeSignature } from "../lib/stripe";

function tempFarm(): FarmStore {
  const dir = mkdtempSync(path.join(tmpdir(), "wf-"));
  return openFarm(path.join(dir, "farm.sqlite"));
}

function request(overrides: Partial<RequestInput> = {}): RequestInput {
  return {
    name: "Ada Marsh",
    email: "ada@example.com",
    phone: "904-555-0134",
    address: "18 Ocean Blvd, Ponte Vedra Beach, FL 32082",
    dozens: 2,
    cadence: "weekly",
    weekday: "tue",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("waitlist signup is interest and does not take capacity", () => {
  const farm = tempFarm();
  const saved = placeInterest(farm, request({ dozens: 4, weekday: "mon" }));
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.signup.kind, "waitlist");
  assert.equal(saved.signup.status, "interest");
  assert.equal(saved.signup.amountCents, null);
  assert.equal(saved.signup.addressFlag, "in_area");
  const monday = farm.capacity().find((day) => day.weekday === "mon");
  assert.equal(monday?.remaining, 50);
  assert.equal(monday?.reserved, 0);
  farm.close();
});

test("outside and regular Ponte Vedra addresses are flagged and still saved", () => {
  const farm = tempFarm();
  const outside = placeInterest(
    farm,
    request({ address: "10 Oak St, Jacksonville, FL 32202", email: "jax@example.com" }),
  );
  const nearby = placeInterest(
    farm,
    request({ address: "55 Roscoe Blvd, Ponte Vedra, FL 32081", email: "pv@example.com" }),
  );
  assert.equal(outside.ok, true);
  assert.equal(nearby.ok, true);
  if (outside.ok) assert.equal(outside.signup.addressFlag, "outside");
  if (nearby.ok) assert.equal(nearby.signup.addressFlag, "nearby_undecided");
  assert.equal(farm.listSignups().length, 2);
  assert.equal(classifyAddress("PONTE VEDRA BEACH").flag, "in_area");
  farm.close();
});

test("refuses a waitlist ask over the day's promise", () => {
  const farm = tempFarm();
  const refused = placeInterest(farm, request({ dozens: 30, weekday: "tue" }));
  assert.equal(refused.ok, false);
  if (refused.ok) return;
  assert.equal(refused.code, "capacity");
  assert.match(refused.error, /25 dozen/);
  assert.equal(farm.listSignups().length, 0);
  const monday = placeInterest(farm, request({ dozens: 50, weekday: "mon", email: "mon@example.com" }));
  assert.equal(monday.ok, true);
  assert.equal(farm.capacity().find((day) => day.weekday === "mon")?.remaining, 50);
  farm.close();
});

function early(overrides: Partial<EarlyAccessInput> = {}): EarlyAccessInput {
  return {
    name: "Ada Marsh",
    email: "ada@example.com",
    zip: "32082",
    phone: "",
    address: "",
    dozens: null,
    cadence: "",
    weekday: "",
    consent: true,
    ...overrides,
  };
}

test("early access saves name, email, and ZIP without reserving eggs", () => {
  const farm = tempFarm();
  const saved = placeEarlyAccess(farm, early());
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.signup.kind, "waitlist");
  assert.equal(saved.signup.status, "interest");
  assert.equal(saved.signup.zip, "32082");
  assert.equal(saved.signup.phone, "");
  assert.equal(saved.signup.dozens, 0);
  assert.equal(saved.signup.consent, true);
  assert.equal(saved.signup.addressFlag, "in_area");
  assert.equal(farm.capacity().find((day) => day.weekday === "mon")?.remaining, 50);
  const again = placeEarlyAccess(farm, early({ email: "Ada@example.com", name: "Ada Again" }));
  assert.equal(again.ok, true);
  if (again.ok) assert.equal(again.duplicate, true);
  assert.equal(farm.listSignups().length, 1);
  farm.close();
});

test("early access rejects a missing ZIP and an over-cap estimate", () => {
  const farm = tempFarm();
  const missing = placeEarlyAccess(farm, early({ zip: "82" }));
  assert.equal(missing.ok, false);
  const noConsent = placeEarlyAccess(farm, early({ email: "b@example.com", consent: false }));
  assert.equal(noConsent.ok, false);
  const badPhone = placeEarlyAccess(farm, early({ email: "c@example.com", phone: "123" }));
  assert.equal(badPhone.ok, false);
  const sundayForm = new FormData();
  sundayForm.set("name", "Ada");
  sundayForm.set("email", "sun@example.com");
  sundayForm.set("zip", "32082");
  sundayForm.set("consent", "yes");
  sundayForm.set("weekday", "sun");
  const sunday = parseEarlyAccess(sundayForm);
  assert.equal(sunday.ok, false);
  const over = placeEarlyAccess(farm, early({ email: "e@example.com", weekday: "tue", dozens: 30 }));
  assert.equal(over.ok, false);
  if (!over.ok) assert.equal(over.code, "capacity");
  assert.equal(farm.listSignups().length, 0);

  const form = new FormData();
  form.set("company_website", "https://spam.example");
  form.set("name", "Bot");
  form.set("email", "bot@example.com");
  form.set("zip", "32082");
  form.set("consent", "yes");
  const spam = parseEarlyAccess(form);
  assert.equal(spam.ok, true);
  if (spam.ok) assert.equal("spam" in spam, true);
  farm.close();
});

test("refuses Sunday and incomplete fields", () => {
  const form = new FormData();
  form.set("name", "Ada");
  form.set("email", "ada@example.com");
  form.set("phone", "9045550134");
  form.set("address", "1 Beach St, Ponte Vedra Beach");
  form.set("dozens", "2");
  form.set("cadence", "weekly");
  form.set("weekday", "sun");
  const parsed = parseForm(form);
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.match(parsed.error, /Sunday/);

  const missing = placeInterest(tempFarm(), request({ email: "not-an-email" }));
  assert.equal(missing.ok, false);
});

test("greenlit order without Stripe does not charge or reserve", async () => {
  const farm = tempFarm();
  farm.setGreenlit(true);
  const previous = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  let called = false;
  const result = await placeOrder(farm, request({ dozens: 3, weekday: "wed" }), {
    origin: "http://localhost:3000",
    fetchImpl: async () => {
      called = true;
      return jsonResponse({});
    },
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "payments");
  assert.equal(called, false);
  assert.equal(farm.listSignups().length, 0);
  assert.equal(farm.capacity().find((day) => day.weekday === "wed")?.remaining, 25);
  if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = previous;
  farm.close();
});

test("paid checkout reserves capacity and a second ask over the cap is refused", async () => {
  const farm = tempFarm();
  farm.setGreenlit(true);
  const previous = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_test_wilderness";
  const dozens = 20;
  const fetchImpl: typeof fetch = async (url, init) => {
    const target = String(url);
    if (target.endsWith("/v1/checkout/sessions") && init?.method === "POST") {
      const body = decodeURIComponent(String(init?.body ?? ""));
      assert.match(body, /unit_amount]=1000|unit_amount=1000/);
      assert.match(body, new RegExp(`quantity\\]=${dozens}|quantity=${dozens}`));
      return jsonResponse({
        id: "cs_test_paid",
        url: "https://checkout.stripe.com/c/pay/cs_test_paid",
      });
    }
    if (target.endsWith("/v1/checkout/sessions/cs_test_paid")) {
      return jsonResponse({
        id: "cs_test_paid",
        payment_status: "paid",
        amount_total: dozens * PRICE_CENTS,
        metadata: { signup_id: "filled-by-lookup" },
        client_reference_id: "filled-by-lookup",
      });
    }
    return jsonResponse({ error: { message: "unexpected" } }, 500);
  };

  const started = await placeOrder(farm, request({ dozens, weekday: "tue", cadence: "weekly" }), {
    origin: "http://localhost:3000",
    fetchImpl,
  });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.equal(started.url, "https://checkout.stripe.com/c/pay/cs_test_paid");
  assert.equal(farm.capacity().find((day) => day.weekday === "tue")?.remaining, 5);

  const unpaid = await settleCheckout(farm, "cs_test_paid", async () =>
    jsonResponse({
      id: "cs_test_paid",
      payment_status: "unpaid",
      amount_total: dozens * PRICE_CENTS,
      metadata: { signup_id: started.signup.id },
    }),
  );
  assert.equal(unpaid.ok, false);
  if (!unpaid.ok) assert.equal(unpaid.code, "unpaid");
  assert.equal(farm.getSignup(started.signup.id)?.status, "pending_payment");

  const paid = await settleCheckout(farm, "cs_test_paid", async () =>
    jsonResponse({
      id: "cs_test_paid",
      payment_status: "paid",
      amount_total: dozens * PRICE_CENTS,
      metadata: { signup_id: started.signup.id },
    }),
  );
  assert.equal(paid.ok, true);
  if (paid.ok) assert.equal(paid.signup.status, "confirmed");

  let secondCall = false;
  const over = await placeOrder(farm, request({ dozens: 6, weekday: "tue", email: "next@example.com" }), {
    origin: "http://localhost:3000",
    fetchImpl: async () => {
      secondCall = true;
      return jsonResponse({});
    },
  });
  assert.equal(over.ok, false);
  if (!over.ok) {
    assert.equal(over.code, "capacity");
    assert.match(over.error, /5 dozen left/);
  }
  assert.equal(secondCall, false);
  assert.equal(farm.capacity().find((day) => day.weekday === "tue")?.remaining, 5);

  farm.cancel(started.signup.id);
  assert.equal(farm.capacity().find((day) => day.weekday === "tue")?.remaining, 25);

  if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = previous;
  farm.close();
});

test("one-time order counts until it is marked delivered, and expired holds drop off", async () => {
  const farm = tempFarm();
  farm.setGreenlit(true);
  process.env.STRIPE_SECRET_KEY = "sk_test_wilderness";
  const now = new Date("2027-03-02T15:00:00.000Z");
  const fetchImpl: typeof fetch = async (url) => {
    if (String(url).endsWith("/v1/checkout/sessions")) {
      return jsonResponse({ id: "cs_test_once", url: "https://checkout.stripe.com/c/pay/cs_test_once" });
    }
    return jsonResponse({
      id: "cs_test_once",
      payment_status: "paid",
      amount_total: PRICE_CENTS,
      metadata: {},
    });
  };
  const started = await placeOrder(farm, request({ dozens: 1, weekday: "fri", cadence: "one_time" }), {
    origin: "http://localhost:3000",
    fetchImpl,
    now,
  });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const paid = await settleCheckout(farm, "cs_test_once", fetchImpl);
  assert.equal(paid.ok, true);
  assert.equal(farm.capacity(now).find((day) => day.weekday === "fri")?.remaining, 24);
  farm.fulfill(started.signup.id);
  assert.equal(farm.capacity(now).find((day) => day.weekday === "fri")?.remaining, 25);

  const hold = await placeOrder(farm, request({ dozens: 4, weekday: "sat", email: "hold@example.com" }), {
    origin: "http://localhost:3000",
    fetchImpl: async () =>
      jsonResponse({ id: "cs_test_hold", url: "https://checkout.stripe.com/c/pay/cs_test_hold" }),
    now,
  });
  assert.equal(hold.ok, true);
  assert.equal(farm.capacity(now).find((day) => day.weekday === "sat")?.remaining, 21);
  const later = new Date(now.getTime() + 31 * 60 * 1000);
  assert.equal(farm.capacity(later).find((day) => day.weekday === "sat")?.remaining, 25);
  delete process.env.STRIPE_SECRET_KEY;
  farm.close();
});

test("mismatched payment amount does not reserve", async () => {
  const farm = tempFarm();
  farm.setGreenlit(true);
  process.env.STRIPE_SECRET_KEY = "sk_test_wilderness";
  const started = await placeOrder(farm, request({ dozens: 2, weekday: "mon" }), {
    origin: "http://localhost:3000",
    fetchImpl: async () =>
      jsonResponse({ id: "cs_test_badamt", url: "https://checkout.stripe.com/c/pay/cs_test_badamt" }),
  });
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const settled = await settleCheckout(farm, "cs_test_badamt", async () =>
    jsonResponse({
      id: "cs_test_badamt",
      payment_status: "paid",
      amount_total: 100,
      metadata: { signup_id: started.signup.id },
    }),
  );
  assert.equal(settled.ok, false);
  if (!settled.ok) assert.equal(settled.code, "mismatch");
  assert.equal(farm.getSignup(started.signup.id)?.status, "pending_payment");
  delete process.env.STRIPE_SECRET_KEY;
  farm.close();
});

test("csv export includes emails and the admin cookie accepts the local default", () => {
  const farm = tempFarm();
  placeInterest(farm, request());
  const csv = signupsToCsv(farm.listSignups());
  assert.match(csv, /^email,name,phone/);
  assert.match(csv, /ada@example.com/);
  const previousPassword = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  assert.notEqual(process.env.NODE_ENV, "production");
  assert.equal(passwordMatches(DEFAULT_ADMIN_PASSWORD), true);
  assert.equal(passwordMatches("nope"), false);
  const token = signAdminCookie(1_700_000_000_000);
  assert.equal(adminCookieValid(token, 1_700_000_000_000), true);
  assert.equal(adminCookieValid(token, 1_900_000_000_000), false);
  if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previousPassword;
  farm.close();
});

test("an unwritable working directory still opens a farm database", () => {
  const previous = process.env.DATABASE_PATH;
  delete process.env.DATABASE_PATH;
  const locked = mkdtempSync(path.join(tmpdir(), "wf-lock-"));
  chmodSync(locked, 0o555);
  const cwd = process.cwd();
  try {
    process.chdir(locked);
    const file = farmPath();
    assert.equal(file.startsWith(tmpdir()), true);
    assert.equal(file.includes(`${path.sep}wilderness-farms${path.sep}`), true);
    const farm = openFarm(file);
    assert.equal(farm.getGreenlit(), false);
    farm.close();
  } finally {
    process.chdir(cwd);
    chmodSync(locked, 0o755);
    if (previous === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = previous;
  }
});

test("stripe webhook signatures reject a stale or altered body", () => {
  const raw = JSON.stringify({ type: "checkout.session.completed" });
  const secret = "whsec_test";
  const now = 1_700_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const signature = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const header = `t=${timestamp},v1=${signature}`;
  assert.equal(verifyStripeSignature(raw, header, secret, now), true);
  assert.equal(verifyStripeSignature(`${raw}!`, header, secret, now), false);
  assert.equal(verifyStripeSignature(raw, header, secret, now + 10 * 60 * 1000), false);
  assert.equal(verifyStripeSignature(raw, null, secret, now), false);
});
