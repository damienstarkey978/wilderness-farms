import { WEEKDAY_LABEL, isWeekday, type Weekday } from "./constants";
import { isDeliveryWeekday, weekdayOf } from "./dates";
import type { FarmStore, Signup } from "./db";

export type RouteStop = {
  signup: Signup;
  position: number;
  delivered: boolean;
};

export function directionsUrl(addresses: string[]): string | null {
  const stops = addresses.map((address) => address.trim()).filter(Boolean);
  if (stops.length === 0) return null;
  return `https://www.google.com/maps/dir/${stops.map((address) => encodeURIComponent(address)).join("/")}`;
}

export function showsDelivered(signup: Signup, latestDelivery: string | null): boolean {
  if (signup.kind !== "order") return false;
  return signup.status === "fulfilled" || latestDelivery != null;
}

export function buildRoute(
  farm: FarmStore,
  date: string,
):
  | { ok: true; date: string; weekday: Weekday; stops: RouteStop[]; directionsUrl: string | null }
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

  const stops = [...byId.values()]
    .map((signup) => ({
      signup,
      position: farm.routePosition(weekday, signup.id),
      delivered: farm.isDeliveredOn(signup.id, date) || signup.status === "fulfilled",
    }))
    .sort((a, b) => a.position - b.position || a.signup.createdAt.localeCompare(b.signup.createdAt));

  const driving = stops.filter((stop) => !stop.delivered).map((stop) => stop.signup.address);
  return { ok: true, date, weekday, stops, directionsUrl: directionsUrl(driving) };
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
