/**
 * Precompute The Cliff: mean delay per car at one intersection, for each
 * controller, across demand, averaged over seeds. Writes data/cliff.json.
 *
 *   node scripts/cliff.ts
 */
import { writeFileSync } from "node:fs";
import { CLIFF_KINDS, DEMANDS, cliff, cliffSpec } from "../lib/cliff.ts";
import type { CliffData } from "../lib/cliff.ts";
import { SATURATION_FLOW } from "../lib/sim/model.ts";
import { controllerFor, corridorTiming, metrics } from "../lib/sim/scenario.ts";
import { Sim } from "../lib/sim/sim.ts";
import { websterDelay } from "../lib/sim/webster.ts";

const SEEDS = 8;
const WARMUP = 600;
const MEASURE = 3600;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round = (x: number) => Math.round(x * 10) / 10;

const delay = Object.fromEntries(
  CLIFF_KINDS.map((kind) => [
    kind,
    DEMANDS.map((d) => {
      const runs = Array.from({ length: SEEDS }, (_, seed) => {
        const { network, index } = cliff(d);
        const ctl = controllerFor(kind, cliffSpec(d), network);
        const sim = new Sim(network, ctl, { seed: seed + 1, warmup: WARMUP }).run(WARMUP + MEASURE);
        return metrics(sim, index, WARMUP).delay;
      });
      return round(mean(runs));
    }),
  ]),
) as CliffData["delay"];

const webster = DEMANDS.map((d) => {
  const spec = cliffSpec(d);
  const { cycle, greens } = corridorTiming(spec);
  const main = websterDelay(cycle, greens[0][0], spec.northbound, SATURATION_FLOW);
  const side = websterDelay(cycle, greens[0][1], spec.cross[0].eastbound, SATURATION_FLOW);
  const all = (spec.northbound * main + spec.cross[0].eastbound * side) / (spec.northbound + spec.cross[0].eastbound);
  return Number.isFinite(all) && all > 0 ? round(all) : null;
});

const data: CliffData = { demands: DEMANDS, seeds: SEEDS, warmup: WARMUP, measure: MEASURE, delay, webster };
writeFileSync(new URL("../data/cliff.json", import.meta.url), JSON.stringify(data, null, 2) + "\n");
console.table(DEMANDS.map((d, i) => ({ d, ...Object.fromEntries(CLIFF_KINDS.map((k) => [k, delay[k][i]])), webster: webster[i] })));
