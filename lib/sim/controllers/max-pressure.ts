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

/** The same rule with a different minimum green, for the sensitivity sweep. */
export function maxPressureWith(minGreen: number): Controller {
  return {
    name: "max-pressure",
    choose(sim, node) {
      const s = sim.nodes[node];
      if (sim.greenFor(node) < minGreen) return s.phase;
      const pressures = sim.net.nodes[node].phases.map((links) =>
        links.reduce((p, l) => p + sim.queue(l) - downstream(sim, l), 0),
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
