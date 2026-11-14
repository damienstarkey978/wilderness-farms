import Link from "next/link";

function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} aria-hidden="true">
      <path
        d="M20 150c30-10 40-50 48-88 10 30 28 62 62 78-28 8-70 18-110 10z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M62 70c8 18 10 40 8 62" fill="none" stroke="#c7a76c" strokeWidth="2" />
      <path d="M78 96c16 4 28 2 42-8M70 118c14 6 26 6 40-2" fill="none" stroke="#c7a76c" strokeWidth="1.5" />
    </svg>
  );
}

export function EarlyAccessBand() {
  return (
    <section className="relative hidden overflow-hidden bg-forest text-cream md:block">
      <Leaf className="pointer-events-none absolute -left-8 bottom-0 hidden h-44 w-44 text-sage/50 md:block" />
      <Leaf className="pointer-events-none absolute -right-6 top-0 hidden h-40 w-40 -scale-x-100 text-gold/40 md:block" />
      <div className="relative mx-auto max-w-[760px] px-5 py-16 text-center md:py-24">
        <h2 className="font-serif text-4xl leading-[1.15] text-cream md:text-5xl">
          Your Breakfast Is About to Get Better.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/85 md:text-lg">
          Our first eggs are expected in March 2027. Join our early access list and we&apos;ll let you know when
          it&apos;s time to place your first order.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gold px-7 text-base font-medium text-ink no-underline hover:bg-[#d4b888]"
        >
          Save My Spot
        </Link>
        <p className="mt-4 text-sm text-cream/70">Joining the list does not guarantee availability or reserve eggs.</p>
      </div>
    </section>
  );
}
