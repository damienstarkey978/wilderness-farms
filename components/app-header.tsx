import Image from "next/image";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 bg-forest text-cream">
      <div className="mx-auto flex min-h-16 max-w-lg items-center gap-3 px-4 py-2">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-cream no-underline">
          <Image
            src="/logo.webp"
            alt="Wilderness Farms"
            width={760}
            height={695}
            priority
            className="h-12 w-auto shrink-0 bg-cream"
          />
          <span className="truncate text-[15px] font-semibold tracking-tight">Wilderness Farms</span>
        </Link>
        <Link href="/delivery" className="ml-auto text-sm font-medium text-cream/80 no-underline">
          Delivery
        </Link>
      </div>
    </header>
  );
}
