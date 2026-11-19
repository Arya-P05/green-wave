// The pickleball experiment: every number the write-up quotes, into data/pickleball/results.json.
// npm run pickleball:experiment (a few minutes). Seeded, so it comes out the same every time.
import { writeFileSync } from "node:fs";
import { AT_LINE, teamOf, zone } from "../../lib/pickleball/court.ts";
import { gameWin } from "../../lib/pickleball/game.ts";
import { defaultMove, sensible } from "../../lib/pickleball/policy.ts";
import { clamp, label, play, start } from "../../lib/pickleball/rally.ts";
import type { Action, Kind, Policy, State } from "../../lib/pickleball/rally.ts";
import { calibrate, teamRates } from "../../lib/pickleball/stats.ts";
import { cost, options, replays, share } from "../../lib/pickleball/value.ts";
import { rng } from "../../lib/shared/random.ts";

const t0 = performance.now();
const log = (msg: string) => console.log(`${((performance.now() - t0) / 1000).toFixed(0).padStart(4)}s  ${msg}`);

// 1. Calibration: sensible players against sensible players.
const calibration = calibrate(200000, 1);
log("calibration");

// 2. Which decisions matter: sample moments from ordinary rallies and replay every option.
type Family = "return" | "third" | "transition" | "kitchen";
const familyOf = (s: State): Family | null =>
  s.shot === 1 ? null : s.shot === 2 ? "return" : s.shot === 3 ? "third" : zone(s.players[s.hitter].d) === "kitchen" ? "kitchen" : "transition";
const SAMPLE = 2000;
const REPLAYS = 240;
const acc: Record<Family, { n: number; total: number; shot: number; move: number; stake: number; best: Record<string, number> }> = {
  return: { n: 0, total: 0, shot: 0, move: 0, stake: 0, best: {} },
  third: { n: 0, total: 0, shot: 0, move: 0, stake: 0, best: {} },
  transition: { n: 0, total: 0, shot: 0, move: 0, stake: 0, best: {} },
  kitchen: { n: 0, total: 0, shot: 0, move: 0, stake: 0, best: {} },
};
{
  const r = rng(2);
  for (let i = 0; i < SAMPLE; i++) {
    const rally = play(start((i % 2) as 0 | 1), r, sensible, { record: true });
    rally.states.forEach((s, k) => {
      const f = familyOf(s);
      if (!f) return;
      const c = cost(options(s, REPLAYS, 1000 * i + k), rally.events[k].action, teamOf(s.hitter));
      const a = acc[f];
      a.n++;
      a.total += c.total;
      a.shot += c.shot;
      a.move += c.move;
      a.stake += c.stake;
      const name = `${label(c.best.kind, s)}${f === "kitchen" || f === "return" ? "" : c.best.move === "in" ? ", move in" : ", hold"}`;
      a.best[name] = (a.best[name] ?? 0) + 1;
    });
  }
}
const decisions = Object.fromEntries(
  Object.entries(acc).map(([f, a]) => [
    f,
    {
      perRally: a.n / SAMPLE,
      cost: a.total / a.n,
      shot: a.shot / a.n,
      move: a.move / a.n,
      stake: a.stake / a.n,
      /** Win chance a 4.0 player gives away here per rally (both teams' decisions count). */
      lostPerRally: a.total / SAMPLE,
      best: Object.entries(a.best)
        .sort((x, y) => y[1] - x[1])
        .slice(0, 4)
        .map(([name, k]) => ({ name, share: k / a.n })),
    },
  ]),
);
log("decisions");

// 3. Whole-game what-ifs: change one habit for your team only, against sensible opponents.
const onlyWhen = (when: (s: State) => boolean, pick: (s: State, r: () => number) => Action): Policy => (s, r) =>
  when(s) ? pick(s, r) : sensible(s, r);
const kind = (k: Kind): ((s: State, r: () => number) => Action) => (s, r) => ({ kind: k, move: defaultMove(k, s, r) });
const notKitchen = (s: State) => zone(s.players[s.hitter].d) !== "kitchen";
const withMove = (move: "in" | "hold") => (s: State, r: () => number): Action => ({ ...sensible(s, r), move });
const POLICIES: { key: string; label: string; policy: Policy }[] = [
  { key: "sensible", label: "a sensible 4.0 player (the baseline)", policy: sensible },
  { key: "deep", label: "aim every return deep", policy: onlyWhen((s) => s.shot === 2, kind("deep")) },
  { key: "short", label: "just get every return in", policy: onlyWhen((s) => s.shot === 2, kind("short")) },
  { key: "drop3", label: "always drop the third", policy: onlyWhen((s) => s.shot === 3, kind("soft")) },
  { key: "drive3", label: "always drive the third", policy: onlyWhen((s) => s.shot === 3, kind("hard")) },
  {
    key: "followDrive",
    label: "always follow a drive in",
    policy: (s, r) => {
      const a = sensible(s, r);
      return a.kind === "hard" && notKitchen(s) ? { ...a, move: "in" } : a;
    },
  },
  {
    key: "holdDrive",
    label: "never follow a drive in",
    policy: (s, r) => {
      const a = sensible(s, r);
      return a.kind === "hard" && notKitchen(s) ? { ...a, move: "hold" } : a;
    },
  },
  { key: "alwaysIn", label: "always move in after every shot", policy: onlyWhen((s) => s.shot >= 3, withMove("in")) },
  { key: "neverIn", label: "stay back after every shot", policy: onlyWhen((s) => s.shot >= 3, withMove("hold")) },
  {
    key: "reset",
    label: "in no-man's land, always reset soft",
    policy: onlyWhen((s) => s.shot >= 4 && zone(s.players[s.hitter].d) === "transition", kind("soft")),
  },
  {
    key: "bang",
    label: "in no-man's land, always drive",
    policy: onlyWhen((s) => s.shot >= 4 && zone(s.players[s.hitter].d) === "transition", kind("hard")),
  },
  {
    key: "patient",
    label: "at the kitchen, never speed up a ball below the net",
    policy: onlyWhen((s) => s.shot >= 4 && zone(s.players[s.hitter].d) === "kitchen" && s.ball.h === "low", kind("soft")),
  },
  {
    key: "attack",
    label: "at the kitchen, attack every ball at net height",
    policy: onlyWhen((s) => s.shot >= 4 && zone(s.players[s.hitter].d) === "kitchen" && s.ball.h === "mid", kind("hard")),
  },
  {
    key: "dinkMid",
    label: "at the kitchen, keep dinking even balls at net height",
    policy: onlyWhen((s) => s.shot >= 4 && zone(s.players[s.hitter].d) === "kitchen" && s.ball.h === "mid", kind("soft")),
  },
];
const POLICY_RALLIES = 200000;
const policies = POLICIES.map(({ key, label: name, policy }) => {
  const { serve, receive } = teamRates(POLICY_RALLIES, 3, policy);
  return { key, label: name, serve, receive, rally: (serve + receive) / 2, game: gameWin([serve, 1 - receive], 100000, 4) };
});
log("policies");

// 4. No-man's land: your team's chance from each depth, with them at the kitchen line.
const DEPTHS = Array.from({ length: 16 }, (_, i) => 7.5 + i);
const at = (d: number, ball: "soft" | "hard"): State => {
  const s = start(1);
  s.players[0] = { x: 5, d, goal: AT_LINE };
  s.players[1] = { x: 15, d, goal: AT_LINE };
  s.players[2] = { x: 15, d: AT_LINE, goal: AT_LINE };
  s.players[3] = { x: 5, d: AT_LINE, goal: AT_LINE };
  s.shot = 6;
  s.hitter = 0;
  const volley = d <= 17;
  s.ball =
    ball === "soft"
      ? { h: "low", pace: 0, bounce: true }
      : { h: "mid", pace: clamp((34 - (AT_LINE + d)) / 18, 0, 1) * (volley ? 1 : 0.4), bounce: !volley };
  return s;
};
const depth = {
  ds: DEPTHS,
  soft: DEPTHS.map((d, i) => share(replays(at(d, "soft"), 8000, 50 + i), 0)),
  hard: DEPTHS.map((d, i) => share(replays(at(d, "hard"), 8000, 90 + i), 0)),
};
log("depth");

// 5. The rallies in the demo: ones you lose, where one decision clearly gave away the most.
type Picked = { seed: number; server: 0 | 1; meter: number[]; decisions: { shot: number; cost: number; win: number; best: Action; bestWin: number }[] };
const DECISION_REPLAYS = 600;
function examine(seed: number, server: 0 | 1): Picked | null {
  const rally = play(start(server), rng(seed), sensible, { record: true });
  if (rally.winner !== 1 || rally.events.length < 6 || rally.events.length > 11) return null;
  const decisions = rally.states.flatMap((s, k) => {
    if (teamOf(s.hitter) !== 0 || s.shot === 1) return [];
    const opts = options(s, DECISION_REPLAYS, seed * 100 + k);
    const c = cost(opts, rally.events[k].action, 0);
    const mine = opts.find((o) => o.action.kind === rally.events[k].action.kind && o.action.move === rally.events[k].action.move)!;
    const best = opts.find((o) => o.action.kind === c.best.kind && o.action.move === c.best.move)!;
    return [{ shot: k + 1, cost: c.total, win: mine.win, best: c.best, bestWin: best.win }];
  });
  if (decisions.length < 2) return null;
  const sorted = [...decisions].sort((a, b) => b.cost - a.cost);
  if (sorted[0].cost < 0.08 || sorted[0].cost < 1.8 * sorted[1].cost) return null;
  const meter = rally.states.map((s, k) => share(replays(s, 800, seed * 1000 + k), 0));
  return { seed, server, meter: [...meter, 0], decisions };
}
const rallies: Picked[] = [];
// First: the story's point. You serve, drive the third, follow it in, and lose it soon after.
for (let seed = 1; rallies.length < 1; seed++) {
  const rally = play(start(0), rng(seed), sensible, { record: true });
  const third = rally.events[2];
  if (!third || third.fault || label(third.action.kind, rally.states[2]) !== "drive" || third.action.move !== "in") continue;
  const p = examine(seed, 0);
  if (p) rallies.push(p);
}
for (let seed = 1; rallies.length < 6; seed++) {
  const server = (seed % 2) as 0 | 1;
  if (rallies.some((p) => p.seed === seed)) continue;
  const p = examine(seed, server);
  if (p) rallies.push(p);
}
log("rallies");

const results = { calibration, decisions, sample: { rallies: SAMPLE, replays: REPLAYS }, policies, policyRallies: POLICY_RALLIES, depth, rallies };
writeFileSync(new URL("../../data/pickleball/results.json", import.meta.url), JSON.stringify(results, (_, v) => (typeof v === "number" ? Math.round(v * 10000) / 10000 : v)) + "\n");
log("wrote data/pickleball/results.json");
