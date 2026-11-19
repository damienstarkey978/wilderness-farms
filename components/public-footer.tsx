import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/our-farm", label: "Our Farm" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/signup", label: "Join Early Access" },
  { href: "/staff", label: "Staff" },
];

export function PublicFooter() {
  return (
    <footer className="hidden border-t border-beige bg-cream md:block">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
        <div>
          <p className="font-serif text-3xl text-forest">Wilderness Farms</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/75">
            Fresh eggs for Ponte Vedra Beach. $10 per dozen. Monday through Saturday. First eggs expected March 2027.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm" aria-label="Footer">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-forest no-underline hover:text-forest-deep">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
