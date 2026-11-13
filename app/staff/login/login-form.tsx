"use client";

import { useActionState } from "react";
import { staffLogin } from "@/app/actions";
import { STAFF } from "@/lib/constants";

export function StaffLoginForm() {
  const [state, action, pending] = useActionState(staffLogin, null);
  return (
    <form action={action} className="paper grid max-w-md gap-4 px-6 py-6">
      <h1 className="display text-4xl text-forest-deep">Staff desk</h1>
      <p>Damien, Howard, Gavin, and Hollis. Same farm password as the farm desk. Customers do not use this page.</p>
      {state?.error ? (
        <p className="rounded-xl bg-[#f8e4d4] px-4 py-3 text-bark" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span>Who</span>
        <select name="who" autoComplete="username" required defaultValue="">
          <option value="" disabled>
            Choose your name
          </option>
          {STAFF.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn w-fit" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Open the staff desk"}
      </button>
    </form>
  );
}
