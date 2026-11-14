import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cancelSignup, fulfillSignup, logout, setGreenlit } from "@/app/actions";
import { CapacityBoard } from "@/components/capacity-board";
import { ADMIN_COOKIE, WEEKDAY_LABEL, formatDollars, isWeekday } from "@/lib/constants";
import { adminCookieValid } from "@/lib/auth";
import { getFarm, type Signup } from "@/lib/db";
import { showsDelivered } from "@/lib/route";

export const metadata = { title: "Farm desk", robots: { index: false, follow: false } };

function flagLabel(signup: Signup): string {
  if (signup.addressFlag === "in_area") return "Ponte Vedra Beach";
  if (signup.addressFlag === "nearby_undecided") return "Flagged · Ponte Vedra";
  return "Flagged · outside";
}

export default async function AdminPage() {
  await connection();
  const jar = await cookies();
  if (!adminCookieValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  const farm = getFarm();
  const greenlit = farm.getGreenlit();
  const signups = farm.listSignups();
  const delivered = farm.latestDeliveries();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-moss">Farm desk</p>
          <h1 className="display text-4xl text-forest-deep">{greenlit ? "Orders are open" : "Waitlist only"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href="/staff/route">
            Today&apos;s route
          </Link>
          <Link className="btn quiet" href="/staff">
            Staff desk
          </Link>
          <form action={logout}>
            <button className="btn quiet" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="paper flex flex-wrap items-center justify-between gap-4 px-5 py-5">
        <p className="max-w-xl leading-relaxed">
          {greenlit
            ? "The public site is taking orders. Card payment still needs STRIPE_SECRET_KEY. Without it, nothing is charged."
            : "The public site is a waitlist. A signup is interest, not a reserved carton. Hens are expected in March 2027."}
        </p>
        <form action={setGreenlit}>
          <input type="hidden" name="greenlit" value={greenlit ? "0" : "1"} />
          <button className="btn sunrise" type="submit">
            {greenlit ? "Back to the waitlist" : "Greenlight the farm"}
          </button>
        </form>
      </section>

      <CapacityBoard days={farm.capacity()} />

      <section className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-3xl text-forest-deep">Signups</h2>
        <a className="btn" href="/api/admin/export">
          Export emails
        </a>
      </section>

      {signups.length === 0 ? (
        <p className="paper px-5 py-6">Nobody is on the list yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-moss">
              <tr>
                <th className="px-3">Who</th>
                <th className="px-3">Ask</th>
                <th className="px-3">Status</th>
                <th className="px-3">Address</th>
                <th className="px-3"> </th>
              </tr>
            </thead>
            <tbody>
              {signups.map((signup) => (
                <tr key={signup.id} className="bg-paper align-top">
                  <td className="rounded-l-xl px-3 py-3">
                    <p className="font-extrabold">{signup.name}</p>
                    <p>{signup.email}</p>
                    <p>{signup.phone}</p>
                  </td>
                  <td className="px-3 py-3">
                    {signup.dozens > 0 ? `${signup.dozens} dozen` : "Dozens not estimated"}
                    {" · "}
                    {isWeekday(signup.weekday) ? WEEKDAY_LABEL[signup.weekday] : "Day not chosen"}
                    <br />
                    {signup.cadence === "weekly" ? "Weekly" : signup.cadence === "one_time" ? "One time" : "Cadence not chosen"}
                    {signup.amountCents != null ? ` · ${formatDollars(signup.amountCents)}` : ""}
                    {signup.zip ? (
                      <>
                        <br />
                        ZIP {signup.zip}
                      </>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    {signup.kind === "waitlist" ? (
                      "Interest"
                    ) : showsDelivered(signup, delivered.get(signup.id) ?? null) ? (
                      <>
                        Delivered
                        {signup.cadence === "weekly" && signup.status === "confirmed" ? (
                          <span className="mt-1 block text-moss">Weekly order still on</span>
                        ) : null}
                      </>
                    ) : (
                      signup.status.replaceAll("_", " ")
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className={signup.addressFlag === "in_area" ? "text-forest" : "font-bold text-bark"}>
                      {flagLabel(signup)}
                    </p>
                    <p>{signup.address}</p>
                  </td>
                  <td className="rounded-r-xl px-3 py-3">
                    {signup.kind === "order" && (signup.status === "confirmed" || signup.status === "pending_payment") ? (
                      <div className="flex flex-col gap-2">
                        <form action={cancelSignup}>
                          <input type="hidden" name="id" value={signup.id} />
                          <button className="btn quiet" type="submit">
                            Cancel
                          </button>
                        </form>
                        {signup.cadence === "one_time" && signup.status === "confirmed" ? (
                          <form action={fulfillSignup}>
                            <input type="hidden" name="id" value={signup.id} />
                            <button className="btn" type="submit">
                              Mark delivered
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
