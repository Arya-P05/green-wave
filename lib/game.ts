import { cliff, cliffSpec } from "./cliff.ts";
import { controllerFor } from "./sim/scenario.ts";
import type { Kind } from "./sim/scenario.ts";
import { Sim } from "./sim/sim.ts";
import type { Controller } from "./sim/sim.ts";

/** Busy but below capacity: a good light keeps up, a bad one doesn't. */
export const GAME_DEMAND = 0.65;
/** Simulated seconds you play for. */
export const GAME_S = 120;
/** Seconds of fixed-time first, so you start with traffic on every street. */
const LEAD_S = 120;

/** The controllers you're scored against. */
export const RIVALS = ["fixed", "actuated", "max-pressure", "max-pressure-plus"] as const satisfies readonly Kind[];

/** The game's intersection, after the lead-in, with the delay counter at zero. */
export function gameStart(controller: Controller) {
  const { network, index } = cliff(GAME_DEMAND);
  const sim = new Sim(network, controllerFor("fixed", cliffSpec(GAME_DEMAND), network), { seed: 1, warmup: LEAD_S });
  sim.run(LEAD_S);
  sim.controller = controller;
  return { sim, index, end: LEAD_S + GAME_S };
}

/** Car-seconds lost against free speed over the game, under one controller, with no one playing. */
export function rivalScore(kind: Kind): number {
  const { sim, end } = gameStart(controllerFor(kind, cliffSpec(GAME_DEMAND), cliff(GAME_DEMAND).network));
  return sim.run(end).delay;
}

/** A light you drive by hand: it shows whatever phase you last asked for. */
export function byHand(): Controller & { want: number } {
  return {
    name: "you",
    want: 0,
    choose() {
      return this.want;
    },
  };
}
