"use client";

import { useMemo, useState } from "react";
import { controllerFor, KINDS, LABELS } from "@/lib/green-wave/sim/scenario";
import type { Kind } from "@/lib/green-wave/sim/scenario";
import { spadinaSpec } from "@/lib/green-wave/spadina";
import Choice from "@/components/shared/Choice";
import Try from "@/components/shared/Try";
import Diagram from "./Diagram";
import { HOURS, MEASURE, PEAK, runFor, spadina, until, WARMUP } from "./run";
import type { Car } from "./run";

const minutes = (s: number) => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s`;
const times = (n: number) => (n === 0 ? "never stopped" : n === 1 ? "stopped once" : `stopped ${n} times`);

/** Spadina under any controller at any hour, and one car you can follow. */
export default function TimeSpace({ initial = "max-pressure" }: { initial?: Kind }) {
  const [kind, setKind] = useState<Kind>(initial);
  const [hour, setHour] = useState(PEAK);
  const [picked, setPicked] = useState<{ key: string; car: Car } | null>(null);
  const key = `${kind} ${hour}`;
  const run = useMemo(() => {
    const spec = spadinaSpec(spadina, HOURS[hour]);
    return runFor(key, spec, (net) => controllerFor(kind, spec, net));
  }, [key, kind, hour]);
  const bin = HOURS[hour];
  const car = picked?.key === key ? picked.car : null;

  const m = run.metrics.through;
  const fmt = {
    s: (v: number) => `${Math.round(v)}s`,
    n: (v: number) => v.toFixed(1),
    pct: (v: number) => `${Math.round(v * 100)}%`,
  };
  const rows: [string, (v: number) => string, keyof typeof m.northbound][] = [
    ["stops per drive", fmt.n, "stops"],
    ["trip time", fmt.s, "travelTime"],
    ["never stopped", fmt.pct, "band"],
  ];

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="the same picture, with your choice of brain running all eight lights.">
        flip between max-pressure and green wave, then tap any line to ride along with that car.
      </Try>
      <Choice label="controller" options={KINDS} value={kind} onChange={setKind} names={LABELS} />
      <label className="grid max-w-[56ch] grid-cols-[auto_1fr] items-center gap-x-[2ch]">
        <span className="tabular-nums">
          {bin.start}–{until(bin.start)}
        </span>
        <input
          type="range"
          min={0}
          max={HOURS.length - 1}
          step={1}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          aria-label="hour of the day"
          aria-valuetext={`${bin.start} to ${until(bin.start)}`}
        />
      </label>
      <Diagram
        run={run}
        label={`Time-space diagram of Spadina Avenue under ${LABELS[kind]}: each car's path over ten minutes, with each light's colour.`}
        picked={car}
        onPick={(c) => setPicked(c ? { key, car: c } : null)}
      />
      <p aria-live="polite">
        {car?.trip ? (
          <>
            Your car: {car.dir === 1 ? "northbound, Fort York to College" : "southbound, College to Fort York"},{" "}
            <span className="tabular-nums">{minutes(car.trip.seconds)}</span>, {times(car.trip.stops)}.
          </>
        ) : (
          <span className="text-muted">Tap any line to follow that car up (or down) Spadina.</span>
        )}
      </p>
      <table className="w-full max-w-[56ch] tabular-nums">
        <thead className="text-muted">
          <tr>
            <th className="text-left font-normal">{LABELS[kind]}</th>
            <th className="text-right font-normal">northbound</th>
            <th className="text-right font-normal">southbound</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, f, k]) => (
            <tr key={k}>
              <td className="text-muted">{label}</td>
              <td className="text-right">{f(m.northbound[k])}</td>
              <td className="text-right">{f(m.southbound[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="text-muted">
        Spadina Avenue, Fort York Blvd to College St, at {bin.start}–{until(bin.start)} demand from the City
        of Toronto&apos;s counts on {spadina.source.date}. One seeded run; metrics over {MEASURE / 60} minutes
        after a {WARMUP / 60}-minute warm-up. Every car, side streets included, loses{" "}
        {fmt.n(run.metrics.delay)}s on average.
      </figcaption>
    </figure>
  );
}
