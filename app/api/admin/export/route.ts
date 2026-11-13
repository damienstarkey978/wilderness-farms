import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/constants";
import { adminCookieValid } from "@/lib/auth";
import { signupsToCsv } from "@/lib/csv";
import { getFarm } from "@/lib/db";

export async function GET() {
  const jar = await cookies();
  if (!adminCookieValid(jar.get(ADMIN_COOKIE)?.value)) {
    return new Response("Sign in at the farm desk first.\n", { status: 401 });
  }
  const csv = signupsToCsv(getFarm().listSignups());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wilderness-farms-emails.csv"',
    },
  });
}
