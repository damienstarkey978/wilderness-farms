import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { markDelivered, moveStop } from "@/app/actions";
import { STAFF_COOKIE, WEEKDAY_LABEL } from "@/lib/constants";
import { floridaDate } from "@/lib/dates";
import { readStaffCookie } from "@/lib/auth";
import { getFarm } from "@/lib/db";
import { buildRoute } from "@/lib/route";

export const metadata: Metadata = { title: "Delivery route", robots: { index: false, follow: false } };

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function RoutePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const jar = await cookies();
  if (!readStaffCookie(jar.get(STAFF_COOKIE)?.value)) redirect("/staff/login");

  const params = await props.searchParams;
  const date = one(params.date) || floridaDate();
  const error = one(params.error);
  const route = buildRoute(getFarm(), date);
  const stillOut = route.ok ? route.stops.filter((stop) => !stop.delivered) : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-moss">Staff desk</p>
          <h1 className="display text-4xl text-forest-deep">Delivery route</h1>
        </div>
        <Link className="btn quiet" href="/staff">
          Back to the ledger
        </Link>
      </header>

      <form className="paper flex flex-wrap items-end gap-3 px-5 py-5" method="get">
        <label className="field min-w-48 flex-1">
          <span>Delivery day</span>
          <input name="date" type="date" defaultValue={date} required />
        </label>
        <button className="btn" type="submit">
          Show this day
        </button>
      </form>

      {error ? (
        <p className="rounded-xl bg-[#f8e4d4] px-4 py-3 text-bark" role="alert">
          {error}
        </p>
      ) : null}

      {!route.ok ? (
        <p className="paper px-5 py-6">{route.error}</p>
      ) : route.stops.length === 0 ? (
        <p className="paper px-5 py-6">No stops this day.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-3xl text-forest-deep">{WEEKDAY_LABEL[route.weekday]}</h2>
            {route.directionsUrl ? (
              <a className="btn sunrise" href={route.directionsUrl} target="_blank" rel="noopener noreferrer">
                Turn-by-turn directions
              </a>
            ) : (
              <p>Every stop for this day is delivered.</p>
            )}
          </div>
          <ol className="grid gap-3">
            {route.stops.map((stop, index) => (
              <li key={stop.signup.id} className="paper px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-moss">
                      Stop {index + 1}
                      {stop.delivered ? " · Delivered" : ""}
                    </p>
                    <p className="mt-1 text-xl font-extrabold">{stop.signup.name}</p>
                    <p>
                      {stop.signup.dozens} dozen · {stop.signup.cadence === "weekly" ? "Weekly" : "One time"}
                    </p>
                    <p className="mt-1">{stop.signup.address}</p>
                    <p>{stop.signup.phone}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {stop.delivered ? (
                      <p className="font-extrabold text-forest">Delivered</p>
                    ) : (
                      <form action={markDelivered}>
                        <input type="hidden" name="id" value={stop.signup.id} />
                        <input type="hidden" name="date" value={route.date} />
                        <button className="btn" type="submit">
                          Mark delivered
                        </button>
                      </form>
                    )}
                    <div className="flex gap-2">
                      <form action={moveStop}>
                        <input type="hidden" name="id" value={stop.signup.id} />
                        <input type="hidden" name="date" value={route.date} />
                        <input type="hidden" name="direction" value="up" />
                        <button className="btn quiet" type="submit" disabled={index === 0}>
                          Up
                        </button>
                      </form>
                      <form action={moveStop}>
                        <input type="hidden" name="id" value={stop.signup.id} />
                        <input type="hidden" name="date" value={route.date} />
                        <input type="hidden" name="direction" value="down" />
                        <button className="btn quiet" type="submit" disabled={index === route.stops.length - 1}>
                          Down
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {stillOut.length === 0 ? null : (
            <p className="text-sm text-moss">
              Directions follow the stops that are not delivered yet, in this order.
            </p>
          )}
        </>
      )}
    </div>
  );
}
