import { teamOf } from "./court.ts";
import type { Team } from "./court.ts";
import { sensible } from "./policy.ts";
import { rng } from "../shared/random.ts";
import { choices, clone, play } from "./rally.ts";
import type { Action, Policy, Rally, State } from "./rally.ts";

/**
 * Win chances by playing a moment out many times.
 *
 * Every "what if" from the same moment uses the same list of seeds, so two
 * choices are compared on the same luck: the only thing that differs is the
 * choice. That keeps the comparison fair with a few hundred rallies instead
 * of many thousands.
 */

/** A seed for the i-th replay of one moment. */
export const replaySeed = (seed: number, i: number) => (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) + Math.imul(i + 1, 0xc2b2ae35)) >>> 0;

/** Play a moment out `n` times, starting with `first` (or the policy's own pick). */
export function replays(s: State, n: number, seed: number, first?: Action, policy: Policy = sensible): Team[] {
  const winners: Team[] = [];
  for (let i = 0; i < n; i++) winners.push(play(clone(s), rng(replaySeed(seed, i)), policy, { first }).winner);
  return winners;
}

/** The share of `winners` that are `team`. */
export const share = (winners: Team[], team: Team, from = 0, to = winners.length) => {
  let w = 0;
  for (let i = from; i < to; i++) if (winners[i] === team) w++;
  return w / Math.max(1, to - from);
};

export const sameAction = (a: Action, b: Action) => a.kind === b.kind && a.move === b.move;

/** Every choice the hitter has here, with the hitter's team's chance of winning the rally after it. */
export type Option = { action: Action; win: number; winners: Team[] };

export function options(s: State, n: number, seed: number): Option[] {
  const team = teamOf(s.hitter);
  return choices(s).map((action) => {
    const winners = replays(s, n, seed, action);
    return { action, win: share(winners, team), winners };
  });
}

/**
 * What one decision cost: the best option's win chance minus the chosen
 * one's. To keep luck from inflating it, the best option is picked on the
 * first half of the replays and both are scored on the second half.
 */
export type Cost = {
  /** Total win chance given away, 0 to 1. */
  total: number;
  /** The part from what was hit (with the best move for that shot). */
  shot: number;
  /** The part from moving in or holding, given the shot. */
  move: number;
  best: Action;
  /** How much was at stake: best minus worst option. */
  stake: number;
};

export function cost(opts: Option[], chosen: Action, team: Team): Cost {
  const n = opts[0].winners.length;
  const half = Math.floor(n / 2);
  const pickOn = (o: Option) => share(o.winners, team, 0, half);
  const scoreOn = (o: Option) => share(o.winners, team, half, n);
  const best = opts.reduce((a, b) => (pickOn(b) > pickOn(a) ? b : a));
  const mine = opts.find((o) => sameAction(o.action, chosen))!;
  // The best move for the shot that was actually hit.
  const sameShot = opts.filter((o) => o.action.kind === chosen.kind);
  const bestForShot = sameShot.reduce((a, b) => (pickOn(b) > pickOn(a) ? b : a));
  const total = Math.max(0, scoreOn(best) - scoreOn(mine));
  const move = Math.max(0, scoreOn(bestForShot) - scoreOn(mine));
  const wins = opts.map(scoreOn);
  return { total, shot: Math.max(0, total - move), move: Math.min(move, total), best: best.action, stake: Math.max(...wins) - Math.min(...wins) };
}

/** Team 0's chance of winning before each shot of a recorded rally. */
export function meter(rally: Rally, n: number, seed: number): number[] {
  return rally.states.map((s, i) => share(replays(s, n, seed + i), 0));
}
