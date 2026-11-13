import type { CapacityDay } from "@/lib/db";

export function CapacityBoard({ days, variant = "desk" }: { days: CapacityDay[]; variant?: "desk" | "app" }) {
  if (variant === "app") {
    return (
      <section aria-labelledby="capacity-heading">
        <h2 id="capacity-heading" className="text-lg font-semibold tracking-tight text-forest-deep">
          Dozen left
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-moss">
          Monday includes Sunday&apos;s lay, so the promise is 50. Every other delivery day is 25. Weekly orders and
          one-time orders both count. A waitlist signup does not.
        </p>
        <ol className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => (
            <li
              key={day.weekday}
              className="min-w-[7.25rem] shrink-0 rounded-2xl bg-paper px-3 py-3"
            >
              <p className="text-[11px] font-medium text-moss">{day.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-forest">
                {day.remaining === 0 ? "Full" : day.remaining}
              </p>
              <p className="mt-1 text-xs text-ink/70">
                {day.remaining === 0 ? "0" : day.remaining} of {day.cap}
              </p>
              {day.weekday === "mon" ? <p className="mt-2 text-[11px] text-bark">Includes Sunday&apos;s eggs.</p> : null}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section aria-labelledby="capacity-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="capacity-heading" className="display text-3xl text-forest-deep">
          Dozen left
        </h2>
        <p className="max-w-md text-sm text-moss">
          Monday includes Sunday&apos;s lay, so the promise is 50. Every other delivery day is 25. Weekly
          orders and one-time orders both count. A waitlist signup does not.
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {days.map((day) => (
          <li key={day.weekday} className={`day-card ${day.weekday === "mon" ? "monday col-span-2 md:col-span-1" : ""}`}>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-moss">{day.label}</p>
            <p className="display mt-1 text-4xl leading-none text-forest">
              {day.remaining === 0 ? "Full" : day.remaining}
            </p>
            <p className="mt-1 text-sm">
              {day.remaining === 0 ? "0" : day.remaining} dozen left of {day.cap}
            </p>
            {day.weekday === "mon" ? (
              <p className="mt-2 text-xs text-bark">Includes Sunday&apos;s eggs.</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
