import Image from "next/image";
import Link from "next/link";

export function SiteHeader({ greenlit }: { greenlit: boolean }) {
  return (
    <header className="bg-forest text-cream">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-3 text-cream no-underline">
          <Image
            src="/logo.webp"
            alt="Wilderness Farms logo: a hen, eggs, and a sunrise over Ponte Vedra Beach"
            width={760}
            height={695}
            priority
            className="h-[4.6rem] w-auto rounded-md bg-cream"
          />
          <span>
            <span className="display block text-2xl leading-none text-cream">Wilderness Farms</span>
            <span className="mt-1 block text-sm text-yolk">Ponte Vedra Beach · $10 a dozen</span>
          </span>
        </Link>
        <nav className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-extrabold">
          <Link href="/" className="text-cream no-underline">
            Home
          </Link>
          <Link href="/how-it-works" className="text-cream no-underline">
            How It Works
          </Link>
          <Link href="/signup" className="rounded-full bg-sunrise px-3 py-1.5 text-ink no-underline">
            {greenlit ? "Order eggs" : "The list"}
          </Link>
        </nav>
      </div>
      <div className="sunrise-rule" />
    </header>
  );
}
