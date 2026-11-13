import Link from "next/link";
import { connection } from "next/server";
import { formatDollars, WEEKDAY_LABEL } from "@/lib/constants";
import { getFarm, type Signup } from "@/lib/db";
import { reservationSentence, settleCheckout } from "@/lib/orders";
import { showsDelivered } from "@/lib/route";

export const metadata = { title: "Payment" };

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SuccessPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const farm = getFarm();
  const sessionId = one((await props.searchParams).session_id);
  const existing = sessionId ? farm.findBySession(sessionId) : null;
  let signup: Signup | null = null;
  let error: string | null = null;
  if (!sessionId) {
    error = "That return link didn't include a payment.";
  } else if (existing && (existing.status === "confirmed" || existing.status === "fulfilled")) {
    signup = existing;
  } else {
    const result = await settleCheckout(farm, sessionId);
    if (result.ok) signup = result.signup;
    else error = result.error;
  }
  const deliveredOn = signup ? farm.latestDeliveryOn(signup.id) : null;
  const delivered = signup ? showsDelivered(signup, deliveredOn) : false;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <section className={`paper px-6 py-7 ${signup ? "border-l-8 border-l-canopy" : "border-l-8 border-l-sunrise"}`}>
        {signup && delivered ? (
          <>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-moss">Delivered</p>
            <h1 className="display mt-2 text-4xl text-forest-deep">Delivered, {signup.name}.</h1>
            <p className="mt-3 text-lg leading-relaxed">
              {signup.status === "fulfilled"
                ? "This order is delivered."
                : `Delivered${deliveredOn ? ` on ${deliveredOn}` : ""}. ${reservationSentence(signup)}`}
            </p>
          </>
        ) : signup ? (
          <>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-moss">Reserved</p>
            <h1 className="display mt-2 text-4xl text-forest-deep">You&apos;re on the truck, {signup.name}.</h1>
            <p className="mt-3 text-lg leading-relaxed">{reservationSentence(signup)}</p>
            <p className="mt-2">
              {formatDollars(signup.amountCents ?? 0)} paid for {WEEKDAY_LABEL[signup.weekday]}. Stripe marked the
              card payment as paid.
            </p>
          </>
        ) : (
          <>
            <h1 className="display text-4xl text-forest-deep">No reservation yet</h1>
            <p className="mt-3 text-lg leading-relaxed" role="alert">
              {error}
            </p>
          </>
        )}
        <p className="mt-6">
          <Link href="/" className="btn">
            Back to the farm
          </Link>
        </p>
      </section>
    </div>
  );
}
