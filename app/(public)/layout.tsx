import Image from "next/image";
import { MobileTabs } from "@/components/mobile-tabs";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream pb-[calc(7.25rem+env(safe-area-inset-bottom))] text-ink md:pb-0">
      <PublicHeader />
      <div className="px-8 pt-8 pb-2 md:hidden">
        <Image
          src="/logo.webp"
          alt="Wilderness Farms"
          width={760}
          height={695}
          priority
          className="mx-auto h-auto w-full max-w-[19rem]"
        />
      </div>
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <MobileTabs />
    </div>
  );
}
