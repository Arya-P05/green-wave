import resultsData from "@/data/pickleball/results.json";
import type { Calibration } from "@/lib/pickleball/stats";
import type { Action } from "@/lib/pickleball/rally";
import { sensible } from "@/lib/pickleball/policy";
import { label, play, start } from "@/lib/pickleball/rally";
import { rng } from "@/lib/shared/random";

/**
 * Every simulated number the sliding-doors prose quotes, read from the
 * experiment's output (npm run pickleball:experiment) so the words can't
 * drift from the data.
 */
export type Family = "return" | "third" | "transition" | "kitchen";
export type FamilyResult = {
  perRally: number;
  cost: number;
  shot: number;
  move: number;
  stake: number;
  lostPerRally: number;
  best: { name: string; share: number }[];
};
export type PolicyResult = { key: string; label: string; serve: number; receive: number; rally: number; game: number };
export type Decision = { shot: number; cost: number; win: number; best: Action; bestWin: number };
export type PickedRally = { seed: number; server: 0 | 1; meter: number[]; decisions: Decision[] };
export type Results = {
  calibration: Calibration;
  decisions: Record<Family, FamilyResult>;
  sample: { rallies: number; replays: number };
  policies: PolicyResult[];
  policyRallies: number;
  games: number;
  replays: { depth: number; meter: number; decision: number };
  depth: { ds: number[]; soft: number[]; hard: number[] };
  rallies: PickedRally[];
};

export const results = resultsData as Results;
export const cal = results.calibration;
export const fam = (f: Family) => results.decisions[f];
export const policy = (key: string) => results.policies.find((p) => p.key === key)!;
export const baseline = policy("sensible");
/** Change in game win chance from one habit, in points. */
export const gameGain = (key: string) => policy(key).game - baseline.game;

/** 0.634 → "63%". */
export const pct = (x: number) => `${Math.round(x * 100)}%`;
/** 0.634 → "63.4%". */
export const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;
/** A difference in win chance as points: 0.107 → "11". */
export const pts = (x: number) => `${Math.round(Math.abs(x) * 100)}`;
/** Signed points: +11 / −9. */
export const signed = (x: number) => `${x >= 0 ? "+" : "−"}${pts(x)}`;
export const n = (x: number) => x.toLocaleString("en-US");

/** The story's point: rally 1 in the demo, with the shot names and costs the prose needs. */
export function storyPoint() {
  const p = results.rallies[0];
  const rally = play(start(p.server), rng(p.seed), sensible, { record: true });
  const name = (shot: number, a = rally.events[shot - 1].action) => label(a.kind, rally.states[shot - 1]);
  const worst = p.decisions.reduce((a, b) => (b.cost > a.cost ? b : a));
  const third = p.decisions.find((d) => d.shot === 3)!;
  return {
    shots: rally.events.length,
    /** Your chance right before the third shot, and right after it. */
    beforeThird: p.meter[2],
    afterThird: p.meter[3],
    thirdCost: third.cost,
    worst,
    worstName: name(worst.shot),
    bestName: name(worst.shot, worst.best),
    theirShot: name(worst.shot - 1),
  };
}
