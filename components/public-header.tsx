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
  { href: "/staff", label: "Staff" },
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
      className={`sticky top-0 z-40 hidden border-b transition-colors md:block ${
        scrolled ? "border-beige/80 bg-white/95 shadow-[0_8px_24px_rgb(37_42_36_/_6%)] backdrop-blur" : "border-transparent bg-cream"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-3 px-6 py-4">
        <Link href="/" className="block w-full max-w-[40rem] no-underline xl:max-w-[52rem]" aria-label="Wilderness Farms home">
          <Image
            src="/wilderness-farms-wordmark.jpg"
            alt="Wilderness Farms, Ponte Vedra Beach, Florida"
            width={2172}
            height={724}
            priority
            unoptimized
            className="block h-auto w-full object-contain"
          />
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2" aria-label="Primary">
          {LINKS.map((link) => {
            const active = link.href === "/staff" ? pathname.startsWith("/staff") : pathname === link.href;
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
