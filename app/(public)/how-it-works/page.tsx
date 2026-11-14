import type { Metadata } from "next";
import Image from "next/image";
import { EarlyAccessBand } from "@/components/early-access-band";
import { LAYING_START } from "@/lib/constants";

export const metadata: Metadata = { title: "How It Works" };

const steps = [
  {
    title: "Choose your eggs",
    body: "A dozen is $10. When ordering opens, tell us how many you want. Until then, an estimate on the list does not hold eggs.",
    image: "/photos/hero-carton.jpg",
    alt: "Brown and cream eggs in an open carton",
  },
  {
    title: "Select a delivery day",
    body: "Delivery days are Monday through Saturday. We do not deliver on Sunday. A preferred day on the waitlist is a note, not a reservation.",
    image: "/photos/hands-eggs.jpg",
    alt: "Hands lifting brown eggs from straw",
  },
  {
    title: "Receive them at home",
    body: "We bring the eggs to your door in Ponte Vedra Beach. This is the plan for when deliveries begin.",
    image: "/photos/porch-delivery.jpg",
    alt: "A plain egg carton waiting on a front porch",
  },
];

const facts = [
  ["Area", "Ponte Vedra Beach"],
  ["Days", "Monday–Saturday"],
  ["Sunday", "No delivery"],
  ["Price", "$10 per dozen"],
  ["First eggs", LAYING_START],
];

export default function HowItWorksPage() {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-medium tracking-[0.18em] text-sage uppercase">The plan</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.08] text-forest md:text-6xl">
          Fresh Eggs, Delivered Simply.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/80">
          When deliveries begin, you choose your eggs, pick a day, and we bring them to your door in Ponte Vedra
          Beach. While the list is open, these steps are planned operations, not bookable inventory.
        </p>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {facts.map(([label, value]) => (
            <div key={label} className="soft-card px-5 py-4">
              <dt className="text-xs tracking-[0.14em] text-sage uppercase">{label}</dt>
              <dd className="mt-2 font-serif text-2xl text-forest">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="step-card overflow-hidden">
              <div className="relative">
                <Image src={step.image} alt={step.alt} width={900} height={680} className="aspect-[4/3] w-full object-cover" />
                <span className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm text-white">
                  {index + 1}
                </span>
              </div>
              <div className="p-6">
                <h2 className="font-serif text-2xl text-forest">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <EarlyAccessBand />
    </>
  );
}
