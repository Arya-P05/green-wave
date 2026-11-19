"use client";

import { useState } from "react";
import data from "@/data/green-wave/cliff.json";
import { CLIFF_KINDS, MAIN_SHARE } from "@/lib/green-wave/cliff";
import type { CliffData } from "@/lib/green-wave/cliff";
import { LABELS } from "@/lib/green-wave/sim/scenario";
import { webster } from "@/lib/green-wave/sim/webster";
import Choice from "@/components/shared/Choice";
import Try from "@/components/shared/Try";
import DelayCurve from "./DelayCurve";
import Intersection from "./Intersection";

type CliffKind = (typeof CLIFF_KINDS)[number];
const cliff = data as CliffData;

/** Figure: drag demand up and watch one intersection, and its delay, go over the edge. */
export default function Cliff() {
  const [step, setStep] = useState(9); // demand 0.65
  const [kind, setKind] = useState<CliffKind>("fixed");
  const demand = cliff.demands[step];
  const delay = cliff.delay[kind][step];
  const plan = webster([MAIN_SHARE * demand, (1 - MAIN_SHARE) * demand]);

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="one intersection from above (each dash is a car), and how long a car waits there on average.">
        drag the demand up slowly past 0.8, then switch brains and see who falls off first.
      </Try>
      <div className="grid items-center gap-x-2 gap-y-1 md:grid-cols-[minmax(0,336px)_minmax(0,1fr)]">
        <Intersection demand={demand} kind={kind} />
        <DelayCurve data={cliff} demand={demand} kind={kind} />
      </div>
      <div className="grid gap-y-1 md:grid-cols-[minmax(0,336px)_minmax(0,1fr)] md:gap-x-2">
        <label className="grid grid-cols-[auto_1fr] items-center gap-x-[2ch]">
          <span>
            demand <span className="tabular-nums">{demand.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={cliff.demands.length - 1}
            step={1}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            aria-valuetext={`demand ${demand.toFixed(2)}`}
          />
        </label>
        <Choice label="controller" options={CLIFF_KINDS} value={kind} onChange={setKind} names={LABELS} />
      </div>
      <p className="tabular-nums">
        The timer runs Webster&apos;s plan for this demand: a <span className="text-ink">{plan.cycle}s</span> cycle,{" "}
        {plan.greens[0]}s green for the main street, {plan.greens[1]}s for the side street, and{" "}
        {plan.cycle - plan.greens[0] - plan.greens[1]}s of amber and all-red.
      </p>
      <figcaption className="text-muted">
        {LABELS[kind]}: <span className="text-ink tabular-nums">{delay.toFixed(1)}s</span> of delay per car
        at demand {demand.toFixed(2)}. Mean of {cliff.seeds} seeded hour-long runs; dashed line is
        Webster&apos;s 1958 formula for the same timing.
      </figcaption>
    </figure>
  );
}
