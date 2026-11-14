import Link from "next/link";
import { connection } from "next/server";
import { formatDollars, WEEKDAY_LABEL, isWeekday } from "@/lib/constants";
import { getFarm, type Signup } from "@/lib/db";
import { reservationSentence, settleCheckout } from "@/lib/orders";
import { customerArrival, showsDelivered } from "@/lib/route";

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
  const arrival = signup ? customerArrival(farm, signup) : null;

  return (
    <div className="mx-auto max-w-lg px-5 pt-10">
      {signup && arrival === "on_the_way" ? (
        <>
          <p className="text-sm font-semibold text-sunrise">On the way</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-forest-deep">On the way, {signup.name}.</h1>
          <p className="mt-3 text-[15px] leading-relaxed">Your stop has started. Nothing new was charged.</p>
        </>
      ) : signup && arrival === "arrived" ? (
        <>
          <p className="text-sm font-semibold text-sunrise">Arrived</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-forest-deep">Arrived, {signup.name}.</h1>
          <p className="mt-3 text-[15px] leading-relaxed">The delivery is at your door. Nothing new was charged.</p>
        </>
      ) : signup && delivered ? (
        <>
          <p className="text-sm font-semibold text-sunrise">Delivered</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-forest-deep">Delivered, {signup.name}.</h1>
          <p className="mt-3 text-[15px] leading-relaxed">
            {signup.status === "fulfilled"
              ? "This order is delivered."
              : `Delivered${deliveredOn ? ` on ${deliveredOn}` : ""}. ${reservationSentence(signup)}`}
          </p>
        </>
      ) : signup ? (
        <>
          <p className="text-sm font-semibold text-sunrise">Reserved</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-forest-deep">
            You&apos;re on the truck, {signup.name}.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed">{reservationSentence(signup)}</p>
          <p className="mt-2 text-[15px]">
            {formatDollars(signup.amountCents ?? 0)} paid
            {isWeekday(signup.weekday) ? ` for ${WEEKDAY_LABEL[signup.weekday]}` : ""}. Stripe marked the card
            payment as paid.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-semibold tracking-tight text-forest-deep">No reservation yet</h1>
          <p className="mt-3 text-[15px] leading-relaxed" role="alert">
            {error}
          </p>
        </>
      )}
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-forest px-5 text-sm font-semibold text-cream no-underline"
      >
        Back to the farm
      </Link>
    </div>
  );
}
