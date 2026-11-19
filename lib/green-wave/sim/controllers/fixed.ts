import { CLEARANCE_S } from "../model.ts";
import type { Controller } from "../sim.ts";

/** A fixed plan for one two-phase intersection. Phase 0 starts its green at `offset`. */
export type Plan = { cycle: number; greens: [number, number]; offset: number };

/**
 * Fixed-time: the same cycle forever, regardless of traffic. A phase change is
 * requested one clearance interval before the next green should appear.
 */
export function fixedTime(name: string, plans: Plan[]): Controller {
  return {
    name,
    choose(_sim, node, t) {
      const { cycle, greens, offset } = plans[node];
      const tau = (((t - offset) % cycle) + cycle) % cycle;
      return tau < greens[0] || tau >= cycle - CLEARANCE_S ? 0 : 1;
    },
  };
}

/**
 * Hand-computed green wave: each light turns green when a car that left the
 * first light at the start of its green, driving at free speed, arrives.
 */
export function greenWaveOffsets(xs: number[], speed: number, cycle: number): number[] {
  return xs.map((x) => Math.round(Math.abs(x - xs[0]) / speed) % cycle);
}
