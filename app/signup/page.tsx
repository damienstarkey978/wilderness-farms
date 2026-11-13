import { connection } from "next/server";
import { SignupForm } from "@/app/signup/signup-form";
import { LAYING_START } from "@/lib/constants";
import { getFarm } from "@/lib/db";
import { paymentsConfigured } from "@/lib/stripe";

export const metadata = { title: "Eggs" };

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SignupPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await props.searchParams;
  const farm = getFarm();
  const greenlit = farm.getGreenlit();
  if (one(params.payment) === "canceled") {
    const hold = one(params.hold);
    if (hold) farm.releasePending(hold);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:grid-cols-[0.8fr_1.2fr] md:py-14">
      <aside className="space-y-4">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-moss">
          {greenlit ? "Order" : "Waitlist"}
        </p>
        <h1 className="display text-5xl leading-none text-forest-deep">
          {greenlit ? "Reserve a delivery." : "Tell us you want eggs."}
        </h1>
        <p className="text-lg leading-relaxed">
          {greenlit
            ? "Payment is by card through Stripe. Your phone number is how we reach you about the drop-off. We never see the card."
            : `Hens start laying in ${LAYING_START}. Until the farm is greenlit, this is interest only. It does not reserve a carton.`}
        </p>
        <p className="leading-relaxed">
          Current delivery area: <strong>Ponte Vedra Beach</strong>. Regular Ponte Vedra is undecided. We still
          take the address.
        </p>
      </aside>
      <SignupForm
        greenlit={greenlit}
        paymentsReady={paymentsConfigured()}
        days={farm.capacity()}
        canceled={one(params.payment) === "canceled"}
      />
    </div>
  );
}
