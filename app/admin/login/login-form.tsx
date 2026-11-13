"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="paper grid max-w-md gap-4 px-6 py-6">
      <h1 className="display text-4xl text-forest-deep">Farm desk</h1>
      <p>The local development password is in the README. Set ADMIN_PASSWORD before a production start.</p>
      {state?.error ? (
        <p className="rounded-xl bg-[#f8e4d4] px-4 py-3 text-bark" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="sr-only">
        Username
        <input name="username" autoComplete="username" defaultValue="farm desk" />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn w-fit" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Open the desk"}
      </button>
    </form>
  );
}
