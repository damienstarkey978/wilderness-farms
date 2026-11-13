"use client";

import { useActionState } from "react";
import { addLedgerEntry, addWeeklyPay, adjustCartonCount, setCartonCount } from "@/app/actions";
import type { StaffFormState } from "@/lib/form-state";

function Alert({ state }: { state: StaffFormState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p className={`rounded-xl px-4 py-3 ${state.error ? "bg-[#f8e4d4] text-bark" : "bg-[#e5f0e4] text-forest"}`} role="status">
      {state.error ?? state.ok}
    </p>
  );
}

export function MoneyInForm() {
  const [state, action, pending] = useActionState(addLedgerEntry, null);
  return (
    <form action={action} className="grid gap-3">
      <h3 className="text-lg font-extrabold">Money in from egg sales</h3>
      <input type="hidden" name="direction" value="in" />
      <Alert state={state} />
      <label className="field">
        <span>Date</span>
        <input name="occurredOn" type="date" required />
      </label>
      <label className="field">
        <span>Amount in cents</span>
        <input name="amount" inputMode="numeric" required placeholder="1000 is $10" />
      </label>
      <label className="field">
        <span>Note</span>
        <input name="note" required />
      </label>
      <button className="btn w-fit" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Log money in"}
      </button>
    </form>
  );
}

export function MoneyOutForm() {
  const [state, action, pending] = useActionState(addLedgerEntry, null);
  return (
    <form action={action} className="grid gap-3">
      <h3 className="text-lg font-extrabold">Money out</h3>
      <input type="hidden" name="direction" value="out" />
      <Alert state={state} />
      <label className="field">
        <span>What</span>
        <select name="category" required defaultValue="feed">
          <option value="feed">Feed</option>
          <option value="cartons">Cartons</option>
          <option value="gas">Gas</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="field">
        <span>Date</span>
        <input name="occurredOn" type="date" required />
      </label>
      <label className="field">
        <span>Amount in cents</span>
        <input name="amount" inputMode="numeric" required placeholder="1000 is $10" />
      </label>
      <label className="field">
        <span>Note</span>
        <input name="note" required />
      </label>
      <button className="btn w-fit" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Log money out"}
      </button>
    </form>
  );
}

export function PayForm() {
  const [state, action, pending] = useActionState(addWeeklyPay, null);
  return (
    <form action={action} className="grid gap-3">
      <h3 className="display text-3xl text-forest-deep">Weekly pay</h3>
      <p>Enter the amount for the week. Leave a name blank to skip that person. Both can be paid in the same week.</p>
      <Alert state={state} />
      <label className="field">
        <span>Week</span>
        <input name="weekOf" type="date" required />
      </label>
      <label className="field">
        <span>Gavin, amount in cents</span>
        <input name="gavinAmount" inputMode="numeric" />
      </label>
      <label className="field">
        <span>Hollis, amount in cents</span>
        <input name="hollisAmount" inputMode="numeric" />
      </label>
      <label className="field">
        <span>Note</span>
        <input name="note" />
      </label>
      <button className="btn w-fit" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Log pay out"}
      </button>
    </form>
  );
}

export function CartonForms({ count }: { count: number }) {
  const [setState, setAction, setPending] = useActionState(setCartonCount, null);
  const [adjustState, adjustAction, adjustPending] = useActionState(adjustCartonCount, null);
  return (
    <div className="grid gap-4">
      <p className="text-2xl font-extrabold text-forest-deep">{count} on hand</p>
      <form action={setAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="sm:col-span-2">
          <Alert state={setState} />
        </div>
        <label className="field sm:col-span-1">
          <span>Set the count</span>
          <input name="count" inputMode="numeric" required />
        </label>
        <button className="btn" type="submit" disabled={setPending}>
          {setPending ? "Saving…" : "Set cartons"}
        </button>
      </form>
      <form action={adjustAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="sm:col-span-2">
          <Alert state={adjustState} />
        </div>
        <label className="field">
          <span>Add or remove</span>
          <input name="delta" inputMode="numeric" required placeholder="12 or -12" />
        </label>
        <button className="btn quiet" type="submit" disabled={adjustPending}>
          {adjustPending ? "Saving…" : "Adjust cartons"}
        </button>
      </form>
    </div>
  );
}
