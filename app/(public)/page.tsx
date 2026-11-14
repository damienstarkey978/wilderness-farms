import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { EarlyAccessBand } from "@/components/early-access-band";
import { LAYING_START } from "@/lib/constants";
import { getFarm } from "@/lib/db";

const steps = [
  {
    title: "Join the List",
    body: "Be the first to know when we're ready.",
    image: "/photos/hands-eggs.jpg",
    alt: "Hands lifting brown eggs from straw",
  },
  {
    title: "Choose Your Eggs",
    body: "Order a dozen of our fresh, local eggs.",
    image: "/photos/hero-carton.jpg",
    alt: "Brown and cream eggs in an open carton",
  },
  {
    title: "Enjoy Farm Fresh Delivery",
    body: "We'll deliver your eggs straight to your door.",
    image: "/photos/porch-delivery.jpg",
    alt: "A plain egg carton on a front-porch mat",
  },
];

const cards = [
  {
    title: "Locally Raised",
    body: "Eggs from our small farm in Ponte Vedra Beach, for neighbors close by.",
  },
  {
    title: "Delivered to Your Door",
    body: "A dozen brought to your doorstep, Monday through Saturday.",
  },
  {
    title: "Simple and Fresh",
    body: "One price, $10 per dozen. Joining the list is free.",
  },
];

export default async function HomePage() {
  await connection();
  const ordering = getFarm().getGreenlit();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Wilderness Farms",
    description:
      "Fresh, locally raised eggs for Ponte Vedra Beach. Deliveries expected March 2027. $10 per dozen.",
    areaServed: "Ponte Vedra Beach, FL",
    priceRange: "$10",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="md:hidden">
        <div className="px-5 pt-8">
          <Image
            src="/logo.webp"
            alt="Wilderness Farms"
            width={760}
            height={695}
            priority
            className="mx-auto h-auto w-[17.5rem]"
          />
          <p className="mt-6 text-center text-xs font-medium tracking-[0.18em] text-sage uppercase">Ponte Vedra Beach</p>
          <h1 className="mt-3 font-serif text-[2.65rem] leading-[1.05] text-forest">
            Farm Fresh Eggs. Delivered to Your Door.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            Fresh eggs from our small farm, brought to your door. $10 a dozen.
          </p>
        </div>
        <Image
          src="/photos/hero-carton.jpg"
          alt="Brown and cream eggs in an open carton on a wooden table"
          width={1200}
          height={900}
          priority
          className="mt-5 aspect-[16/10] w-full object-cover"
        />
        <div className="grid grid-cols-2 gap-3 px-5 pt-5">
          <div className="rounded-2xl bg-white px-4 py-3">
            <p className="text-xs text-sage">Price</p>
            <p className="font-serif text-2xl text-forest">$10</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3">
            <p className="text-xs text-sage">First eggs</p>
            <p className="font-serif text-2xl text-forest">{LAYING_START}</p>
          </div>
        </div>
        <div className="px-5 pt-5">
          <Link
            href="/signup"
            className="flex h-12 w-full items-center justify-center rounded-full bg-forest text-base font-medium text-white no-underline"
          >
            {ordering ? "Order eggs" : "Join"}
          </Link>
        </div>
      </section>
      <div className="hidden md:block">
      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:px-8 md:py-24">
        <div className="rise">
          <p className="text-xs font-medium tracking-[0.18em] text-sage uppercase">
            Locally raised in Ponte Vedra Beach, FL
          </p>
          <h1 className="mt-4 font-serif text-[3.1rem] leading-[1.05] text-forest md:text-7xl">
            Farm Fresh Eggs. Delivered to Your Door.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
            Fresh, locally raised eggs from our small family farm, delivered straight to your doorstep.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-base font-medium text-white no-underline hover:bg-forest-deep"
            >
              {ordering ? "Order eggs" : "Join the Early Access List"}
            </Link>
            <Link href="/our-farm" className="inline-flex h-12 items-center justify-center px-3 text-base text-forest no-underline">
              Discover Our Farm →
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink/70">
            Launching {LAYING_START} <span className="px-2 text-gold">|</span> $10 per dozen{" "}
            <span className="px-2 text-gold">|</span> Local delivery
          </p>
        </div>
        <div className="photo-frame rise">
          <Image
            src="/photos/hero-carton.jpg"
            alt="Brown and cream eggs in an open carton on a wooden table"
            width={1200}
            height={900}
            priority
            className="h-auto w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-28">
        <div>
          <h2 className="font-serif text-4xl leading-tight text-forest md:text-5xl">Better Mornings Start at the Farm.</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
            There&apos;s something special about knowing where your food comes from. At Wilderness Farms, we&apos;re
            bringing fresh eggs and a little piece of farm life straight to our neighbors in Ponte Vedra Beach.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <article key={card.title} className="soft-card p-5">
                <h3 className="font-serif text-2xl text-forest">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="photo-frame">
          <Image
            src="/photos/breakfast.jpg"
            alt="Scrambled eggs, toast, and berries on a plate"
            width={1200}
            height={900}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-28">
          <h2 className="text-center font-serif text-4xl text-forest md:text-5xl">Fresh Eggs in Three Simple Steps.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="step-card overflow-hidden">
                <div className="relative">
                  <Image src={step.image} alt={step.alt} width={900} height={680} className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-forest">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-ink/70">
            This is the plan, not a booking. Ordering isn&apos;t open yet, and joining the list does not reserve eggs.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-28">
        <div className="photo-frame">
          <Image
            src="/photos/hero-carton.jpg"
            alt="A carton of brown and cream eggs"
            width={1200}
            height={900}
            className="h-auto w-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-sage uppercase">Good eggs</p>
          <h2 className="mt-3 font-serif text-4xl text-forest md:text-5xl">Simple Pricing.</h2>
          <p className="mt-5 font-serif text-3xl text-forest">One Dozen Farm Fresh Eggs</p>
          <p className="mt-2 text-4xl text-forest">$10 per dozen</p>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/80">
            Fresh local eggs, conveniently delivered to your home.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 font-medium text-white no-underline hover:bg-forest-deep"
          >
            Join Early Access
          </Link>
          <p className="mt-3 text-sm text-ink/70">Free to join. No payment required.</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-28">
          <div className="photo-frame md:order-2">
            <Image
              src="/photos/hens.jpg"
              alt="Brown hens walking on grass"
              width={1200}
              height={900}
              className="aspect-[4/3] h-auto w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-4xl leading-tight text-forest md:text-5xl">Small Farm. Big Love for Good Food.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/80">
              Wilderness Farms is a small farm in Ponte Vedra Beach. We&apos;re getting ready for first eggs in{" "}
              {LAYING_START}, then a short drive to your door, Monday through Saturday, at $10 a dozen.
            </p>
            <Link href="/our-farm" className="mt-6 inline-flex h-12 items-center text-forest no-underline">
              Discover Our Farm →
            </Link>
          </div>
        </div>
      </section>

      <EarlyAccessBand />
      </div>
    </>
  );
}
