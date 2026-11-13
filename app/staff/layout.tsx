import { connection } from "next/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getFarm } from "@/lib/db";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const greenlit = getFarm().getGreenlit();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader greenlit={greenlit} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
