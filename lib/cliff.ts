import { SATURATION_FLOW } from "./sim/model.ts";
import { corridor } from "./sim/network.ts";
import type { CorridorSpec } from "./sim/network.ts";
import type { Kind } from "./sim/scenario.ts";

/** One intersection, two two-way streets, every approach a single lane. */
export const CLIFF_APPROACH = 60; // cells: 450 m of road on each side

/** The main street carries 60% of the critical demand, the side street 40%. */
export const MAIN_SHARE = 0.6;

/** One light has no neighbours to coordinate with, so the green wave is just fixed-time. */
export const CLIFF_KINDS = ["fixed", "actuated", "max-pressure"] as const satisfies readonly Kind[];

export const DEMANDS = Array.from({ length: 17 }, (_, i) => Math.round((0.2 + i * 0.05) * 100) / 100);

/**
 * Demand is Webster's Y: the sum of each phase's busiest approach over the
 * saturation flow. At Y = 1 the approaches would need every second of green,
 * with nothing left over for the amber and all-red between phases.
 */
export function cliffSpec(demand: number): CorridorSpec {
  const main = MAIN_SHARE * demand * SATURATION_FLOW;
  const side = (1 - MAIN_SHARE) * demand * SATURATION_FLOW;
  return {
    spacing: [],
    approach: CLIFF_APPROACH,
    arm: CLIFF_APPROACH,
    northbound: main,
    southbound: main,
    cross: [{ eastbound: side, westbound: side }],
  };
}

export const cliff = (demand: number) => corridor(cliffSpec(demand));

export type CliffData = {
  demands: number[];
  seeds: number;
  warmup: number;
  measure: number;
  /** Mean delay per car (s), per controller, per demand. */
  delay: Record<(typeof CLIFF_KINDS)[number], number[]>;
  /** Webster's 1958 formula for the same fixed-time plan; null past capacity. */
  webster: (number | null)[];
};
