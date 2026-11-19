import type { Controller } from "../sim.ts";

export const MIN_GREEN_S = 6;
export const MAX_GREEN_S = 40;
/** Detector zone before the stop line: 5 cells = 37.5 m, about 2.5 s of driving. */
export const DETECTOR_CELLS = 5;

/**
 * Actuated with gap-out: hold the green while cars keep arriving at the stop
 * line; end it when the detector sees a gap (or the max green runs out), but
 * only if someone is waiting on the other phase.
 */
export const actuated: Controller = {
  name: "actuated",
  choose(sim, node) {
    const s = sim.nodes[node];
    const phases = sim.net.nodes[node].phases;
    const other = (s.phase + 1) % phases.length;
    const green = sim.greenFor(node);
    if (green < MIN_GREEN_S) return s.phase;
    if (!phases[other].some((l) => sim.count(l) > 0)) return s.phase;
    if (green >= MAX_GREEN_S) return other;
    return phases[s.phase].some((l) => sim.detects(l, DETECTOR_CELLS)) ? s.phase : other;
  },
};
