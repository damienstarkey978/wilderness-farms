"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/our-farm", label: "Our Farm" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        pathname === "/" ? "hidden md:block" : ""
      } ${
        scrolled ? "border-beige/80 bg-white/95 shadow-[0_8px_24px_rgb(37_42_36_/_6%)] backdrop-blur" : "border-transparent bg-cream"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-5 md:h-[4.75rem] md:px-8">
        <Link href="/" className="mx-auto shrink-0 no-underline md:mx-0" aria-label="Wilderness Farms home">
          <Image src="/logo.webp" alt="Wilderness Farms" width={168} height={154} priority className="h-12 w-auto" />
        </Link>
        <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm no-underline ${active ? "font-medium text-forest" : "text-ink/80 hover:text-forest"}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white no-underline hover:bg-forest-deep"
          >
            Join Early Access
          </Link>
        </nav>
      </div>
    </header>
  );
}
