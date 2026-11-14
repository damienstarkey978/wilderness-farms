import type { Metadata } from "next";
import { EarlyAccessBand } from "@/components/early-access-band";
import { FaqList } from "@/components/faq-list";

export const metadata: Metadata = { title: "FAQ" };

const items = [
  {
    question: "When will eggs be available?",
    answer:
      "First eggs are expected in March 2027. Joining the list does not reserve eggs or guarantee that a dozen will be available.",
  },
  {
    question: "How much is a dozen?",
    answer: "$10 per dozen, delivered in Ponte Vedra Beach.",
  },
  {
    question: "Where do you deliver?",
    answer:
      "Ponte Vedra Beach, Florida, Monday through Saturday. We do not deliver on Sunday. Regular Ponte Vedra is not decided yet.",
  },
  {
    question: "Does it cost anything to join?",
    answer: "No. The early access list is free. No payment is required, and nothing is charged.",
  },
  {
    question: "What happens after I join?",
    answer:
      "We'll be in touch when deliveries are ready to begin. Joining does not place an order and does not hold eggs.",
  },
  {
    question: "Can I share a phone number, address, or delivery day?",
    answer:
      "Yes. Those details are optional on the list. A preferred day, an estimate of dozens, and weekly or one-time are preferences only. They do not book a route.",
  },
  {
    question: "What if my ZIP is outside Ponte Vedra Beach?",
    answer:
      "We'll still keep your signup and flag the ZIP. Delivery outside Ponte Vedra Beach is not confirmed.",
  },
];

export default function FaqPage() {
  return (
    <>
      <div className="mx-auto max-w-[860px] px-5 py-8 md:px-8 md:py-24">
        <p className="text-xs font-medium tracking-[0.18em] text-sage uppercase">Questions</p>
        <h1 className="mt-3 font-serif text-5xl text-forest md:text-6xl">FAQ</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/80">
          Straight answers about the list, the price, and delivery in Ponte Vedra Beach.
        </p>
        <div className="mt-10">
          <FaqList items={items} />
        </div>
      </div>
      <EarlyAccessBand />
    </>
  );
}
