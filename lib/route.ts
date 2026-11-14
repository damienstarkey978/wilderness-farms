import { WEEKDAY_LABEL, isWeekday, type StaffId, type Weekday } from "./constants";
import { isDeliveryWeekday, isIsoDate, weekdayOf } from "./dates";
import { compareAddresses, followGpsUrl, isDayTask } from "./driving";
import type { FarmStore, Signup, StopState } from "./db";

export type RouteStop = {
  signup: Signup;
  position: number;
  delivered: boolean;
  progress: StopState | null;
};

export type CustomerArrival = "on_the_way" | "arrived" | "delivered";

const CHECKLIST_BLOCK = "Finish today's checklist before starting deliveries.";

function placeMissingStops(farm: FarmStore, weekday: Weekday, signups: Signup[]): void {
  const missing = signups.filter((signup) => !farm.hasRoutePosition(weekday, signup.id));
  if (missing.length === 0) return;
  const ordered = [...missing].sort(
    (a, b) => compareAddresses(a.address, b.address) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  let position = signups.length === missing.length ? 1 : farm.maxRoutePosition(weekday) + 1;
  for (const signup of ordered) {
    farm.setRoutePosition(weekday, signup.id, position);
    position += 1;
  }
}

export function showsDelivered(signup: Signup, latestDelivery: string | null): boolean {
  if (signup.kind !== "order") return false;
  return signup.status === "fulfilled" || latestDelivery != null;
}

export function buildRoute(
  farm: FarmStore,
  date: string,
):
  | { ok: true; date: string; weekday: Weekday; stops: RouteStop[]; gpsUrl: string | null; ready: boolean }
  | { ok: false; error: string } {
  const weekday = weekdayOf(date);
  if (!weekday) return { ok: false, error: "Pick a delivery date." };
  if (!isDeliveryWeekday(weekday)) return { ok: false, error: "No deliveries on Sunday." };

  const byId = new Map<string, Signup>();
  for (const signup of farm.confirmedOrders(weekday)) byId.set(signup.id, signup);
  for (const signupId of farm.deliverySignupIds(date)) {
    const signup = farm.getSignup(signupId);
    if (signup && signup.kind === "order" && signup.weekday === weekday) byId.set(signup.id, signup);
  }

  const signups = [...byId.values()];
  placeMissingStops(farm, weekday, signups);
  const progress = farm.stopStates(date);
  const stops = signups
    .map((signup) => ({
      signup,
      position: farm.routePosition(weekday, signup.id),
      delivered: farm.isDeliveredOn(signup.id, date) || signup.status === "fulfilled",
      progress: progress.get(signup.id)?.state ?? null,
    }))
    .sort((a, b) => a.position - b.position || a.signup.createdAt.localeCompare(b.signup.createdAt));

  const next = stops.find((stop) => !stop.delivered);
  return {
    ok: true,
    date,
    weekday,
    stops,
    gpsUrl: next ? followGpsUrl(next.signup.address) : null,
    ready: farm.checklistComplete(date),
  };
}

export function customerArrival(farm: FarmStore, signup: Signup): CustomerArrival | null {
  if (signup.kind !== "order") return null;
  const deliveredOn = farm.latestDeliveryOn(signup.id);
  const progress = farm.latestStopProgress(signup.id);
  if (signup.status === "fulfilled") return "delivered";
  if (progress && (!deliveredOn || progress.workDate > deliveredOn)) return progress.state;
  if (deliveredOn) return "delivered";
  return null;
}

export function setDayTask(
  farm: FarmStore,
  date: string,
  task: string,
  staffId: StaffId,
  checked: boolean,
): { ok: true } | { ok: false; error: string } {
  if (!isIsoDate(date) || !isDeliveryWeekday(weekdayOf(date))) {
    return { ok: false, error: "Pick a delivery date." };
  }
  if (!isDayTask(task)) return { ok: false, error: "That is not a task on today's list." };
  if (!checked) {
    if (farm.routeStarted(date)) {
      return { ok: false, error: "Deliveries already started. The checklist stays checked." };
    }
    farm.clearDayTask(date, task);
    return { ok: true };
  }
  farm.checkDayTask(date, task, staffId);
  return { ok: true };
}

function requireReadyStop(
  farm: FarmStore,
  date: string,
  signupId: string,
): { ok: true; signup: Signup; weekday: Weekday } | { ok: false; error: string } {
  const weekday = weekdayOf(date);
  if (!weekday || !isDeliveryWeekday(weekday)) return { ok: false, error: "Pick a delivery date." };
  if (!farm.checklistComplete(date)) return { ok: false, error: CHECKLIST_BLOCK };
  const signup = farm.getSignup(signupId);
  if (!signup || signup.kind !== "order") return { ok: false, error: "Waitlist interest is not a delivery." };
  if (signup.status !== "confirmed" && signup.status !== "fulfilled") {
    return { ok: false, error: "Only a paid order can be on the route." };
  }
  if (signup.weekday !== weekday) {
    return {
      ok: false,
      error: `${signup.name} is scheduled for ${isWeekday(signup.weekday) ? WEEKDAY_LABEL[signup.weekday] : "another day"}, not ${WEEKDAY_LABEL[weekday]}.`,
    };
  }
  if (farm.isDeliveredOn(signup.id, date) || signup.status === "fulfilled") {
    return { ok: false, error: "That stop is already delivered." };
  }
  return { ok: true, signup, weekday };
}

export function startStop(
  farm: FarmStore,
  signupId: string,
  date: string,
  staffId: StaffId,
): { ok: true } | { ok: false; error: string } {
  const ready = requireReadyStop(farm, date, signupId);
  if (!ready.ok) return ready;
  const current = farm.stopStates(date).get(signupId)?.state;
  if (current === "arrived") return { ok: false, error: "That stop is already marked arrived." };
  farm.setStopState(date, signupId, "on_the_way", staffId);
  return { ok: true };
}

export function arriveStop(
  farm: FarmStore,
  signupId: string,
  date: string,
  staffId: StaffId,
): { ok: true } | { ok: false; error: string } {
  const ready = requireReadyStop(farm, date, signupId);
  if (!ready.ok) return ready;
  if (farm.stopStates(date).get(signupId)?.state !== "on_the_way") {
    return { ok: false, error: "Start the stop before marking it arrived." };
  }
  farm.setStopState(date, signupId, "arrived", staffId);
  return { ok: true };
}

export function reorderStop(
  farm: FarmStore,
  date: string,
  signupId: string,
  direction: "up" | "down",
): { ok: true } | { ok: false; error: string } {
  const route = buildRoute(farm, date);
  if (!route.ok) return route;
  const index = route.stops.findIndex((stop) => stop.signup.id === signupId);
  if (index < 0) return { ok: false, error: "That stop is not on this day." };
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= route.stops.length) return { ok: true };
  farm.swapRoutePositions(route.weekday, route.stops[index].signup.id, route.stops[swapWith].signup.id);
  return { ok: true };
}

export function markStopDelivered(
  farm: FarmStore,
  signupId: string,
  deliveredOn: string,
  now = new Date(),
): { ok: true; signup: Signup } | { ok: false; error: string } {
  const weekday = weekdayOf(deliveredOn);
  if (!weekday) return { ok: false, error: "Pick the delivery date." };
  if (!isDeliveryWeekday(weekday)) return { ok: false, error: "No deliveries on Sunday." };
  if (!farm.checklistComplete(deliveredOn)) return { ok: false, error: CHECKLIST_BLOCK };
  const signup = farm.getSignup(signupId);
  if (!signup || signup.kind !== "order") {
    return { ok: false, error: "Waitlist interest is not a delivery." };
  }
  if (signup.status !== "confirmed" && signup.status !== "fulfilled") {
    return { ok: false, error: "Only a paid order can be marked delivered." };
  }
  if (signup.weekday !== weekday) {
    return {
      ok: false,
      error: `${signup.name} is scheduled for ${isWeekday(signup.weekday) ? WEEKDAY_LABEL[signup.weekday] : "another day"}, not ${WEEKDAY_LABEL[weekday]}.`,
    };
  }
  farm.recordDelivery(signup.id, deliveredOn, now);
  if (signup.cadence === "one_time" && signup.status === "confirmed") {
    farm.fulfill(signup.id, now);
  }
  const saved = farm.getSignup(signup.id);
  if (!saved) return { ok: false, error: "That order could not be updated." };
  return { ok: true, signup: saved };
}
