import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { STAFF_COOKIE } from "@/lib/constants";
import { readStaffCookie } from "@/lib/auth";
import { StaffLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff desk", robots: { index: false, follow: false } };

export default async function StaffLoginPage() {
  await connection();
  const jar = await cookies();
  if (readStaffCookie(jar.get(STAFF_COOKIE)?.value)) redirect("/staff");
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <StaffLoginForm />
    </div>
  );
}
