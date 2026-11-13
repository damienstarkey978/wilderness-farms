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
  const action = greenlit ? "Order eggs" : "Say you want eggs";

  return (
    <>
      <section className="bg-forest text-cream">
        <div className="mx-auto flex max-w-lg flex-col items-center px-5 pb-16 pt-8 text-center">
          <Image
            src="/logo.webp"
            alt="Wilderness Farms"
            width={320}
            height={320}
            priority
            className="h-44 w-44 rounded-3xl bg-cream object-cover shadow-lg"
          />
          <p className="mt-5 text-sm font-medium text-yolk">{greenlit ? "Orders open" : "Waitlist"}</p>
          <h1 className="mt-2 text-[2.65rem] font-semibold leading-[1.02] tracking-tight">Eggs at the door</h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-cream/80">
            A small flock, a short drive, and a dozen set on the porch. Monday through Saturday. We don&apos;t
            drive on Sunday.
          </p>
          <p className="mt-8 text-5xl font-semibold tracking-tight text-yolk">$10</p>
          <p className="mt-1 text-sm text-cream/70">a dozen</p>
        </div>
      </section>

      <section className="-mt-6 rounded-t-[28px] bg-cream px-5 pt-7">
        <div className="mx-auto flex max-w-lg flex-col gap-8">
          <p className="rounded-2xl bg-paper px-4 py-3 text-[15px] leading-relaxed">
            {greenlit && payments ? (
              <>
                <strong>Orders are open.</strong> Choose a day, Monday through Saturday, and pay by card. A weekly
                order holds that weekday until you cancel it. A one-time order uses the day once.
              </>
            ) : null}
            {greenlit && !payments ? (
              <>
                <strong>Payments are not configured.</strong> The farm is marked open, but we can&apos;t take a card
                yet. Nothing will be charged, and no dozen will be reserved.
              </>
            ) : null}
            {!greenlit ? (
              <>
                <strong>The list is open. Orders are not.</strong> Tell us you want eggs. We will keep your name. We
                will not hold a carton for you, and we will not charge you. The hens are not laying until {LAYING_START}.
              </>
            ) : null}
          </p>

          <dl className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-paper px-3 py-3">
              <dt className="text-[11px] font-medium text-moss">Price</dt>
              <dd className="mt-1 text-sm font-semibold text-forest-deep">$10 a dozen</dd>
            </div>
            <div className="rounded-2xl bg-paper px-3 py-3">
              <dt className="text-[11px] font-medium text-moss">First eggs</dt>
              <dd className="mt-1 text-sm font-semibold text-forest-deep">{LAYING_START}</dd>
            </div>
            <div className="rounded-2xl bg-paper px-3 py-3">
              <dt className="text-[11px] font-medium text-moss">Route</dt>
              <dd className="mt-1 text-sm font-semibold text-forest-deep">Ponte Vedra Beach</dd>
            </div>
          </dl>

          <CapacityBoard days={farm.capacity()} variant="app" />

          <p className="text-[15px] leading-relaxed text-ink/80">
            Organic eggs from a small flock in Ponte Vedra Beach. Until an admin marks the farm greenlit, a signup is
            interest only. It does not reserve a carton, and it is not a payment.
          </p>
          <Link href="/delivery" className="text-sm font-semibold text-forest no-underline">
            How delivery works
          </Link>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-moss">Ponte Vedra Beach</p>
            <p className="text-sm font-semibold">$10 a dozen</p>
          </div>
          <Link
            href="/signup"
            className="ml-auto inline-flex h-12 items-center justify-center rounded-2xl bg-sunrise px-5 text-sm font-semibold text-ink no-underline"
          >
            {action}
          </Link>
        </div>
      </div>
    </>
  );
}
