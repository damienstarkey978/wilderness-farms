"use client";

import Link from "next/link";
import { useState } from "react";
import { DAY_TASKS, compareAddresses, followGpsUrl } from "@/lib/driving";

type Cadence = "Weekly" | "One time";

type Person = {
  id: string;
  name: string;
  address: string;
  phone: string;
  dozens: number;
  cadence: Cadence;
  weekday: string;
};

const ROUTE: Person[] = [
  { id: "s1", name: "Sample Sam Shore", address: "101 Sample St, Ponte Vedra Beach, FL 32082", phone: "904-555-0101", dozens: 1, cadence: "Weekly", weekday: "Saturday" },
  { id: "s2", name: "Demo Dana Dune", address: "202 Demo Dr, Ponte Vedra Beach, FL 32082", phone: "904-555-0102", dozens: 2, cadence: "One time", weekday: "Saturday" },
  { id: "s3", name: "Test Tess Tide", address: "303 Test Ln, Ponte Vedra Beach, FL 32082", phone: "904-555-0103", dozens: 1, cadence: "Weekly", weekday: "Saturday" },
  { id: "s4", name: "Fake Finn Foam", address: "404 Fake Ave, Ponte Vedra Beach, FL 32082", phone: "904-555-0104", dozens: 1, cadence: "One time", weekday: "Saturday" },
  { id: "s5", name: "Pretend Pat Pier", address: "505 Pretend Ct, Ponte Vedra Beach, FL 32082", phone: "904-555-0105", dozens: 1, cadence: "Weekly", weekday: "Saturday" },
  { id: "s6", name: "Mock Mo Marsh", address: "606 Mock Way, Ponte Vedra Beach, FL 32082", phone: "904-555-0106", dozens: 2, cadence: "One time", weekday: "Saturday" },
  { id: "s7", name: "Example Evie Egg", address: "707 Example Rd, Ponte Vedra Beach, FL 32082", phone: "904-555-0107", dozens: 1, cadence: "Weekly", weekday: "Saturday" },
  { id: "s8", name: "Placeholder Pip Palm", address: "808 Placeholder Blvd, Ponte Vedra Beach, FL 32082", phone: "904-555-0108", dozens: 1, cadence: "One time", weekday: "Saturday" },
];

const EXTRA_WAITLIST: Person[] = [
  { id: "w1", name: "Sample Sue Shell", address: "12 Sample Ct, Ponte Vedra Beach, FL 32082", phone: "904-555-0191", dozens: 1, cadence: "Weekly", weekday: "Tuesday" },
  { id: "w2", name: "Demo Drew Dock", address: "48 Demo Ln, Ponte Vedra Beach, FL 32082", phone: "904-555-0192", dozens: 1, cadence: "One time", weekday: "Thursday" },
];

type StopStatus = "waiting" | "on_the_way" | "arrived" | "delivered";

const CUSTOMER_SEES: Record<Exclude<StopStatus, "waiting">, string> = {
  on_the_way: "On the way",
  arrived: "Arrived",
  delivered: "Delivered",
};

function Caption({ children }: { children: string }) {
  return <p className="rounded-xl bg-yolk px-3 py-2 text-sm font-semibold text-ink">{children}</p>;
}

export function DemoWalkthrough() {
  const [waitlist, setWaitlist] = useState<Person[]>([...ROUTE, ...EXTRA_WAITLIST]);
  const [name, setName] = useState("Sample New Neighbor");
  const [signed, setSigned] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [checked, setChecked] = useState<Record<string, string>>({});
  const [cartons, setCartons] = useState(36);
  const [stopStatus, setStopStatus] = useState<Record<string, StopStatus>>({});

  const ready = DAY_TASKS.every((task) => checked[task.id]);
  const stops = [...ROUTE].sort((a, b) => compareAddresses(a.address, b.address) || a.name.localeCompare(b.name));
  const nextStop = stops.find((stop) => (stopStatus[stop.id] ?? "waiting") !== "delivered");
  const gps = nextStop ? followGpsUrl(nextStop.address) : null;
  const started = Object.values(stopStatus).some((status) => status && status !== "waiting");
  const saturdayDozen = ROUTE.reduce((sum, stop) => sum + stop.dozens, 0);

  function addSignup() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWaitlist((current) => [
      {
        id: `new-${current.length}`,
        name: trimmed,
        address: "909 Sample Way, Ponte Vedra Beach, FL 32082",
        phone: "904-555-0199",
        dozens: 1,
        cadence: "Weekly",
        weekday: "Saturday",
      },
      ...current,
    ]);
    setSigned(true);
  }

  function toggleTask(id: string) {
    if (started) return;
    setChecked((current) => {
      if (current[id]) {
        if (id === "cartons") setCartons((count) => Math.max(0, count - 12));
        const next = { ...current };
        delete next[id];
        return next;
      }
      if (id === "cartons") setCartons((count) => count + 12);
      return { ...current, [id]: "Gavin" };
    });
  }

  function advance(id: string) {
    if (!ready) return;
    setStopStatus((current) => {
      const status = current[id] ?? "waiting";
      const next = status === "waiting" ? "on_the_way" : status === "on_the_way" ? "arrived" : "delivered";
      return { ...current, [id]: next };
    });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sunrise">Demo</p>
          <h1 className="text-2xl font-semibold tracking-tight text-forest-deep">Sunday walkthrough</h1>
        </div>
        <span className="flex flex-col items-end gap-2 text-sm font-medium">
          <Link href="/" className="text-forest no-underline">
            Back
          </Link>
          <a href="/wilderness-farms-walkthrough.mp4" className="text-forest">
            Watch the video
          </a>
        </span>
      </div>
      <p className="text-sm leading-relaxed text-moss">
        Sample Ponte Vedra Beach names only. Nothing here is a real customer, and no card is charged. Saturday holds{" "}
        {saturdayDozen} dozen of 25.
      </p>

      <section id="signup" className="grid gap-3">
        <Caption>Customer clicks here and signs up.</Caption>
        <h2 className="text-xl font-semibold text-forest-deep">Waitlist</h2>
        <ul className="grid gap-2">
          {waitlist.slice(0, 6).map((person) => (
            <li key={person.id} className="rounded-2xl bg-paper px-3 py-2 text-sm">
              <span className="font-semibold">{person.name}</span>
              <span className="block text-moss">
                {person.weekday} · {person.dozens} dozen · {person.cadence}
              </span>
            </li>
          ))}
        </ul>
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 rounded-xl border border-forest/15 bg-white px-3 text-base font-normal"
          />
        </label>
        <button type="button" onClick={addSignup} className="h-12 rounded-2xl bg-sunrise text-sm font-semibold text-ink">
          Put me on the list
        </button>
        {signed ? <p className="text-sm text-forest">Saved as interest. Nothing was charged.</p> : null}
      </section>

      <section id="order" className="grid gap-3">
        <Caption>When eggs are greenlit, they order here.</Caption>
        <h2 className="text-xl font-semibold text-forest-deep">Greenlit order</h2>
        <p className="text-sm leading-relaxed">
          The real site stays a waitlist until someone marks the farm greenlit. This button only previews that order
          screen.
        </p>
        <button
          type="button"
          onClick={() => setShowOrder(true)}
          className="h-12 rounded-2xl bg-forest text-sm font-semibold text-cream"
        >
          Show the order screen
        </button>
        {showOrder ? (
          <div className="grid gap-3 rounded-2xl bg-paper p-4">
            <p className="text-sm">Saturday · 1 dozen · $10. Sample Sam Shore is already a stop.</p>
            <p className="text-sm font-semibold">Payments are not configured. Nothing will be charged.</p>
            <button
              type="button"
              onClick={() => setOrdered(true)}
              className="h-12 rounded-2xl bg-sunrise text-sm font-semibold text-ink"
            >
              Place sample order
            </button>
            {ordered ? <p className="text-sm text-forest">Sample order noted. No Stripe charge.</p> : null}
          </div>
        ) : null}
      </section>

      <section id="flock" className="grid gap-3">
        <Caption>One shared checklist. Deliveries stay closed until every line is checked.</Caption>
        <h2 className="text-xl font-semibold text-forest-deep">Before deliveries</h2>
        <p className="text-sm leading-relaxed">A new day starts unchecked. Gavin and Hollis both see the same checks.</p>
        {DAY_TASKS.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggleTask(task.id)}
            className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-paper px-3 py-3 text-left text-sm"
          >
            <span>
              <span className="block font-semibold">{task.label}</span>
              <span className="text-moss">{checked[task.id] ? `Checked by ${checked[task.id]}. Hollis sees it too.` : "Not checked"}</span>
            </span>
            <span className="font-semibold">{checked[task.id] ? "Checked" : "Check"}</span>
          </button>
        ))}
        <p className="text-sm font-semibold">Cartons on hand: {cartons}</p>
      </section>

      <section id="inventory" className="grid gap-3">
        <Caption>Inventory and cartons.</Caption>
        <h2 className="text-xl font-semibold text-forest-deep">Inventory</h2>
        <p className="text-sm">Cartons on hand: {cartons}</p>
        <ul className="grid gap-2 text-sm">
          <li className="rounded-2xl bg-paper px-3 py-2">Out · Feed · $42.00 · Sample feed sack</li>
          <li className="rounded-2xl bg-paper px-3 py-2">Out · Cartons · $18.00 · Sample carton bundle</li>
          <li className="rounded-2xl bg-paper px-3 py-2">Out · Gas · $15.00 · Sample Saturday gas</li>
        </ul>
        <h3 className="text-lg font-semibold">Weekly cash check</h3>
        <ul className="grid gap-2 text-sm">
          <li className="rounded-2xl bg-paper px-3 py-2">Gavin · $40.00 sample</li>
          <li className="rounded-2xl bg-paper px-3 py-2">Hollis · $40.00 sample</li>
        </ul>
      </section>

      <section id="route" className="grid gap-3">
        <Caption>The day’s stops, in driving order. Follow on GPS opens the next stop.</Caption>
        <h2 className="text-xl font-semibold text-forest-deep">Saturday route</h2>
        <p className="text-sm leading-relaxed">
          Same eight sample stops, ordered by street and house number. These street names are fake, so Maps may not
          find them. The list is still here.
        </p>
        {gps && ready ? (
          <a href={gps} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-2xl bg-sunrise text-sm font-semibold text-ink no-underline">
            Follow on GPS
          </a>
        ) : (
          <p className="text-sm font-semibold">{ready ? "Every sample stop is delivered." : "Checklist first, then Follow on GPS."}</p>
        )}
        <ol className="grid gap-2">
          {stops.map((stop, index) => {
            const status = stopStatus[stop.id] ?? "waiting";
            const action = status === "waiting" ? "Start stop" : status === "on_the_way" ? "Mark arrived" : status === "arrived" ? "Mark delivered" : "";
            return (
              <li key={stop.id} className="rounded-2xl bg-paper px-3 py-3 text-sm">
                <p className="font-semibold">
                  Stop {index + 1}
                  {nextStop?.id === stop.id ? " · Next" : ""}
                  {status === "delivered" ? " · Delivered" : ""}
                </p>
                <p>{stop.name}</p>
                <p className="text-moss">
                  {stop.dozens} dozen · {stop.cadence}
                </p>
                <p>{stop.address}</p>
                {status !== "waiting" ? (
                  <p className="mt-2 font-semibold text-forest">Customer sees: {CUSTOMER_SEES[status]}</p>
                ) : null}
                {action ? (
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => advance(stop.id)}
                    className="mt-2 h-12 rounded-xl bg-forest px-3 text-sm font-semibold text-cream disabled:opacity-50"
                  >
                    {action}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
