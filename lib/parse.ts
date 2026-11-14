import {
  CAPS,
  type Cadence,
  type Weekday,
  WEEKDAY_LABEL,
  isCadence,
  isWeekday,
} from "./constants";

export type RequestInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  dozens: number;
  cadence: Cadence;
  weekday: Weekday;
};

export type FieldError = { ok: false; code: "validation" | "capacity"; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequest(input: RequestInput): { ok: true } | FieldError {
  if (!input.name.trim() || input.name.trim().length > 120) {
    return { ok: false, code: "validation", error: "Tell us your name." };
  }
  if (!EMAIL.test(input.email) || input.email.length > 200) {
    return { ok: false, code: "validation", error: "That email doesn't look usable." };
  }
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 7 || input.phone.length > 40) {
    return { ok: false, code: "validation", error: "Add a phone number so we can reach you about delivery." };
  }
  if (!input.address.trim() || input.address.trim().length > 400) {
    return { ok: false, code: "validation", error: "Add the delivery address." };
  }
  if (!isCadence(input.cadence)) {
    return { ok: false, code: "validation", error: "Choose a weekly delivery or a one-time delivery." };
  }
  if (!isWeekday(input.weekday)) {
    return {
      ok: false,
      code: "validation",
      error: "Delivery is Monday through Saturday. Sunday is not a delivery day.",
    };
  }
  if (!Number.isInteger(input.dozens) || input.dozens < 1) {
    return { ok: false, code: "validation", error: "Dozens has to be a whole number, at least 1." };
  }
  const cap = CAPS[input.weekday];
  if (input.dozens > cap) {
    return {
      ok: false,
      code: "capacity",
      error: `${WEEKDAY_LABEL[input.weekday]}'s promise is ${cap} dozen. ${input.dozens} doesn't fit on that truck.`,
    };
  }
  return { ok: true };
}

export type EarlyAccessInput = {
  name: string;
  email: string;
  zip: string;
  phone: string;
  address: string;
  dozens: number | null;
  cadence: Cadence | "";
  weekday: Weekday | "";
  consent: boolean;
};

const ZIP = /^\d{5}(?:-\d{4})?$/;

export function validateEarlyAccess(input: EarlyAccessInput): { ok: true } | FieldError {
  if (!input.consent) {
    return {
      ok: false,
      code: "validation",
      error: "Check the box so we can tell you when deliveries begin.",
    };
  }
  if (!input.name.trim() || input.name.trim().length > 120) {
    return { ok: false, code: "validation", error: "Tell us your name." };
  }
  if (!EMAIL.test(input.email.trim()) || input.email.trim().length > 200) {
    return { ok: false, code: "validation", error: "That email doesn't look usable." };
  }
  if (!ZIP.test(input.zip.trim())) {
    return { ok: false, code: "validation", error: "Add a 5-digit ZIP code." };
  }
  if (input.phone.trim()) {
    const digits = input.phone.replace(/\D/g, "");
    if (digits.length < 7 || input.phone.length > 40) {
      return { ok: false, code: "validation", error: "That phone number doesn't look usable." };
    }
  }
  if (input.address.trim().length > 400) {
    return { ok: false, code: "validation", error: "That address is too long." };
  }
  if (input.weekday && !isWeekday(input.weekday)) {
    return {
      ok: false,
      code: "validation",
      error: "Delivery is Monday through Saturday. Sunday is not a delivery day.",
    };
  }
  if (input.cadence && !isCadence(input.cadence)) {
    return { ok: false, code: "validation", error: "Choose a weekly delivery or a one-time delivery." };
  }
  if (input.dozens != null) {
    if (!Number.isInteger(input.dozens) || input.dozens < 1) {
      return { ok: false, code: "validation", error: "Dozens has to be a whole number, at least 1." };
    }
    const cap = input.weekday && isWeekday(input.weekday) ? CAPS[input.weekday] : CAPS.mon;
    if (input.dozens > cap) {
      const label = input.weekday && isWeekday(input.weekday) ? WEEKDAY_LABEL[input.weekday] : "A delivery day";
      return {
        ok: false,
        code: "capacity",
        error: `${label}'s promise is ${cap} dozen. ${input.dozens} doesn't fit on that truck.`,
      };
    }
  }
  return { ok: true };
}

export function parseEarlyAccess(
  formData: FormData,
): { ok: true; spam: true } | { ok: true; value: EarlyAccessInput } | FieldError {
  if (String(formData.get("company_website") ?? "").trim()) {
    return { ok: true, spam: true };
  }
  const dozensRaw = String(formData.get("dozens") ?? "").trim();
  let dozens: number | null = null;
  if (dozensRaw) {
    if (!/^\d+$/.test(dozensRaw)) {
      return { ok: false, code: "validation", error: "Dozens has to be a whole number, at least 1." };
    }
    dozens = Number(dozensRaw);
  }
  const input: EarlyAccessInput = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    zip: String(formData.get("zip") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    dozens,
    cadence: String(formData.get("cadence") ?? "").trim() as Cadence | "",
    weekday: String(formData.get("weekday") ?? "").trim() as Weekday | "",
    consent: formData.get("consent") === "yes",
  };
  const checked = validateEarlyAccess(input);
  if (!checked.ok) return checked;
  return { ok: true, value: input };
}

export function parseForm(formData: FormData): { ok: true; value: RequestInput } | FieldError {
  const dozensRaw = String(formData.get("dozens") ?? "").trim();
  const dozens = Number(dozensRaw);
  if (!/^\d+$/.test(dozensRaw)) {
    return { ok: false, code: "validation", error: "Dozens has to be a whole number, at least 1." };
  }
  const input: RequestInput = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    dozens,
    cadence: String(formData.get("cadence") ?? "") as Cadence,
    weekday: String(formData.get("weekday") ?? "") as Weekday,
  };
  const checked = validateRequest(input);
  if (!checked.ok) return checked;
  return { ok: true, value: input };
}
