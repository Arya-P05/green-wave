/**
 * The experiment. All five controllers on the Spadina corridor:
 *   1. across the day: each hour's measured demand, 06:00 to 20:00;
 *   2. side-street sweep: the peak hour's main street, side streets scaled;
 *   3. max-pressure's minimum green, at the peak hour.
 * Every point is the mean of SEEDS seeded runs. Writes data/experiment.json.
 *
 *   node scripts/experiment.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { Direction, Experiment, Point } from "../../lib/green-wave/experiment.ts";
import { platoonRatio, projectedArrivals } from "../../lib/green-wave/sim/analysis.ts";
import { maxPressureWith } from "../../lib/green-wave/sim/controllers/max-pressure.ts";
import { corridor } from "../../lib/green-wave/sim/network.ts";
import type { CorridorSpec } from "../../lib/green-wave/sim/network.ts";
import { controllerFor, KINDS, metrics } from "../../lib/green-wave/sim/scenario.ts";
import type { Kind, Through } from "../../lib/green-wave/sim/scenario.ts";
import { Sim } from "../../lib/green-wave/sim/sim.ts";
import type { Controller } from "../../lib/green-wave/sim/sim.ts";
import { hours, peakHour, spadinaSpec } from "../../lib/green-wave/spadina.ts";
import type { SpadinaData } from "../../lib/green-wave/spadina.ts";

const SEEDS = 8;
const WARMUP = 900;
const MEASURE = 3600;
const SIDE_SCALES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const MIN_GREENS = [6, 10, 15, 20, 30];

const data = JSON.parse(readFileSync(new URL("../../data/green-wave/spadina.json", import.meta.url), "utf8")) as SpadinaData;


function once(spec: CorridorSpec, control: (spec: CorridorSpec, net: Sim["net"]) => Controller, seed: number): Point {
  const { network, index } = corridor(spec);
  const sim = new Sim(network, control(spec, network), { seed, warmup: WARMUP, record: true });
  sim.run(WARMUP + MEASURE);
  const m = metrics(sim, index, WARMUP);
  const xs = network.nodes.map((n) => n.x);
  const aspects = sim.aspects!;
  // Share of the measured hour each light showed Spadina green.
  const green = aspects.map((a) => a.slice(WARMUP).filter((x) => x === "green").length / MEASURE);
  const platoon = (ids: number[], order: number[], dir: 1 | -1) => {
    let onGreen = 0;
    let expected = 0;
    for (const t of sim.trips) {
      if (t.born < WARMUP || t.origin !== ids[0] || t.exit !== ids[ids.length - 1]) continue;
      projectedArrivals(t.path!, order.map((n) => xs[n]), dir).forEach((tick, i) => {
        const node = order[i + 1];
        if (tick === null || tick >= aspects[node].length) return;
        expected += green[node];
        if (aspects[node][tick] === "green") onGreen++;
      });
    }
    return platoonRatio(onGreen, expected);
  };
  const north = xs.map((_, i) => i);
  return {
    delay: m.delay,
    side: m.side.delay,
    northbound: { ...pick(m.through.northbound), platoon: platoon(index.northbound, north, 1) },
    southbound: { ...pick(m.through.southbound), platoon: platoon(index.southbound, [...north].reverse(), -1) },
  };
}

const pick = ({ travelTime, stops, band }: Through) => ({ travelTime, stops, band });


/** Mean over seeds, field by field. */
function mean(points: Point[]): Point {
  const avg = (f: (p: Point) => number) => round(points.reduce((a, p) => a + f(p), 0) / points.length);
  const dir = (d: "northbound" | "southbound"): Direction => ({
    travelTime: avg((p) => p[d].travelTime),
    stops: avg((p) => p[d].stops),
    band: avg((p) => p[d].band),
    platoon: avg((p) => p[d].platoon),
  });
  return { delay: avg((p) => p.delay), side: avg((p) => p.side), northbound: dir("northbound"), southbound: dir("southbound") };
}

const round = (x: number) => Math.round(x * 1000) / 1000;

function point(spec: CorridorSpec, control: (spec: CorridorSpec, net: Sim["net"]) => Controller): Point {
  return mean(Array.from({ length: SEEDS }, (_, s) => once(spec, control, s + 1)));
}

const byKind = (kind: Kind) => (spec: CorridorSpec, net: Sim["net"]) => controllerFor(kind, spec, net);

/** Share of all arriving cars that enter from a side street. */
const sideShare = (spec: CorridorSpec) => {
  const side = spec.cross.reduce((a, c) => a + c.eastbound + c.westbound, 0);
  return round(side / (side + spec.northbound + spec.southbound));
};

const day = hours(data);
const peak = peakHour(data);
const log = (msg: string) => console.error(`${new Date().toISOString().slice(11, 19)} ${msg}`);

const results: Experiment = {
  meta: { seeds: SEEDS, warmup: WARMUP, measure: MEASURE, date: data.source.date, peak: peak.start },
  day: {
    hours: day.map((h) => h.start),
    demand: day.map((h) => ({ northbound: h.northbound, southbound: h.southbound, sideShare: sideShare(spadinaSpec(data, h)) })),
    results: Object.fromEntries(
      KINDS.map((kind) => {
        log(`day ${kind}`);
        return [kind, day.map((h) => point(spadinaSpec(data, h), byKind(kind)))];
      }),
    ) as Experiment["day"]["results"],
  },
  side: {
    scales: SIDE_SCALES,
    shares: SIDE_SCALES.map((k) => sideShare(spadinaSpec(data, peak, k))),
    results: Object.fromEntries(
      KINDS.map((kind) => {
        log(`side ${kind}`);
        return [kind, SIDE_SCALES.map((k) => point(spadinaSpec(data, peak, k), byKind(kind)))];
      }),
    ) as Experiment["side"]["results"],
  },
  minGreen: {
    values: MIN_GREENS,
    results: MIN_GREENS.map((g) => {
      log(`max-pressure min green ${g}`);
      return point(spadinaSpec(data, peak), () => maxPressureWith(g));
    }),
  },
};

writeFileSync(new URL("../../data/green-wave/experiment.json", import.meta.url), JSON.stringify(results) + "\n");
log("done");
