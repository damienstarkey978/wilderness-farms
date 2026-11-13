import { getFarm } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }
  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret)) {
    return Response.json({ error: "Bad signature." }, { status: 400 });
  }
  let event: {
    type?: string;
    data?: { object?: { id?: string; payment_status?: string; amount_total?: number } };
  };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return Response.json({ error: "Bad payload." }, { status: 400 });
  }
  const session = event.data?.object;
  if (event.type === "checkout.session.completed" && session?.payment_status === "paid" && session.id) {
    const farm = getFarm();
    const signup = farm.findBySession(session.id);
    if (
      signup?.status === "pending_payment" &&
      session.amount_total != null &&
      session.amount_total === signup.amountCents
    ) {
      farm.markConfirmed(signup.id);
    }
  }
  return Response.json({ received: true });
}
