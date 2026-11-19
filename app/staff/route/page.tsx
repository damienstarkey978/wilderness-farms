import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { arriveDelivery, markDelivered, moveStop, startDelivery, toggleDayTask } from "@/app/actions";
import { STAFF_COOKIE, WEEKDAY_LABEL, isStaffId, staffName } from "@/lib/constants";
import { floridaDate } from "@/lib/dates";
import { DAY_TASKS } from "@/lib/driving";
import { readStaffCookie } from "@/lib/auth";
import { getFarm } from "@/lib/db";
import { buildRoute, customerArrival } from "@/lib/route";

export const metadata: Metadata = { title: "Delivery route", robots: { index: false, follow: false } };

const ARRIVAL_LABEL = {
  on_the_way: "On the way",
  arrived: "Arrived",
  delivered: "Delivered",
} as const;

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function RoutePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const jar = await cookies();
  const staffId = readStaffCookie(jar.get(STAFF_COOKIE)?.value);
  if (!staffId) redirect("/staff/login");

  const params = await props.searchParams;
  const date = one(params.date) || floridaDate();
  const error = one(params.error);
  const farm = getFarm();
  const route = buildRoute(farm, date);
  const checks = new Map(farm.dayTasks(date).map((task) => [task.task, task]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-moss">Staff desk</p>
          <h1 className="font-serif text-4xl text-forest">Today&apos;s work</h1>
          <p className="mt-1 text-sm text-moss">Signed in as {staffName(staffId)}. One shared list for the day.</p>
        </div>
        <Link className="btn quiet" href="/staff">
          Back to the ledger
        </Link>
      </header>

      <form className="rounded-[18px] bg-white shadow-[0_10px_30px_rgb(37_42_36_/_6%)] flex flex-wrap items-end gap-3 px-5 py-5" method="get">
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

      <section className="rounded-[18px] bg-white shadow-[0_10px_30px_rgb(37_42_36_/_6%)] px-5 py-5">
        <h2 className="font-serif text-3xl text-forest">Before deliveries</h2>
        <p className="mt-2 text-sm leading-relaxed text-moss">
          Feed, harvest, and cartons have to be checked before this day&apos;s deliveries can start. A new day starts
          unchecked. Whoever checks a line, the rest of the desk can see it.
        </p>
        <ul className="mt-4 grid gap-3">
          {DAY_TASKS.map((task) => {
            const saved = checks.get(task.id);
            return (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold">{task.label}</p>
                  <p className="text-sm text-moss">
                    {saved && isStaffId(saved.staffId) ? `Checked by ${staffName(saved.staffId)}` : saved ? "Checked" : "Not checked"}
                  </p>
                </div>
                <form action={toggleDayTask}>
                  <input type="hidden" name="date" value={date} />
                  <input type="hidden" name="task" value={task.id} />
                  <input type="hidden" name="checked" value={saved ? "no" : "yes"} />
                  <button className="btn" type="submit">
                    {saved ? "Checked" : "Check"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      {!route.ok ? (
        <p className="rounded-[18px] bg-white shadow-[0_10px_30px_rgb(37_42_36_/_6%)] px-5 py-6">{route.error}</p>
      ) : route.stops.length === 0 ? (
        <p className="rounded-[18px] bg-white shadow-[0_10px_30px_rgb(37_42_36_/_6%)] px-5 py-6">No stops this day.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl text-forest">{WEEKDAY_LABEL[route.weekday]} route</h2>
              <p className="mt-1 text-sm text-moss">Ordered by street, then house number. Move a stop if the day needs a different path.</p>
            </div>
            {route.gpsUrl && route.ready ? (
              <a className="btn sunrise" href={route.gpsUrl} target="_blank" rel="noopener noreferrer">
                Follow on GPS
              </a>
            ) : (
              <p className="text-sm font-extrabold">
                {route.ready ? "Every stop for this day is delivered." : "Checklist first, then Follow on GPS."}
              </p>
            )}
          </div>
          <ol className="grid gap-3">
            {route.stops.map((stop, index) => {
              const arrival = customerArrival(farm, stop.signup);
              const seeing =
                stop.delivered || arrival === "delivered"
                  ? "Delivered"
                  : stop.progress
                    ? ARRIVAL_LABEL[stop.progress]
                    : null;
              const next = route.stops.find((item) => !item.delivered);
              return (
                <li key={stop.signup.id} className="rounded-[18px] bg-white shadow-[0_10px_30px_rgb(37_42_36_/_6%)] px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-moss">
                        Stop {index + 1}
                        {next?.signup.id === stop.signup.id ? " · Next" : ""}
                        {stop.delivered ? " · Delivered" : ""}
                      </p>
                      <p className="mt-1 text-xl font-extrabold">{stop.signup.name}</p>
                      <p>
                        {stop.signup.dozens} dozen · {stop.signup.cadence === "weekly" ? "Weekly" : "One time"}
                      </p>
                      <p className="mt-1">{stop.signup.address}</p>
                      <p>{stop.signup.phone}</p>
                      {seeing ? <p className="mt-2 font-extrabold text-forest">Customer sees: {seeing}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2">
                      {stop.delivered ? (
                        <p className="font-extrabold text-forest">Delivered</p>
                      ) : stop.progress === "arrived" ? (
                        <form action={markDelivered}>
                          <input type="hidden" name="id" value={stop.signup.id} />
                          <input type="hidden" name="date" value={route.date} />
                          <button className="btn" type="submit" disabled={!route.ready}>
                            Mark delivered
                          </button>
                        </form>
                      ) : stop.progress === "on_the_way" ? (
                        <form action={arriveDelivery}>
                          <input type="hidden" name="id" value={stop.signup.id} />
                          <input type="hidden" name="date" value={route.date} />
                          <button className="btn" type="submit" disabled={!route.ready}>
                            Mark arrived
                          </button>
                        </form>
                      ) : (
                        <form action={startDelivery}>
                          <input type="hidden" name="id" value={stop.signup.id} />
                          <input type="hidden" name="date" value={route.date} />
                          <button className="btn" type="submit" disabled={!route.ready}>
                            Start stop
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
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
