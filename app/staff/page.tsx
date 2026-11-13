import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { staffLogout } from "@/app/actions";
import { STAFF_COOKIE, formatDollars, staffName } from "@/lib/constants";
import { floridaDate } from "@/lib/dates";
import { readStaffCookie } from "@/lib/auth";
import { getFarm, type LedgerEntry } from "@/lib/db";
import { ledgerTotals } from "@/lib/ledger";
import { CartonForms, MoneyInForm, MoneyOutForm, PayForm } from "./staff-forms";

export const metadata: Metadata = { title: "Staff desk", robots: { index: false, follow: false } };

const CATEGORY_LABEL: Record<LedgerEntry["category"], string> = {
  egg_sales: "Egg sales",
  feed: "Feed",
  cartons: "Cartons",
  gas: "Gas",
  other: "Other",
  pay: "Pay",
};

export default async function StaffPage() {
  await connection();
  const jar = await cookies();
  const staffId = readStaffCookie(jar.get(STAFF_COOKIE)?.value);
  if (!staffId) redirect("/staff/login");

  const farm = getFarm();
  const entries = farm.listLedger();
  const totals = ledgerTotals(entries);
  const today = floridaDate();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-moss">Staff desk</p>
          <h1 className="display text-4xl text-forest-deep">Signed in as {staffName(staffId)}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href={`/staff/route?date=${today}`}>
            Today&apos;s route
          </Link>
          <Link className="btn quiet" href="/admin">
            Farm desk
          </Link>
          <form action={staffLogout}>
            <button className="btn quiet" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="paper px-5 py-5">
        <h2 className="display text-3xl text-forest-deep">Cartons on hand</h2>
        <div className="mt-4">
          <CartonForms count={farm.getCartons()} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="paper px-5 py-5">
          <MoneyInForm />
        </div>
        <div className="paper px-5 py-5">
          <MoneyOutForm />
        </div>
      </section>

      <section className="paper px-5 py-5">
        <PayForm />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-3xl text-forest-deep">Ledger</h2>
          <p className="font-extrabold">
            In {formatDollars(totals.inCents)} · Out {formatDollars(totals.outCents)}
          </p>
        </div>
        {entries.length === 0 ? (
          <p className="paper px-5 py-6">Nothing logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-moss">
                <tr>
                  <th className="px-3">Date</th>
                  <th className="px-3">What</th>
                  <th className="px-3">Amount</th>
                  <th className="px-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="bg-paper align-top">
                    <td className="rounded-l-xl px-3 py-3">{entry.occurredOn}</td>
                    <td className="px-3 py-3">
                      {entry.direction === "in" ? "In" : "Out"} · {CATEGORY_LABEL[entry.category]}
                      {entry.payee ? ` · ${entry.payee === "gavin" ? "Gavin" : "Hollis"}` : ""}
                      {entry.weekStart ? ` · week of ${entry.weekStart}` : ""}
                      <br />
                      <span className="text-moss">{entry.staffName}</span>
                    </td>
                    <td className="px-3 py-3 font-extrabold">
                      {entry.direction === "in" ? "" : "−"}
                      {formatDollars(entry.amountCents)}
                    </td>
                    <td className="rounded-r-xl px-3 py-3">{entry.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
