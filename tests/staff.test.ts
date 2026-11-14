import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { readStaffCookie, signStaffCookie } from "../lib/auth";
import { setCartons, changeCartons } from "../lib/cartons";
import { openFarm, type FarmStore } from "../lib/db";
import { ledgerTotals, recordMoney, recordWeeklyPay } from "../lib/ledger";
import { DAY_TASKS, compareAddresses, followGpsUrl } from "../lib/driving";
import { arriveStop, buildRoute, customerArrival, markStopDelivered, reorderStop, setDayTask, showsDelivered, startStop } from "../lib/route";
import type { RequestInput } from "../lib/parse";

function tempFarm(): FarmStore {
  const dir = mkdtempSync(path.join(tmpdir(), "wf-staff-"));
  return openFarm(path.join(dir, "farm.sqlite"));
}

function request(overrides: Partial<RequestInput> = {}): RequestInput {
  return {
    name: "Ada Marsh",
    email: "ada@example.com",
    phone: "904-555-0134",
    address: "18 Ocean Blvd, Ponte Vedra Beach, FL 32082",
    dozens: 2,
    cadence: "one_time",
    weekday: "tue",
    ...overrides,
  };
}

function readyDay(farm: FarmStore, date: string) {
  for (const task of DAY_TASKS) farm.checkDayTask(date, task.id, "gavin");
}

function confirm(farm: FarmStore, input: RequestInput) {
  const held = farm.beginOrder(input);
  if (!held.ok) throw new Error(held.error);
  const saved = farm.markConfirmed(held.signup.id);
  if (!saved) throw new Error("Order did not confirm.");
  return saved;
}

test("ledger records egg sales and expenses in cents, and refuses a blank note", () => {
  const farm = tempFarm();
  const sale = recordMoney(farm, {
    direction: "in",
    category: "ignored",
    occurredOn: "2026-11-17",
    amount: "3000",
    note: "Tuesday egg sales",
    staffId: "howard",
  });
  const feed = recordMoney(farm, {
    direction: "out",
    category: "feed",
    occurredOn: "2026-11-17",
    amount: "1599",
    note: "Scratch grains",
    staffId: "damien",
  });
  const blank = recordMoney(farm, {
    direction: "out",
    category: "gas",
    occurredOn: "2026-11-17",
    amount: "2000",
    note: "   ",
    staffId: "howard",
  });
  const zero = recordMoney(farm, {
    direction: "in",
    category: "egg_sales",
    occurredOn: "2026-11-17",
    amount: "0",
    note: "Nothing",
    staffId: "howard",
  });
  assert.equal(sale.ok, true);
  assert.equal(feed.ok, true);
  assert.equal(blank.ok, false);
  assert.equal(zero.ok, false);
  if (sale.ok) {
    assert.equal(sale.entry.direction, "in");
    assert.equal(sale.entry.category, "egg_sales");
    assert.equal(sale.entry.amountCents, 3000);
    assert.equal(sale.entry.staffName, "Howard");
  }
  if (feed.ok) assert.equal(feed.entry.category, "feed");
  const totals = ledgerTotals(farm.listLedger());
  assert.equal(totals.inCents, 3000);
  assert.equal(totals.outCents, 1599);
  assert.equal(farm.listLedger().length, 2);
  farm.close();
});

test("weekly pay is entered for Gavin and Hollis and does not invent an amount", () => {
  const farm = tempFarm();
  const missing = recordWeeklyPay(farm, {
    weekOf: "2026-11-18",
    gavinAmount: "",
    hollisAmount: " ",
    note: "",
    staffId: "damien",
  });
  assert.equal(missing.ok, false);
  assert.equal(farm.listLedger().length, 0);

  const paid = recordWeeklyPay(farm, {
    weekOf: "2026-11-18",
    gavinAmount: "2500",
    hollisAmount: "1800",
    note: "",
    staffId: "howard",
  });
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  assert.equal(paid.entries.length, 2);
  assert.deepEqual(
    paid.entries.map((entry) => [entry.payee, entry.amountCents, entry.weekStart, entry.direction, entry.category]),
    [
      ["gavin", 2500, "2026-11-16", "out", "pay"],
      ["hollis", 1800, "2026-11-16", "out", "pay"],
    ],
  );
  assert.equal(ledgerTotals(farm.listLedger()).outCents, 4300);
  farm.close();
});

test("carton count can be set and adjusted, and cannot go below zero", () => {
  const farm = tempFarm();
  assert.equal(farm.getCartons(), 0);
  const set = setCartons(farm, "36");
  assert.equal(set.ok, true);
  if (set.ok) assert.equal(set.count, 36);
  const packed = changeCartons(farm, "-6");
  assert.equal(packed.ok, true);
  if (packed.ok) assert.equal(packed.count, 30);
  const tooMany = changeCartons(farm, "-100");
  assert.equal(tooMany.ok, false);
  assert.equal(farm.getCartons(), 30);
  const bought = changeCartons(farm, "12");
  assert.equal(bought.ok, true);
  assert.equal(farm.getCartons(), 42);
  farm.close();
});

test("marking a paid order delivered shows Delivered and frees only the one-time dozen", () => {
  const farm = tempFarm();
  const once = confirm(farm, request({ cadence: "one_time", dozens: 4, weekday: "tue" }));
  const weekly = confirm(
    farm,
    request({
      cadence: "weekly",
      dozens: 3,
      weekday: "tue",
      email: "weekly@example.com",
      name: "June Beach",
      address: "4 Corona Rd, Ponte Vedra Beach, FL 32082",
    }),
  );
  const interest = farm.insertWaitlist(request({ email: "wait@example.com", name: "Pat Wait", dozens: 1 }));
  assert.equal(farm.capacity().find((day) => day.weekday === "tue")?.remaining, 18);

  readyDay(farm, "2026-11-17");
  const refused = markStopDelivered(farm, interest.id, "2026-11-17");
  assert.equal(refused.ok, false);
  assert.equal(showsDelivered(interest, null), false);

  const deliveredOnce = markStopDelivered(farm, once.id, "2026-11-17");
  assert.equal(deliveredOnce.ok, true);
  if (deliveredOnce.ok) {
    assert.equal(deliveredOnce.signup.status, "fulfilled");
    assert.equal(showsDelivered(deliveredOnce.signup, farm.latestDeliveryOn(once.id)), true);
  }
  assert.equal(farm.capacity().find((day) => day.weekday === "tue")?.remaining, 22);

  const deliveredWeekly = markStopDelivered(farm, weekly.id, "2026-11-17");
  assert.equal(deliveredWeekly.ok, true);
  if (deliveredWeekly.ok) assert.equal(deliveredWeekly.signup.status, "confirmed");
  assert.equal(farm.capacity().find((day) => day.weekday === "tue")?.remaining, 22);
  assert.equal(showsDelivered(weekly, farm.latestDeliveryOn(weekly.id)), true);

  const sunday = markStopDelivered(farm, weekly.id, "2026-11-15");
  assert.equal(sunday.ok, false);
  farm.close();
});

test("a delivery day lists paid stops in order and says nothing when the day is empty", () => {
  const farm = tempFarm();
  farm.insertWaitlist(request({ email: "wait@example.com", name: "Pat Wait" }));
  const first = confirm(farm, request({ name: "Ada Marsh", address: "18 Ocean Blvd, Ponte Vedra Beach, FL 32082" }));
  const second = confirm(
    farm,
    request({
      name: "June Beach",
      email: "june@example.com",
      address: "4 Corona Rd, Ponte Vedra Beach, FL 32082",
    }),
  );
  const empty = buildRoute(farm, "2026-11-18");
  assert.equal(empty.ok, true);
  if (empty.ok) {
    assert.equal(empty.stops.length, 0);
    assert.equal(empty.gpsUrl, null);
  }

  const blocked = markStopDelivered(farm, first.id, "2026-11-17");
  assert.equal(blocked.ok, false);
  readyDay(farm, "2026-11-17");

  const before = buildRoute(farm, "2026-11-17");
  assert.equal(before.ok, true);
  if (!before.ok) return;
  assert.deepEqual(
    before.stops.map((stop) => stop.signup.name),
    ["June Beach", "Ada Marsh"],
  );
  assert.equal(before.stops.every((stop) => stop.signup.kind === "order"), true);
  assert.equal(before.gpsUrl, followGpsUrl("4 Corona Rd, Ponte Vedra Beach, FL 32082"));
  assert.equal(before.ready, true);

  reorderStop(farm, "2026-11-17", second.id, "down");
  const after = buildRoute(farm, "2026-11-17");
  assert.equal(after.ok, true);
  if (!after.ok) return;
  assert.deepEqual(
    after.stops.map((stop) => stop.signup.name),
    ["Ada Marsh", "June Beach"],
  );
  assert.equal(after.gpsUrl, followGpsUrl("18 Ocean Blvd, Ponte Vedra Beach, FL 32082"));

  markStopDelivered(farm, first.id, "2026-11-17");
  const driven = buildRoute(farm, "2026-11-17");
  assert.equal(driven.ok, true);
  if (!driven.ok) return;
  const ada = driven.stops.find((stop) => stop.signup.id === first.id);
  assert.equal(ada?.delivered, true);
  assert.equal(driven.gpsUrl, followGpsUrl("4 Corona Rd, Ponte Vedra Beach, FL 32082"));

  const sunday = buildRoute(farm, "2026-11-15");
  assert.equal(sunday.ok, false);
  farm.close();
});

test("the shared checklist blocks the route until the day is checked, and a new day starts open", () => {
  const farm = tempFarm();
  const order = confirm(farm, request());
  const early = startStop(farm, order.id, "2026-11-17", "hollis");
  assert.equal(early.ok, false);

  const feed = setDayTask(farm, "2026-11-17", "feed", "gavin", true);
  assert.equal(feed.ok, true);
  assert.equal(farm.dayTasks("2026-11-17")[0]?.staffId, "gavin");
  assert.equal(farm.dayTasks("2026-11-18").length, 0);

  readyDay(farm, "2026-11-17");
  assert.equal(startStop(farm, order.id, "2026-11-17", "hollis").ok, true);
  assert.equal(customerArrival(farm, order), "on_the_way");
  assert.equal(arriveStop(farm, order.id, "2026-11-17", "hollis").ok, true);
  assert.equal(customerArrival(farm, order), "arrived");
  const undone = setDayTask(farm, "2026-11-17", "feed", "gavin", false);
  assert.equal(undone.ok, false);
  assert.equal(markStopDelivered(farm, order.id, "2026-11-17").ok, true);
  const saved = farm.getSignup(order.id);
  assert.equal(saved ? customerArrival(farm, saved) : null, "delivered");
  assert.equal(saved?.status, "fulfilled");

  const otherStreets = ["9 Zebra Ln", "2 Apple St", "15 Apple St"].sort(compareAddresses);
  assert.deepEqual(otherStreets, ["2 Apple St", "15 Apple St", "9 Zebra Ln"]);
  farm.close();
});

test("staff cookie is tied to the chosen name", () => {
  const previous = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  assert.notEqual(process.env.NODE_ENV, "production");
  const token = signStaffCookie("howard", 1_700_000_000_000);
  assert.equal(readStaffCookie(token, 1_700_000_000_000), "howard");
  assert.equal(readStaffCookie(token, 1_900_000_000_000), null);
  const tampered = token.replace(".howard.", ".gavin.");
  assert.equal(readStaffCookie(tampered, 1_700_000_000_000), null);
  if (previous === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previous;
});
