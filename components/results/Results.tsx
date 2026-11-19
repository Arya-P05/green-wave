"use client";

import { useState } from "react";
import data from "@/data/experiment.json";
import { MEASURES } from "@/lib/experiment";
import type { Experiment, Measure, Point } from "@/lib/experiment";
import { KINDS, LABELS } from "@/lib/sim/scenario";
import type { Kind } from "@/lib/sim/scenario";
import Choice from "../Choice";
import LineChart from "../LineChart";
import Try from "../Try";

const experiment = data as Experiment;
const MEASURE_KEYS = Object.keys(MEASURES) as Measure[];
const MEASURE_NAMES = Object.fromEntries(MEASURE_KEYS.map((k) => [k, MEASURES[k].label])) as Record<Measure, string>;

/** One results figure: a measure across some swept variable, one line per controller. */
function Sweep({
  xs,
  results,
  xTicks,
  xFormat,
  caption,
  name,
}: {
  xs: number[];
  results: Record<Kind, Point[]>;
  xTicks: number[];
  xFormat: (x: number) => string;
  caption: string;
  name: string;
}) {
  const [measure, setMeasure] = useState<Measure>("stopsNorth");
  const [focus, setFocus] = useState<Kind>("max-pressure");
  const m = MEASURES[measure];
  const platoon = measure === "platoon";
  const stops = measure === "stopsNorth" || measure === "stopsSouth";
  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="one line per brain. Lower is better, except for “arrive on green” (the platoon ratio), where above 1 means a wave.">
        pick a measure, then tap a brain to pick out its line.
      </Try>
      <Choice label="measure" options={MEASURE_KEYS} value={measure} onChange={setMeasure} names={MEASURE_NAMES} />
      <LineChart
        xs={xs}
        xTicks={xTicks}
        xFormat={xFormat}
        series={KINDS.filter((k) => k in results).map((k) => ({ key: k, label: LABELS[k], values: results[k].map(m.get) }))}
        focus={focus}
        yFormat={(v) => (platoon || stops ? v.toFixed(1) : `${Math.round(v)}${m.unit}`)}
        reference={platoon ? { y: 1, label: "1 = lights ignore each other" } : undefined}
        label={`${m.label} ${name}, one line per controller`}
        yLabel={m.label}
      />
      <Choice label="highlight" options={KINDS} value={focus} onChange={setFocus} names={LABELS} />
      <figcaption className="text-muted">{caption}</figcaption>
    </figure>
  );
}

const hours = experiment.day.hours.map((h) => Number(h.slice(0, 2)));
const { seeds, measure } = experiment.meta;

export function DayResults() {
  return (
    <Sweep
      name="across the day"
      xs={hours}
      results={experiment.day.results}
      xTicks={[6, 9, 12, 15, 19]}
      xFormat={(h) => `${h}:00`}
      caption={`Each hour of ${experiment.meta.date}'s measured demand, held steady for ${measure / 60} minutes. Mean of ${seeds} seeded runs per point.`}
    />
  );
}

export function SideResults() {
  return (
    <Sweep
      name="as side-street demand grows"
      xs={experiment.side.scales}
      results={experiment.side.results}
      xTicks={[0.25, 1, 2]}
      xFormat={(k) => `×${k}`}
      caption={`The ${experiment.meta.peak} hour on Spadina, with every side street's measured demand scaled from a quarter to double. Mean of ${seeds} seeded runs per point.`}
    />
  );
}

/** Max-pressure's one knob: how long a green must last before it can be taken away. */
export function MinGreenTable() {
  const { values, results } = experiment.minGreen;
  return (
    <table className="my-2 w-full max-w-[64ch] tabular-nums">
      <thead className="text-muted">
        <tr>
          <th className="text-left font-normal">min green</th>
          <th className="text-right font-normal">delay</th>
          <th className="text-right font-normal">nb trip</th>
          <th className="text-right font-normal">arrive on green</th>
        </tr>
      </thead>
      <tbody>
        {values.map((g, i) => (
          <tr key={g}>
            <td>{g}s</td>
            <td className="text-right">{results[i].delay.toFixed(1)}s</td>
            <td className="text-right">{Math.round(results[i].northbound.travelTime)}s</td>
            <td className="text-right">{results[i].northbound.platoon.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
