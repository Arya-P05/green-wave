"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import data from "@/data/spadina.json";
import { corridor } from "@/lib/sim/network";
import { controllerFor, KINDS, LABELS, metrics } from "@/lib/sim/scenario";
import type { Kind, Metrics } from "@/lib/sim/scenario";
import { Sim } from "@/lib/sim/sim";
import type { Aspect } from "@/lib/sim/model";
import { APPROACH, peakHour, spadinaSpec } from "@/lib/spadina";
import type { SpadinaData } from "@/lib/spadina";
import Choice from "../Choice";
import { sizeCanvas, token, useReducedMotion, useWidth } from "../hooks";

const spadina = data as SpadinaData;
const hour = peakHour(spadina);
const spec = spadinaSpec(spadina, hour);

const WARMUP = 600;
const MEASURE = 1800;
const PX_PER_S = 1.5;
const HEIGHT = 432; // 18 lines
const LEFT = 96; // street names
const BOTTOM = 36;
const DRAW_MS = 1100;

type Run = { paths: number[][]; aspects: Aspect[][]; metrics: Metrics; end: number };

/** One seeded run of the corridor at the peak hour: every main-street car's path and every light. */
function simulate(kind: Kind): Run {
  const { network, index } = corridor(spec);
  const sim = new Sim(network, controllerFor(kind, spec, network), { seed: 1, warmup: WARMUP, record: true });
  sim.run(WARMUP + MEASURE);
  // Finished trips plus the cars still driving when the run ends.
  const paths = [...sim.trips, ...sim.onRoad()].flatMap((c) => (c.path ? [c.path] : []));
  return { paths, aspects: sim.aspects!, metrics: metrics(sim, index, WARMUP), end: sim.t };
}

/** Runs are deterministic, so each controller's is computed once and kept. */
const runs = new Map<Kind, Run>();
function runFor(kind: Kind): Run {
  if (!runs.has(kind)) runs.set(kind, simulate(kind));
  return runs.get(kind)!;
}

// Spadina runs up the plot, a few cells past the first and last lights.
const lights = spadina.lights.map((l) => l.x + APPROACH);
const lo = lights[0] - 12;
const hi = lights[lights.length - 1] + 12;
const h = HEIGHT - BOTTOM;
const y = (x: number) => ((hi - x) / (hi - lo)) * h;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * The time-space diagram: time runs right, Spadina runs up from Fort York to
 * College. Each car is one fine line, northbound in ink, southbound in grey.
 * The bar at each street is that light's colour for Spadina at that moment.
 * A green wave is a band of parallel diagonal lines slipping through the greens.
 */
export default function TimeSpace() {
  const [kind, setKind] = useState<Kind>("green-wave");
  const run = useMemo(() => runFor(kind), [kind]);

  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const still = useReducedMotion();

  const plot = Math.max(0, width - LEFT);
  const seconds = Math.min(600, Math.floor(plot / PX_PER_S));
  const t1 = run.end;
  const t0 = t1 - seconds;

  useEffect(() => {
    if (!plot || !canvas.current) return;
    const ctx = sizeCanvas(canvas.current, plot, h);
    const paper = document.createElement("canvas");
    const off = sizeCanvas(paper, plot, h);
    const px = (t: number) => (t - t0) * (plot / seconds);
    const color = { ink: token("ink"), muted: token("muted"), green: token("green"), amber: token("amber"), red: token("red") };

    // Lights first, so the cars' lines cross over them.
    run.aspects.forEach((aspects, i) => {
      for (let t = t0; t < t1; t++) {
        off.fillStyle = color[aspects[t]];
        off.fillRect(px(t), y(lights[i]) - 1, plot / seconds + 0.5, 2);
      }
    });

    off.lineWidth = 0.75;
    off.lineJoin = "round";
    for (const dir of [-1, 1]) {
      off.strokeStyle = dir === 1 ? color.ink : color.muted;
      off.globalAlpha = dir === 1 ? 0.55 : 0.45;
      off.beginPath();
      for (const p of run.paths) {
        if ( p.length < 4 || p[p.length - 2] < t0 || p[0] > t1) continue;
        if (Math.sign(p[3] - p[1]) !== dir) continue;
        let started = false;
        for (let k = 0; k < p.length; k += 2) {
          if (p[k] < t0 || p[k] > t1 || p[k + 1] < lo || p[k + 1] > hi) {
            started = false;
            continue;
          }
          if (started) off.lineTo(px(p[k]), y(p[k + 1]));
          else off.moveTo(px(p[k]), y(p[k + 1]));
          started = true;
        }
      }
      off.stroke();
    }
    off.globalAlpha = 1;

    const show = (share: number) => {
      ctx.clearRect(0, 0, plot, h);
      const w = Math.max(1, Math.round(plot * share));
      ctx.drawImage(paper, 0, 0, paper.width * share, paper.height, 0, 0, w, h);
    };
    if (still) {
      show(1);
      return;
    }
    // Draw like a plotter: left to right, once, each time the controller changes.
    let frame = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / DRAW_MS);
      show(easeOut(t));
      if (t < 1) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [run, plot, seconds, t0, t1, still]);

  const m = run.metrics.through;
  const fmt = {
    s: (v: number) => `${Math.round(v)}s`,
    n: (v: number) => v.toFixed(1),
    pct: (v: number) => `${Math.round(v * 100)}%`,
  };
  const rows: [string, (v: number) => string, keyof typeof m.northbound][] = [
    ["travel time", fmt.s, "travelTime"],
    ["stops per trip", fmt.n, "stops"],
    ["band score", fmt.pct, "band"],
  ];

  return (
    <figure className="my-2 grid gap-y-1">
      <Choice label="controller" options={KINDS} value={kind} onChange={setKind} names={LABELS} />
      <div ref={box} className="relative w-full" style={{ height: HEIGHT }}>
        {spadina.lights.map((l, i) => (
          <span key={l.short} className="absolute left-0 text-muted" style={{ top: y(lights[i]) - 12 }}>
            {l.short}
          </span>
        ))}
        <canvas
          ref={canvas}
          className="absolute top-0"
          style={{ left: LEFT }}
          role="img"
          aria-label={`Time-space diagram of Spadina Avenue under ${LABELS[kind]}: each car's path over ${Math.round(seconds / 60)} minutes, with each light's colour.`}
        />
        {plot > 0 &&
          Array.from({ length: Math.floor(seconds / 120) + 1 }, (_, i) => (
            <span
              key={i}
              className="absolute text-muted"
              style={{ left: LEFT + i * 120 * (plot / seconds), top: h + 6 }}
            >
              {i * 2}
              {i === 0 ? " min" : ""}
            </span>
          ))}
      </div>
      <table className="w-full max-w-[56ch] tabular-nums">
        <thead className="text-muted">
          <tr>
            <th className="text-left font-normal">{LABELS[kind]}</th>
            <th className="text-right font-normal">northbound</th>
            <th className="text-right font-normal">southbound</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, f, key]) => (
            <tr key={key}>
              <td className="text-muted">{label}</td>
              <td className="text-right">{f(m.northbound[key])}</td>
              <td className="text-right">{f(m.southbound[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="text-muted">
        Spadina Avenue, Fort York Blvd to College St, at {hour.start}–{String(Number(hour.start.slice(0, 2)) + 1).padStart(2, "0")}:00
        demand from the City of Toronto&apos;s counts on {spadina.source.date}. One seeded run;
        metrics over {MEASURE / 60} minutes after a {WARMUP / 60}-minute warm-up. Every car, side
        streets included, loses {fmt.n(run.metrics.delay)}s on average.
      </figcaption>
    </figure>
  );
}
