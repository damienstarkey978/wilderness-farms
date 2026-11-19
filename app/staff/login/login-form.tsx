"use client";

import { useActionState } from "react";
import { staffLogin } from "@/app/actions";
import { STAFF } from "@/lib/constants";

const fieldClass =
  "h-12 w-full rounded-xl border border-beige bg-cream px-3 text-base font-normal text-ink outline-none focus-visible:border-forest md:bg-white";

export function StaffLoginForm() {
  const [state, action, pending] = useActionState(staffLogin, null);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <h1 className="font-serif text-[2rem] leading-tight text-forest md:text-5xl">Staff desk</h1>
        <p className="mt-2 text-base leading-relaxed text-ink/75">
          Damien, Howard, Gavin, and Hollis share one password. Customers do not use this page.
        </p>
      </div>
      {state?.error ? (
        <p className="rounded-xl bg-[#f8e4d4] px-4 py-3 text-bark" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="grid gap-1.5 text-sm font-medium">
        Who
        <select name="who" autoComplete="username" required defaultValue="" className={fieldClass}>
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
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={fieldClass} />
      </label>
      <button
        className="flex h-12 w-full items-center justify-center rounded-full bg-forest text-base font-medium text-white disabled:opacity-70"
        type="submit"
        disabled={pending}
      >
        {pending ? "Checking…" : "Open the staff desk"}
      </button>
    </form>
  );
}
