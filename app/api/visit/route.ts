import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { VISITOR_COOKIE } from "@/lib/constants";
import { getFarm } from "@/lib/db";

const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const jar = await cookies();
  if (jar.get(VISITOR_COOKIE)?.value) return new Response(null, { status: 204 });

  let id = "";
  try {
    const body = (await request.json()) as { id?: unknown };
    if (typeof body.id === "string") id = body.id;
  } catch {
    id = "";
  }
  if (!VISITOR_ID.test(id)) id = randomUUID();
  getFarm().recordVisitor(id);
  jar.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return new Response(null, { status: 204 });
}
