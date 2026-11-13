import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-forest/10 px-5 py-8 pb-28 text-sm text-moss">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
        <p>Wilderness Farms · Ponte Vedra Beach</p>
        <span className="flex gap-4">
          <Link href="/demo" className="text-moss no-underline">
            Sunday demo
          </Link>
          <Link href="/admin" className="font-medium text-forest no-underline">
            Farm desk
          </Link>
        </span>
      </div>
    </footer>
  );
}
