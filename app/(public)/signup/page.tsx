import { connection } from "next/server";
import { SignupForm } from "@/app/(public)/signup/signup-form";
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
    <div className="mx-auto max-w-lg px-5 pt-8">
      <p className="text-sm font-semibold text-sunrise">{greenlit ? "Order" : "Waitlist"}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-forest-deep">
        {greenlit ? "Reserve a delivery" : "Tell us you want eggs"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
        {greenlit
          ? "Payment is by card through Stripe. Your phone number is how we reach you about the drop-off. We never see the card."
          : `Hens start laying in ${LAYING_START}. Until the farm is greenlit, this is interest only. It does not reserve a carton.`}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed">
        Current delivery area: <strong>Ponte Vedra Beach</strong>. Regular Ponte Vedra is undecided. We still take the
        address.
      </p>
      <div className="mt-8">
        <SignupForm
          greenlit={greenlit}
          paymentsReady={paymentsConfigured()}
          days={farm.capacity()}
          canceled={one(params.payment) === "canceled"}
        />
      </div>
    </div>
  );
}
