import data from "@/data/spadina.json";
import { corridor } from "@/lib/sim/network";
import type { CorridorSpec } from "@/lib/sim/network";
import { metrics } from "@/lib/sim/scenario";
import type { Metrics } from "@/lib/sim/scenario";
import { Sim } from "@/lib/sim/sim";
import type { Controller } from "@/lib/sim/sim";
import type { Aspect, Network } from "@/lib/sim/model";
import { APPROACH, hours, peakHour } from "@/lib/spadina";
import type { SpadinaData } from "@/lib/spadina";

export const spadina = data as SpadinaData;
export const HOURS = hours(spadina);
export const PEAK = HOURS.findIndex((h) => h.start === peakHour(spadina).start);
export const until = (start: string) => `${String(Number(start.slice(0, 2)) + 1).padStart(2, "0")}:00`;

export const WARMUP = 600;
export const MEASURE = 1800;

/** One car on Spadina: its path as [t, x, t, x, ...], and, if it drove the whole street, its trip. */
export type Car = {
  path: number[];
  dir: 1 | -1;
  trip: { seconds: number; stops: number } | null;
};

export type Run = { cars: Car[]; aspects: Aspect[][]; metrics: Metrics; end: number };

/** Every light's position on the corridor, in cells, south to north. */
export const lights = spadina.lights.map((l) => l.x + APPROACH);

/** One seeded run of the corridor: every main-street car's path and every light. */
function simulate(spec: CorridorSpec, control: (net: Network) => Controller): Run {
  const { network, index } = corridor(spec);
  const sim = new Sim(network, control(network), { seed: 1, warmup: WARMUP, record: true });
  sim.run(WARMUP + MEASURE);
  const ends = new Set([index.northbound[0], index.southbound[0]]);
  const exits = new Set([index.northbound[index.northbound.length - 1], index.southbound[index.southbound.length - 1]]);
  const dir = (origin: number) => network.links[origin].corridor!.dir;
  const cars: Car[] = [];
  for (const t of sim.trips) {
    if (!t.path?.length) continue;
    const through = ends.has(t.origin) && exits.has(t.exit) && t.born >= WARMUP;
    cars.push({ path: t.path, dir: dir(t.origin), trip: through ? { seconds: t.done - t.born, stops: t.stops } : null });
  }
  // Cars still driving when the run ends.
  for (const c of sim.onRoad()) if (c.path?.length) cars.push({ path: c.path, dir: dir(c.origin), trip: null });
  return { cars, aspects: sim.aspects!, metrics: metrics(sim, index, WARMUP), end: sim.t };
}

/** Runs are deterministic, so each one is computed once and kept. */
const runs = new Map<string, Run>();
export function runFor(key: string, spec: CorridorSpec, control: (net: Network) => Controller): Run {
  if (!runs.has(key)) runs.set(key, simulate(spec, control));
  return runs.get(key)!;
}
