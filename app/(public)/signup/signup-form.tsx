"use client";

import { useActionState, useMemo, useState } from "react";
import { submitSignup } from "@/app/actions";
import { classifyAddress } from "@/lib/address";
import { WEEKDAYS, WEEKDAY_LABEL, formatDollars, orderAmountCents, type Weekday } from "@/lib/constants";
import type { CapacityDay } from "@/lib/db";
import type { SignupFormState } from "@/lib/form-state";

export function SignupForm({
  greenlit,
  paymentsReady,
  days,
  canceled,
}: {
  greenlit: boolean;
  paymentsReady: boolean;
  days: CapacityDay[];
  canceled: boolean;
}) {
  const [state, action, pending] = useActionState<SignupFormState | null, FormData>(submitSignup, null);
  const [weekday, setWeekday] = useState<Weekday>("mon");
  const [dozens, setDozens] = useState(1);
  const [address, setAddress] = useState("");
  const day = days.find((item) => item.weekday === weekday) ?? days[0];
  const place = useMemo(() => (address.trim() ? classifyAddress(address) : null), [address]);
  const price = formatDollars(orderAmountCents(Number.isInteger(dozens) ? dozens : 0));

  if (state?.ok && state.kind === "waitlist") {
    return (
      <section aria-live="polite">
        <h2 className="text-3xl font-semibold tracking-tight text-forest-deep">You&apos;re on the list, {state.name}.</h2>
        <p className="mt-3 text-[15px] leading-relaxed">
          This is interest, not a reserved carton. We did not charge you, and we did not hold{" "}
          {state.dozens} dozen for {state.cadence === "weekly" ? `every ${state.weekdayLabel}` : `a ${state.weekdayLabel}`}.
          The hens are not laying until March 2027.
        </p>
        {state.flag && state.flag !== "in_area" ? (
          <p className="mt-3 text-bark">{state.flagNote}</p>
        ) : (
          <p className="mt-3 text-forest">{state.flagNote}</p>
        )}
      </section>
    );
  }

  return (
    <form action={action} className="grid gap-5 pb-24">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-forest-deep">
          {greenlit ? "Order eggs" : "Get on the list"}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          {greenlit
            ? "A weekly order holds that weekday every week until you cancel. A one-time order uses the day once. Both count against the dozen left."
            : "Tell us you want eggs. This does not reserve a carton and it is not an order."}
        </p>
      </div>

      {canceled ? (
        <p className="rounded-xl bg-[#fff3df] px-4 py-3 text-bark" role="status">
          The card payment was canceled. Nothing was charged, and no dozen were held.
        </p>
      ) : null}

      {greenlit && !paymentsReady ? (
        <p className="rounded-xl border border-sunrise bg-[#fff3df] px-4 py-3" role="status">
          <strong>Payments are not configured.</strong> You can see the price and the days. We can&apos;t take a
          card yet. Nothing will be charged, and no dozen will be reserved.
        </p>
      ) : null}

      {state && !state.ok ? (
        <p className="rounded-xl bg-[#f8e4d4] px-4 py-3 text-bark" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="grid gap-1.5 text-sm font-medium">
        <span>Name</span>
        <input name="name" autoComplete="name" required maxLength={120} className="h-12 rounded-xl border border-forest/15 bg-white px-3 text-base font-normal" />
      </label>
      <div className="grid gap-5">
        <label className="grid gap-1.5 text-sm font-medium">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} className="h-12 rounded-xl border border-forest/15 bg-white px-3 text-base font-normal" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" required maxLength={40} className="h-12 rounded-xl border border-forest/15 bg-white px-3 text-base font-normal" />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        <span>Delivery address</span>
        <textarea
          name="address"
          autoComplete="street-address"
          required
          maxLength={400}
          rows={3}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Street, Ponte Vedra Beach, FL"
          className="rounded-xl border border-forest/15 bg-white px-3 py-3 text-base font-normal"
        />
        <span className="font-semibold text-moss">
          We deliver in Ponte Vedra Beach. Regular Ponte Vedra is not decided. An address outside the beach is
          flagged, not refused.
        </span>
        {place && place.flag !== "in_area" ? <span className="text-bark">{place.note}</span> : null}
        {place && place.flag === "in_area" ? <span className="text-forest">{place.note}</span> : null}
      </label>

      <div className="grid gap-5">
        <label className="grid gap-1.5 text-sm font-medium">
          <span>Dozens</span>
          <input
            name="dozens"
            type="number"
            min={1}
            max={50}
            step={1}
            required
            value={dozens}
            onChange={(event) => setDozens(Number(event.target.value))}
            className="h-12 rounded-xl border border-forest/15 bg-white px-3 text-base font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          <span>Delivery day</span>
          <select
            name="weekday"
            value={weekday}
            onChange={(event) => setWeekday(event.target.value as Weekday)}
            className="h-12 rounded-xl border border-forest/15 bg-white px-3 text-base font-normal"
          >
            {WEEKDAYS.map((value) => (
              <option key={value} value={value}>
                {WEEKDAY_LABEL[value]}
              </option>
            ))}
          </select>
          <span>
            {day.label} has {day.remaining} dozen left of {day.cap}.
          </span>
        </label>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">How often</legend>
        <label className="flex items-start gap-2">
          <input type="radio" name="cadence" value="weekly" defaultChecked />
          <span>Weekly. Holds this weekday every week until you cancel.</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="cadence" value="one_time" />
          <span>One time. Uses this weekday once, until it&apos;s delivered.</span>
        </label>
      </fieldset>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-moss">$10 a dozen. No charge on the waitlist.</p>
            <p className="truncate text-sm font-semibold">
              {Number.isInteger(dozens) && dozens > 0 ? `${dozens} dozen · ${price}` : "Choose a dozen count"}
            </p>
          </div>
          <button
            className="ml-auto inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-sunrise px-5 text-sm font-semibold text-ink disabled:opacity-70"
            type="submit"
            disabled={pending}
          >
            {pending ? "Saving…" : greenlit ? "Pay by card" : "Put me on the list"}
          </button>
        </div>
      </div>
    </form>
  );
}
