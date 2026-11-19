import { MobileTabs } from "@/components/mobile-tabs";
import { PhoneWordmark } from "@/components/phone-wordmark";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream pb-[calc(7.25rem+env(safe-area-inset-bottom))] text-ink md:pb-0">
      <PublicHeader />
      <PhoneWordmark />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <MobileTabs />
    </div>
  );
}
