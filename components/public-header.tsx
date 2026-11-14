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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled ? "border-beige/80 bg-white/95 shadow-[0_8px_24px_rgb(37_42_36_/_6%)] backdrop-blur" : "border-transparent bg-cream"
      }`}
    >
      <div className="mx-auto flex h-[4.75rem] max-w-[1200px] items-center gap-4 px-5 md:px-8">
        <Link href="/" className="shrink-0 no-underline" aria-label="Wilderness Farms home">
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
        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-forest md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="flex w-5 flex-col gap-1.5">
            <span className="h-0.5 w-full bg-forest" />
            <span className="h-0.5 w-full bg-forest" />
            <span className="h-0.5 w-full bg-forest" />
          </span>
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-beige bg-cream px-5 py-4 md:hidden" aria-label="Mobile">
          <div className="mx-auto flex max-w-[1200px] flex-col">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="flex h-12 items-center text-lg text-forest no-underline">
                {link.label}
              </Link>
            ))}
            <Link
              href="/signup"
              className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-forest px-5 text-base font-medium text-white no-underline"
            >
              Join Early Access
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
