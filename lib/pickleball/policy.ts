import { zone } from "./court.ts";
import type { Zone } from "./court.ts";
import type { Action, Height, Kind, Move, Policy, Rng, State } from "./rally.ts";

/**
 * How a sensible 4.0 player picks a shot: mostly what coaches teach, with a
 * bit of randomness, because nobody plays the same way twice.
 *
 * Odds of [soft, hard, lob] by where you are and the ball you got.
 */
export const MIX: Record<Zone, Record<Height, [number, number, number]>> = {
  back: { low: [0.6, 0.35, 0.05], mid: [0.5, 0.45, 0.05], high: [0.15, 0.85, 0] },
  transition: { low: [0.65, 0.3, 0.05], mid: [0.5, 0.45, 0.05], high: [0.1, 0.9, 0] },
  kitchen: { low: [0.88, 0.1, 0.02], mid: [0.55, 0.43, 0.02], high: [0.05, 0.95, 0] },
};
/** The third shot: about 55% drops, like 4.0 players in Gandhi's tournament data. */
export const THIRD: [number, number, number] = [0.55, 0.4, 0.05];
/** How often a return is aimed deep. */
export const AIM_DEEP = 0.55;
/** After each kind of shot, the chance you follow it in. */
export const FOLLOW: Record<"soft" | "hard" | "lob", number> = { soft: 0.8, hard: 0.5, lob: 0.7 };

const KINDS = ["soft", "hard", "lob"] as const;

export function pick(mix: readonly number[], r: Rng): number {
  let u = r();
  for (let i = 0; i < mix.length; i++) {
    if (u < mix[i]) return i;
    u -= mix[i];
  }
  return mix.length - 1;
}

/** The kind of shot the 4.0 player hits here. */
export function defaultKind(s: State, r: Rng): Kind {
  if (s.shot === 1) return "serve";
  if (s.shot === 2) return r() < AIM_DEEP ? "deep" : "short";
  const mix = s.shot === 3 ? THIRD : MIX[zone(s.players[s.hitter].d)][s.ball.h];
  return KINDS[pick(mix, r)];
}

/** Whether they come in after it. */
export function defaultMove(kind: Kind, s: State, r: Rng): Move {
  if (kind === "serve") return "hold";
  if (kind === "deep" || kind === "short") return "in";
  if (zone(s.players[s.hitter].d) === "kitchen") return "in";
  return r() < FOLLOW[kind] ? "in" : "hold";
}

export const sensible: Policy = (s, r) => {
  const kind = defaultKind(s, r);
  return { kind, move: defaultMove(kind, s, r) };
};

/** A policy that always picks `kind`'s replacement in one situation and plays sensibly otherwise. */
export function swap(when: (s: State) => boolean, action: (s: State, r: Rng) => Action): Policy {
  return (s, r) => (when(s) ? action(s, r) : sensible(s, r));
}
