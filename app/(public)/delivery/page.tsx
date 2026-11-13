import Link from "next/link";
import { connection } from "next/server";
import { CapacityBoard } from "@/components/capacity-board";
import { LAYING_START } from "@/lib/constants";
import { getFarm } from "@/lib/db";

export const metadata = {
  title: "How delivery works",
};

export default async function DeliveryPage() {
  await connection();
  const farm = getFarm();
  const steps = [
    ["Tell us the day", "Monday through Saturday, how many dozen, and whether you want that day every week or once."],
    ["We check the truck", "If your dozen would go past what's left that weekday, we refuse it and say what's left."],
    [
      "Interest, then payment",
      `Until ${LAYING_START}, and until the farm is greenlit, we only keep your interest. After that, Stripe takes the card payment.`,
    ],
  ];

  return (
    <>
      <div className="mx-auto flex max-w-lg flex-col gap-10 px-5 pt-8">
        <header>
          <p className="text-sm font-semibold text-sunrise">Delivery</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-forest-deep">How the eggs get to you</h1>
        </header>

        <div className="space-y-5 text-[15px] leading-relaxed">
          <p>
            The hens lay about 300 eggs a day. That&apos;s about 25 dozen, seven days a week. We deliver six days:
            Monday through Saturday. Never Sunday.
          </p>
          <p>
            Sunday&apos;s lay rolls onto Monday&apos;s truck. So the promise is 50 dozen on Monday, and 25 dozen each
            day Tuesday through Saturday. If a day is full, that day is full. We won&apos;t stack an extra dozen on
            top of it.
          </p>
          <p>
            A weekly order holds its weekday every week until you cancel it. A one-time order counts against that same
            weekday until the drop-off is marked delivered. Both kinds of order draw from the same cap.
          </p>
          <p>
            Before the farm is greenlit, the form is a waitlist. A signup means you want eggs. It does not reserve a
            carton. The hens are not laying until {LAYING_START}.
          </p>
          <p>
            After the farm is greenlit, the same choices become an order and you pay by card. $10 a dozen. If card
            payments aren&apos;t set up, the page says so. We will not invent a charge.
          </p>
          <p>
            We deliver in Ponte Vedra Beach right now. Regular Ponte Vedra is not decided. Put your address in anyway.
            If it looks outside Ponte Vedra Beach, we keep it and flag it. We don&apos;t turn the form away for the
            address.
          </p>
        </div>

        <CapacityBoard days={farm.capacity()} variant="app" />

        <ol className="grid gap-5">
          {steps.map(([title, body], index) => (
            <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
              <span className="text-lg font-semibold text-sunrise">{index + 1}</span>
              <span>
                <span className="block text-lg font-semibold tracking-tight text-forest-deep">{title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-2xl bg-sunrise text-sm font-semibold text-ink no-underline"
          >
            {farm.getGreenlit() ? "Order eggs" : "Get on the list"}
          </Link>
        </div>
      </div>
    </>
  );
}
