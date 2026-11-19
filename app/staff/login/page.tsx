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
    <div className="md:mx-auto md:max-w-xl md:px-8 md:py-16">
      <div className="px-3 pt-3 md:p-0">
        <div className="rounded-[28px] bg-white px-5 pt-6 pb-6 shadow-[0_16px_40px_rgb(37_42_36_/_8%)] md:rounded-[18px] md:p-10 md:shadow-[0_10px_30px_rgb(37_42_36_/_6%)]">
          <StaffLoginForm />
        </div>
      </div>
    </div>
  );
}
