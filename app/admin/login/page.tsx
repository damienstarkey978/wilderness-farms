import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { ADMIN_COOKIE } from "@/lib/constants";
import { adminCookieValid } from "@/lib/auth";

export const metadata = { title: "Farm desk", robots: { index: false, follow: false } };

export default async function LoginPage() {
  await connection();
  const jar = await cookies();
  if (adminCookieValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");
  return (
    <div className="mx-auto px-5 py-12">
      <LoginForm />
    </div>
  );
}
