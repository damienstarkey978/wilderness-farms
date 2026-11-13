import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#e3d3b4] bg-forest-deep text-cream">
      <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-5 py-8 text-sm">
        <div>
          <p className="display text-xl text-yolk">Wilderness Farms</p>
          <p className="mt-1 max-w-md text-cream/90">
            Organic eggs delivered in Ponte Vedra Beach, Florida. $10 a dozen. Monday through Saturday.
          </p>
        </div>
        <Link href="/admin" className="font-bold text-yolk no-underline">
          Farm desk
        </Link>
      </div>
    </footer>
  );
}
