import { connection } from "next/server";
import { SignupForm } from "@/app/(public)/signup/signup-form";
import { LAYING_START } from "@/lib/constants";
import { getFarm } from "@/lib/db";
import { paymentsConfigured } from "@/lib/stripe";

export const metadata = { title: "Join Early Access" };

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
    <div className="md:mx-auto md:grid md:max-w-[1100px] md:grid-cols-[0.9fr_1.1fr] md:items-start md:gap-12 md:px-8 md:py-24">
      <div className="hidden md:block">
        <p className="text-xs font-medium tracking-[0.18em] text-sage uppercase">
          {greenlit ? "Orders" : "Early access"}
        </p>
        <h1 className="mt-3 font-serif text-5xl leading-[1.08] text-forest md:text-6xl">
          {greenlit ? "Order eggs" : "Be First in Line for Fresh Eggs."}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink/80">
          {greenlit
            ? "Choose a day, Monday through Saturday, and pay by card. Nothing is charged unless Stripe confirms the payment."
            : `Name, email, and ZIP are enough to join. First eggs are expected ${LAYING_START}. Joining is free and does not reserve eggs.`}
        </p>
      </div>
      <div className="px-3 pt-3 md:p-0">
        <div className="rounded-[28px] bg-white px-5 pt-3 pb-6 shadow-[0_16px_40px_rgb(37_42_36_/_8%)] md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-beige md:hidden" aria-hidden="true" />
          <h1 className="font-serif text-[2rem] leading-tight text-forest md:hidden">
            {greenlit ? "Order eggs" : "Be First in Line for Fresh Eggs."}
          </h1>
          <p className="mt-2 mb-5 text-base leading-relaxed text-ink/75 md:hidden">
            {greenlit
              ? "Monday through Saturday. Nothing is charged unless the card payment goes through."
              : `Name, email, and ZIP. Free to join. First eggs expected ${LAYING_START}.`}
          </p>
          <SignupForm
            greenlit={greenlit}
            paymentsReady={paymentsConfigured()}
            days={farm.capacity()}
            canceled={one(params.payment) === "canceled"}
          />
        </div>
      </div>
    </div>
  );
}
