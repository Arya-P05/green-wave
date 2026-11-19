import type { Controller, Sim } from "../sim.ts";
import { MIN_GREEN_S } from "./actuated.ts";

/**
 * Max-pressure (Varaiya 2013). A phase's pressure is the sum, over the links
 * it serves, of the queue waiting upstream minus the queue already standing
 * downstream. Give green to the phase with the most pressure, re-deciding
 * every second once the minimum green has run. A link that leads off the map
 * never backs up, so it counts as empty. Ties keep the current green.
 */
export const maxPressure = maxPressureWith(MIN_GREEN_S);

/** Who counts as waiting upstream: only stopped cars, or every car on the link. */
export type Upstream = "stopped" | "all";

/** Minimum green for max-pressure+: long enough that each switch's 4 s of clearance buys real green. */
export const PLUS_MIN_GREEN_S = 10;

/**
 * Max-pressure+, the fix for the two ways the textbook rule fails on a real
 * street. It counts every car on the road toward the light, moving or not, so
 * an arriving platoon pulls the green toward itself before it has to stop.
 * This is the vehicle count of Varaiya's own store-and-forward model, and the
 * idea behind position-weighted backpressure (Li & Jabari 2019), which values
 * cars spread along the link, not just the queue. Downstream it still counts
 * only cars that are actually stuck. And it holds each green for 10 s, because
 * the proof assumes switching is free and here every switch costs 4 s.
 */
export const maxPressurePlus: Controller = {
  ...maxPressureWith(PLUS_MIN_GREEN_S, "all"),
  name: "max-pressure+",
};

/** The rule with its knobs exposed: the minimum green, and who counts upstream. */
export function maxPressureWith(minGreen: number, upstream: Upstream = "stopped"): Controller {
  const waiting = (sim: Sim, link: number) => (upstream === "all" ? sim.count(link) : sim.queue(link));
  return {
    name: "max-pressure",
    choose(sim, node) {
      const s = sim.nodes[node];
      if (sim.greenFor(node) < minGreen) return s.phase;
      const pressures = sim.net.nodes[node].phases.map((links) =>
        links.reduce((p, l) => p + waiting(sim, l) - downstream(sim, l), 0),
      );
      let best = s.phase;
      pressures.forEach((p, i) => {
        if (p > pressures[best]) best = i;
      });
      return best;
    },
  };
}

function downstream(sim: Sim, link: number): number {
  const next = sim.net.links[link].next;
  return next !== null && sim.net.links[next].signal ? sim.queue(next) : 0;
}
