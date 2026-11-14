import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EarlyAccessBand } from "@/components/early-access-band";
import { LAYING_START } from "@/lib/constants";

export const metadata: Metadata = { title: "Our Farm" };

export default function OurFarmPage() {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-medium tracking-[0.18em] text-sage uppercase">Ponte Vedra Beach</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.08] text-forest md:text-6xl">
          Small Farm. Big Love for Good Food.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/80">
          Wilderness Farms is a small farm in Ponte Vedra Beach. We&apos;re preparing for first eggs in {LAYING_START},
          then local delivery to your door, Monday through Saturday, at $10 a dozen.
        </p>
        <div className="photo-frame mt-10">
          <Image
            src="/photos/hens.jpg"
            alt="Brown hens walking on grass"
            width={1600}
            height={1100}
            priority
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
        <p className="mt-3 text-sm text-ink/60">These photos are stand-ins until pictures from the farm are ready.</p>

        <div className="mt-16 grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-4xl text-forest">What to expect</h2>
            <ul className="mt-5 space-y-3 text-base leading-relaxed text-ink/80">
              <li>Local delivery in Ponte Vedra Beach.</li>
              <li>Monday through Saturday. No Sunday route.</li>
              <li>$10 per dozen.</li>
              <li>First eggs expected {LAYING_START}.</li>
              <li>The early access list is free and does not reserve eggs.</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 font-medium text-white no-underline hover:bg-forest-deep"
            >
              Join Early Access
            </Link>
          </div>
          <div className="photo-frame">
            <Image
              src="/photos/hands-eggs.jpg"
              alt="Hands lifting brown eggs from straw"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-16 grid items-center gap-10 md:grid-cols-2">
          <div className="photo-frame md:order-2">
            <Image
              src="/photos/porch-delivery.jpg"
              alt="A plain egg carton on a front-porch mat"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-4xl text-forest">At your door</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">
              When deliveries begin, the stop is your door in Ponte Vedra Beach. Until then, a signup is only a place
              on the list.
            </p>
          </div>
        </div>

        {/* Future founder note and farm photos go in this section. Do not invent them. */}
        <section className="soft-card mt-16 p-8 md:p-10" aria-label="From the farm">
          <h2 className="font-serif text-3xl text-forest">From the farm</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/75">
            A note from the people who run the farm, and photos of the place itself, will be added here when we have
            them.
          </p>
        </section>
      </div>
      <EarlyAccessBand />
    </>
  );
}
