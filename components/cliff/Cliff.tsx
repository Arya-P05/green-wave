"use client";

import { useState } from "react";
import data from "@/data/cliff.json";
import { CLIFF_KINDS, MAIN_SHARE } from "@/lib/cliff";
import type { CliffData } from "@/lib/cliff";
import { LABELS } from "@/lib/sim/scenario";
import { webster } from "@/lib/sim/webster";
import Choice from "../Choice";
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
        Fixed-time runs Webster&apos;s plan for this demand: a <span className="text-ink">{plan.cycle}s</span> cycle,{" "}
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
