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
      <section className="paper border-l-8 border-l-canopy px-6 py-6" aria-live="polite">
        <h2 className="display text-3xl text-forest-deep">You&apos;re on the list, {state.name}.</h2>
        <p className="mt-3 text-lg leading-relaxed">
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
    <form action={action} className="paper grid gap-5 px-5 py-6 md:px-7">
      <div>
        <h2 className="display text-3xl text-forest-deep">{greenlit ? "Order eggs" : "Get on the list"}</h2>
        <p className="mt-2 leading-relaxed">
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

      <label className="field">
        <span>Name</span>
        <input name="name" autoComplete="name" required maxLength={120} />
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required maxLength={200} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" required maxLength={40} />
        </label>
      </div>
      <label className="field">
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
        />
        <span className="font-semibold text-moss">
          We deliver in Ponte Vedra Beach. Regular Ponte Vedra is not decided. An address outside the beach is
          flagged, not refused.
        </span>
        {place && place.flag !== "in_area" ? <span className="text-bark">{place.note}</span> : null}
        {place && place.flag === "in_area" ? <span className="text-forest">{place.note}</span> : null}
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="field">
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
          />
        </label>
        <label className="field">
          <span>Delivery day</span>
          <select
            name="weekday"
            value={weekday}
            onChange={(event) => setWeekday(event.target.value as Weekday)}
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

      <fieldset className="grid gap-2">
        <legend className="font-extrabold">How often</legend>
        <label className="flex items-start gap-2">
          <input type="radio" name="cadence" value="weekly" defaultChecked />
          <span>Weekly. Holds this weekday every week until you cancel.</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="cadence" value="one_time" />
          <span>One time. Uses this weekday once, until it&apos;s delivered.</span>
        </label>
      </fieldset>

      <p className="display text-3xl text-forest">
        {Number.isInteger(dozens) && dozens > 0 ? `${dozens} dozen · ${price}` : "Choose a dozen count"}
      </p>
      <p className="text-sm text-moss">$10 a dozen. No charge on the waitlist.</p>

      <button className="btn sunrise w-fit" type="submit" disabled={pending}>
        {pending ? "Saving…" : greenlit ? "Pay by card" : "Put me on the list"}
      </button>
    </form>
  );
}
