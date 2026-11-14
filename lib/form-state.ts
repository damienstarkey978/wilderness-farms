import type { AddressFlag } from "./address";
import type { Cadence } from "./constants";

export type StaffFormState = { error?: string; ok?: string } | null;

export type SignupFormState = {
  ok: boolean;
  code?: "validation" | "capacity" | "payments" | "closed" | "stripe";
  error?: string;
  kind?: "waitlist";
  name?: string;
  dozens?: number;
  weekdayLabel?: string;
  cadence?: Cadence;
  flag?: AddressFlag;
  flagNote?: string;
  duplicate?: boolean;
};
