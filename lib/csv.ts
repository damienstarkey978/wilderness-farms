import type { Signup } from "./db";

function cell(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function signupsToCsv(signups: Signup[]): string {
  const header = ["email", "name", "phone", "kind", "status", "weekday", "dozens", "cadence", "address_flag", "address"];
  const lines = signups.map((signup) =>
    [
      signup.email,
      signup.name,
      signup.phone,
      signup.kind,
      signup.status,
      signup.weekday,
      signup.dozens,
      signup.cadence,
      signup.addressFlag,
      signup.address,
    ]
      .map(cell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n") + "\n";
}
