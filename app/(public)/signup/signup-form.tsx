"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { submitSignup } from "@/app/actions";
import { classifyAddress } from "@/lib/address";
import { WEEKDAYS, WEEKDAY_LABEL, formatDollars, orderAmountCents, type Weekday } from "@/lib/constants";
import type { CapacityDay } from "@/lib/db";
import type { SignupFormState } from "@/lib/form-state";

const fieldClass =
  "h-12 w-full rounded-xl border border-beige bg-white px-3 text-base font-normal text-ink outline-none focus-visible:border-forest";

function availability(day: CapacityDay): string {
  if (day.remaining <= 0) return `Fully Booked for ${day.label}`;
  if (day.remaining < day.cap) return `Limited Availability for ${day.label}`;
  return `Available for ${day.label} Delivery`;
}

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
  const [more, setMore] = useState(false);
  const [weekday, setWeekday] = useState<Weekday>("mon");
  const [dozens, setDozens] = useState(1);
  const [address, setAddress] = useState("");
  const day = days.find((item) => item.weekday === weekday) ?? days[0];
  const place = useMemo(() => (address.trim() ? classifyAddress(address) : null), [address]);
  const price = formatDollars(orderAmountCents(Number.isInteger(dozens) ? dozens : 0));

  useEffect(() => {
    if (!state || state.ok || !state.error) return;
    if (/phone|address|dozen|Sunday|delivery day|weekly/i.test(state.error)) setMore(true);
  }, [state]);

  if (state?.ok && state.kind === "waitlist") {
    return (
      <section aria-live="polite" className="soft-card rise p-8 md:p-10">
        <h2 className="font-serif text-4xl text-forest">You&apos;re on the list!</h2>
        <p className="mt-4 text-lg leading-relaxed">
          {state.duplicate
            ? "That email was already on the list. We'll be in touch when deliveries are ready to begin."
            : "Thanks for joining Wilderness Farms. We'll be in touch when deliveries are ready to begin."}
        </p>
        <p className="mt-3 text-sm text-ink/70">Nothing was charged, and no eggs were reserved.</p>
      </section>
    );
  }

  if (!greenlit) {
    return (
      <form action={action} className="soft-card grid gap-5 p-6 md:p-10">
        <p className="text-sm text-ink/70">Name, email, and ZIP are required. Everything else can wait.</p>
        {state && !state.ok ? (
          <p className="rounded-xl bg-[#f8e4d4] px-4 py-3 text-bark" role="alert">
            {state.error}
          </p>
        ) : null}
        <label className="grid gap-1.5 text-sm font-medium">
          Full name
          <input name="name" autoComplete="name" required maxLength={120} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Email
          <input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={200} className={fieldClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          ZIP code
          <input
            name="zip"
            autoComplete="postal-code"
            inputMode="numeric"
            required
            maxLength={10}
            pattern="\d{5}(-\d{4})?"
            className={fieldClass}
          />
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input name="consent" type="checkbox" value="yes" required className="mt-1 size-5 accent-forest" />
          <span>Email me when deliveries are ready to begin. Joining does not reserve eggs.</span>
        </label>
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>
            Company website
            <input name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button
          type="button"
          className="h-11 text-left text-sm font-medium text-forest"
          aria-expanded={more}
          aria-controls="optional-details"
          onClick={() => setMore((value) => !value)}
        >
          {more ? "Hide optional details" : "Add delivery details (optional)"}
        </button>
        {more ? (
          <div id="optional-details" className="grid gap-5 rounded-2xl bg-cream p-5">
            <p className="text-sm text-ink/70">
              Phone, address, day, dozens, and weekly or one-time are optional. They do not reserve eggs.
            </p>
            <label className="grid gap-1.5 text-sm font-medium">
              Phone
              <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} className={fieldClass} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Delivery address
              <textarea name="address" autoComplete="street-address" maxLength={400} rows={3} className={`${fieldClass} h-auto py-3`} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Preferred delivery day
              <select name="weekday" defaultValue="" className={fieldClass}>
                <option value="">No preference</option>
                {WEEKDAYS.map((value) => (
                  <option key={value} value={value}>
                    {WEEKDAY_LABEL[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Estimated dozens
              <input name="dozens" type="number" min={1} max={50} step={1} inputMode="numeric" className={fieldClass} />
            </label>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Weekly or one-time</legend>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="radio" name="cadence" value="" defaultChecked /> No preference
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="radio" name="cadence" value="weekly" /> Weekly
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="radio" name="cadence" value="one_time" /> One time
              </label>
            </fieldset>
          </div>
        ) : null}
        <button
          className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-base font-medium text-white disabled:opacity-70"
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving…" : "Join the Early Access List"}
        </button>
        <p className="text-sm text-ink/65">Free to join. No payment required. No eggs are held.</p>
      </form>
    );
  }

  return (
    <form action={action} className="soft-card grid gap-5 p-6 md:p-10">
      <p className="text-sm text-ink/70">$10 per dozen. Card payment goes through Stripe. We never see the card.</p>
      {canceled ? (
        <p className="rounded-xl bg-[#fff3df] px-4 py-3 text-bark" role="status">
          The card payment was canceled. Nothing was charged, and no dozen were held.
        </p>
      ) : null}
      {!paymentsReady ? (
        <p className="rounded-xl border border-gold bg-[#fff8ee] px-4 py-3" role="status">
          Payments are not configured. You can see the price and the days. Nothing will be charged, and no dozen will
          be reserved.
        </p>
      ) : null}
      {state && !state.ok ? (
        <p className="rounded-xl bg-[#f8e4d4] px-4 py-3 text-bark" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="grid gap-1.5 text-sm font-medium">
        Full name
        <input name="name" autoComplete="name" required maxLength={120} className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={200} className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Phone
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={40} className={fieldClass} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Delivery address
        <textarea
          name="address"
          autoComplete="street-address"
          required
          maxLength={400}
          rows={3}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className={`${fieldClass} h-auto py-3`}
        />
        {place ? <span className="font-normal text-sage">{place.note}</span> : null}
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Dozens
        <input
          name="dozens"
          type="number"
          min={1}
          max={50}
          step={1}
          required
          inputMode="numeric"
          value={dozens}
          onChange={(event) => setDozens(Number(event.target.value))}
          className={fieldClass}
        />
        <span className="font-normal text-ink/70">
          {day ? `${day.remaining} dozen left for ${day.label}. ${availability(day)}.` : null}
        </span>
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Delivery day
        <select
          name="weekday"
          value={weekday}
          onChange={(event) => setWeekday(event.target.value as Weekday)}
          className={fieldClass}
        >
          {WEEKDAYS.map((value) => (
            <option key={value} value={value}>
              {WEEKDAY_LABEL[value]}
            </option>
          ))}
        </select>
        <span className="font-normal text-forest">{day ? availability(day) : null}</span>
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Weekly or one-time</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="cadence" value="weekly" defaultChecked />
          Weekly, until you cancel
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input type="radio" name="cadence" value="one_time" />
          One time
        </label>
      </fieldset>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 font-medium text-white disabled:opacity-70"
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving…" : "Continue to card payment"}
        </button>
        <p className="text-sm text-ink/70">
          {Number.isInteger(dozens) && dozens > 0 ? `${dozens} dozen · ${price}` : "Choose a dozen count"}
        </p>
      </div>
    </form>
  );
}
