import { cliff, cliffSpec } from "./cliff.ts";
import { controllerFor } from "./sim/scenario.ts";
import type { Kind } from "./sim/scenario.ts";
import { Sim } from "./sim/sim.ts";
import type { Controller } from "./sim/sim.ts";

/** Busy, close to the cliff: a good light keeps up, a careless one falls behind fast. */
export const GAME_DEMAND = 0.8;
/** Rounds per game, each with different traffic, so one lucky round can't decide it. */
export const ROUNDS = 3;
/** Simulated seconds per round. */
export const ROUND_S = 120;
/** Seconds of fixed-time first, so every round starts with traffic on every street. */
const LEAD_S = 120;

/** The controllers you're scored against. */
export const RIVALS = ["fixed", "actuated", "max-pressure", "max-pressure-plus"] as const satisfies readonly Kind[];

/** One round's intersection, after the lead-in, with the delay counter at zero. */
export function roundStart(controller: Controller, seed: number) {
  const { network, index } = cliff(GAME_DEMAND);
  const sim = new Sim(network, controllerFor("fixed", cliffSpec(GAME_DEMAND), network), { seed, warmup: LEAD_S });
  sim.run(LEAD_S);
  sim.controller = controller;
  return { sim, index, end: LEAD_S + ROUND_S };
}

/** Car-seconds lost against free speed in one round, under one controller, with no one playing. */
export function rivalScore(kind: Kind, seed: number): number {
  const { sim, end } = roundStart(controllerFor(kind, cliffSpec(GAME_DEMAND), cliff(GAME_DEMAND).network), seed);
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
