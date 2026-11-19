"use client";

import { useMemo, useState } from "react";
import { fixedTime, greenWaveOffsets } from "@/lib/sim/controllers/fixed";
import { CELL_M, FREE_SPEED } from "@/lib/sim/model";
import { corridorTiming } from "@/lib/sim/scenario";
import { spadinaSpec } from "@/lib/spadina";
import Diagram from "./Diagram";
import { HOURS, PEAK, runFor, spadina } from "./run";

const SPEEDS = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]; // km/h
const spec = spadinaSpec(spadina, HOURS[PEAK]);
const { cycle, greens } = corridorTiming(spec);
const cellsPerS = (kmh: number) => kmh / 3.6 / CELL_M;
const freeKmh = Math.round(FREE_SPEED * CELL_M * 3.6);

/**
 * Tune the wave yourself: pick the speed the lights are timed for, northbound,
 * and see who still has to stop. It only works when it matches how fast cars drive.
 */
export default function Tuner() {
  const [step, setStep] = useState(2); // 30 km/h: start somewhere wrong
  const kmh = SPEEDS[step];
  const run = useMemo(
    () =>
      runFor(`tuner ${kmh}`, spec, (net) => {
        const offsets = greenWaveOffsets(net.nodes.map((n) => n.x), cellsPerS(kmh), cycle);
        return fixedTime("tuned", greens.map((g, i) => ({ cycle, greens: g, offset: offsets[i] })));
      }),
    [kmh],
  );
  const nb = run.metrics.through.northbound;
  const sb = run.metrics.through.southbound;

  return (
    <figure className="my-2 grid gap-y-1">
      <label className="grid max-w-[56ch] grid-cols-[auto_1fr] items-center gap-x-[2ch]">
        <span className="tabular-nums">timed for {String(kmh).padStart(2, " ")} km/h</span>
        <input
          type="range"
          min={0}
          max={SPEEDS.length - 1}
          step={1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          aria-label="speed the green wave is timed for"
          aria-valuetext={`${kmh} kilometres per hour`}
        />
      </label>
      <Diagram run={run} label={`Time-space diagram of Spadina with a green wave timed for ${kmh} km/h northbound.`} />
      <p className="tabular-nums">
        Northbound: <span className="text-ink">{nb.stops.toFixed(1)} stops</span>, {Math.round(nb.travelTime)}s.{" "}
        <span className="text-muted">
          Southbound: {sb.stops.toFixed(1)} stops, {Math.round(sb.travelTime)}s.
        </span>
      </p>
      <figcaption className="text-muted">
        Same {Math.round(cycle)}s cycle and greens at every light; only the offsets change. Each light turns
        green when a car leaving Fort York at the start of its green, driving at the chosen speed, would
        arrive. Cars here cruise at about {freeKmh} km/h on an open road. {HOURS[PEAK].start} demand, one seeded run.
      </figcaption>
    </figure>
  );
}
