import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { CapacityBoard } from "@/components/capacity-board";
import { LAYING_START } from "@/lib/constants";
import { getFarm } from "@/lib/db";
import { paymentsConfigured } from "@/lib/stripe";

export default async function HomePage() {
  await connection();
  const farm = getFarm();
  const greenlit = farm.getGreenlit();
  const payments = paymentsConfigured();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-5 py-10 md:py-14">
      <section className="grid items-center gap-8 md:grid-cols-[minmax(220px,320px)_1fr]">
        <Image
          src="/logo.webp"
          alt="Wilderness Farms. Organic eggs delivered. Ponte Vedra Beach, Florida."
          width={760}
          height={695}
          priority
          className="mx-auto h-auto w-full max-w-xs"
        />
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-moss">Homegrown · to the door</p>
          <h1 className="display mt-2 text-5xl leading-[1.02] text-forest-deep md:text-6xl">
            Eggs at the door.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed">
            Organic eggs from a small flock in Ponte Vedra Beach. A dozen is $10. We deliver Monday through
            Saturday, and we don&apos;t drive on Sunday.
          </p>
          <p className="mt-3 max-w-xl text-lg leading-relaxed">
            The hens are not laying until {LAYING_START}. Until an admin marks the farm greenlit, a signup is
            interest only. It does not reserve a carton, and it is not a payment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="btn sunrise">
              {greenlit ? "Order eggs" : "Say you want eggs"}
            </Link>
            <Link href="/delivery" className="btn quiet">
              How delivery works
            </Link>
          </div>
        </div>
      </section>

      <section
        className={`paper px-5 py-4 text-base leading-relaxed ${greenlit ? "border-l-8 border-l-canopy" : "border-l-8 border-l-sunrise"}`}
      >
        {greenlit && payments ? (
          <p>
            <strong>Orders are open.</strong> Choose a day, Monday through Saturday, and pay by card. A weekly
            order holds that weekday until you cancel it. A one-time order uses the day once.
          </p>
        ) : null}
        {greenlit && !payments ? (
          <p>
            <strong>Payments are not configured.</strong> The farm is marked open, but we can&apos;t take a card
            yet. Nothing will be charged, and no dozen will be reserved.
          </p>
        ) : null}
        {!greenlit ? (
          <p>
            <strong>The list is open. Orders are not.</strong> Tell us you want eggs. We will keep your name.
            We will not hold a carton for you, and we will not charge you.
          </p>
        ) : null}
      </section>

      <CapacityBoard days={farm.capacity()} />

      <section className="grid gap-6 rounded-[24px] bg-forest px-6 py-8 text-cream md:grid-cols-[1.2fr_0.8fr] md:px-8">
        <div>
          <h2 className="display text-3xl text-yolk">Who&apos;s on the farm</h2>
          <p className="mt-3 text-lg leading-relaxed">
            Damien Starkey and Howard, with their sons Gavin and Hollis.
          </p>
          <p className="mt-3 leading-relaxed text-cream/90">
            Howard already has the health certificates, the refrigeration, the flock, and the license to sell
            eggs.
          </p>
        </div>
        <dl className="grid content-start gap-4 text-sm">
          <div>
            <dt className="font-extrabold uppercase tracking-[0.14em] text-yolk">Price</dt>
            <dd className="display mt-1 text-3xl">$10 a dozen</dd>
          </div>
          <div>
            <dt className="font-extrabold uppercase tracking-[0.14em] text-yolk">First eggs</dt>
            <dd className="mt-1 text-lg">{LAYING_START}</dd>
          </div>
          <div>
            <dt className="font-extrabold uppercase tracking-[0.14em] text-yolk">Route today</dt>
            <dd className="mt-1 text-lg">Ponte Vedra Beach</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
