import { actuated } from "./controllers/actuated.ts";
import { fixedTime, greenWaveOffsets } from "./controllers/fixed.ts";
import { maxPressure, maxPressurePlus } from "./controllers/max-pressure.ts";
import { FREE_SPEED, SATURATION_FLOW } from "./model.ts";
import type { Network } from "./model.ts";
import type { CorridorIndex, CorridorSpec } from "./network.ts";
import type { Controller, Sim, Trip } from "./sim.ts";
import { webster } from "./webster.ts";

export const KINDS = ["fixed", "green-wave", "actuated", "max-pressure", "max-pressure-plus"] as const;
export type Kind = (typeof KINDS)[number];

/** Plain names for the reader: a timer, a sensor light, and the two max-pressures. */
export const LABELS: Record<Kind, string> = {
  fixed: "timer",
  "green-wave": "green wave",
  actuated: "sensor",
  "max-pressure": "max-pressure",
  "max-pressure-plus": "max-pressure+",
};

/**
 * Webster timing for every light on a common cycle: the busiest light needs
 * the longest cycle, and a wave only works if every light repeats in step.
 */
export function corridorTiming(spec: CorridorSpec) {
  const ys = spec.cross.map((c) => [
    Math.max(spec.northbound, spec.southbound) / SATURATION_FLOW,
    Math.max(c.eastbound, c.westbound) / SATURATION_FLOW,
  ]);
  const cycle = Math.max(...ys.map((y) => webster(y).cycle));
  return { cycle, greens: ys.map((y) => webster(y, cycle).greens as [number, number]) };
}

/** The wave runs in the busier main-street direction. */
export function waveDirection(spec: CorridorSpec): "northbound" | "southbound" {
  return spec.southbound > spec.northbound ? "southbound" : "northbound";
}

export function controllerFor(kind: Kind, spec: CorridorSpec, net: Network): Controller {
  if (kind === "actuated") return actuated;
  if (kind === "max-pressure") return maxPressure;
  if (kind === "max-pressure-plus") return maxPressurePlus;
  const { cycle, greens } = corridorTiming(spec);
  const xs = net.nodes.map((n) => n.x);
  let offsets = xs.map(() => 0);
  if (kind === "green-wave") {
    offsets =
      waveDirection(spec) === "northbound"
        ? greenWaveOffsets(xs, FREE_SPEED, cycle)
        : greenWaveOffsets([...xs].reverse(), FREE_SPEED, cycle).reverse();
  }
  return fixedTime(kind, greens.map((g, i) => ({ cycle, greens: g, offset: offsets[i] })));
}

export type Metrics = {
  /** Average seconds lost per car, over every car (main and side streets). */
  delay: number;
  /** Cars that drove the whole main street, per direction. */
  through: { northbound: Through; southbound: Through };
  /** Cars that crossed on a side street: mean seconds lost against free speed. */
  side: { trips: number; delay: number };
};

export type Through = {
  trips: number;
  travelTime: number; // s, including time queued at the edge
  stops: number; // per trip
  band: number; // share of trips with no stop at all
};

export function metrics(sim: Sim, index: CorridorIndex, warmup: number): Metrics {
  const through = (ids: number[]): Through => {
    const trips = sim.trips.filter(
      (t) => t.born >= warmup && t.origin === ids[0] && t.exit === ids[ids.length - 1],
    );
    const mean = (f: (t: (typeof trips)[number]) => number) =>
      trips.length ? trips.reduce((a, t) => a + f(t), 0) / trips.length : NaN;
    return {
      trips: trips.length,
      travelTime: mean((t) => t.done - t.born),
      stops: mean((t) => t.stops),
      band: mean((t) => (t.stops === 0 ? 1 : 0)),
    };
  };
  const arms = new Set(index.cross.flatMap((c) => [c.eastbound[0], c.westbound[0]]));
  const side = sim.trips.filter((t) => t.born >= warmup && arms.has(t.origin));
  const free = (t: Trip) => (sim.net.links[t.origin].length + sim.net.links[t.exit].length) / FREE_SPEED;
  return {
    delay: sim.arrivals ? sim.delay / sim.arrivals : 0,
    through: { northbound: through(index.northbound), southbound: through(index.southbound) },
    side: {
      trips: side.length,
      delay: side.length ? side.reduce((a, t) => a + t.done - t.born - free(t), 0) / side.length : NaN,
    },
  };
}
