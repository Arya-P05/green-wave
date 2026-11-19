import { AT_BACK, AT_LINE, BASELINE, COURT_W, NET_Y, partnerOf, teamOf, y, zone } from "./court.ts";
import type { Team } from "./court.ts";
import { PARAMS } from "./params.ts";
import type { Params } from "./params.ts";

/**
 * One doubles rally, one shot at a time.
 *
 * This is not physics. Each shot is a choice (what to hit, and whether to
 * move in afterwards) and a dice roll: does it go in, and if it does, how
 * nice a ball does it leave for the other side? The odds depend on where
 * the hitter is standing, the ball they got, and whether they were still
 * running when they hit it. While the ball is in the air, everyone moves.
 */

export type Kind = "serve" | "deep" | "short" | "soft" | "hard" | "lob";
export type Move = "in" | "hold";
export type Action = { kind: Kind; move: Move };

/** How attackable a ball is for whoever has to hit it next. */
export type Height = "low" | "mid" | "high";
export type Ball = {
  h: Height;
  /** 0 for a soft ball, up to 1 for a fast one from close range. */
  pace: number;
  bounce: boolean;
};

export type Player = { x: number; d: number; goal: number };

export type State = {
  players: Player[];
  server: Team;
  /** The number of the shot about to be hit: 1 is the serve. */
  shot: number;
  hitter: number;
  ball: Ball;
  /** The hitter had to run to reach this ball. */
  rushed: boolean;
};

export type Point = { x: number; y: number };

/** Everything needed to draw one shot. */
export type ShotEvent = {
  n: number;
  hitter: number;
  action: Action;
  label: string;
  from: Point;
  /** Where it bounces before the next player hits it, if it does. */
  land: Point | null;
  to: Point;
  /** Seconds in the air, contact to contact. */
  dur: number;
  /** How high the arc looks, in feet. */
  arc: number;
  fault: "net" | "out" | null;
  /** Every player at contact, and when the next player hits it. */
  before: Point[];
  after: Point[];
};

export type Rng = () => number;
export type Policy = (s: State, r: Rng) => Action;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const toward = (d: number, goal: number, step: number) => (Math.abs(goal - d) <= step ? goal : d + Math.sign(goal - d) * step);

/** 0 at the kitchen line, 1 at the baseline: how hard it is to hit a controlled shot from this far back. It grows faster than the distance: the last few feet are the worst. */
export const reach = (d: number, p: Params = PARAMS) => clamp((d - AT_LINE) / (BASELINE - AT_LINE), 0, 1.2) ** p.reachPow;

const pos = (players: Player[]): Point[] => players.map((p, i) => ({ x: p.x, y: y(teamOf(i), p.d) }));

/** The serving team's right-hand player serves; the returner is diagonally opposite. */
export const serverOf = (team: Team) => 2 * team + 1;

/** Both teams in their places for a serve. */
export function start(server: Team): State {
  const receiving = (1 - server) as Team;
  // Team 0's players stand at x = 5 and 15; team 1 faces them, so its right is our left.
  const players: Player[] = [
    { x: 5, d: AT_BACK, goal: AT_BACK },
    { x: 15, d: AT_BACK, goal: AT_BACK },
    { x: 15, d: AT_BACK, goal: AT_BACK },
    { x: 5, d: AT_BACK, goal: AT_BACK },
  ];
  // The returner's partner starts at the kitchen line.
  players[2 * receiving] = { ...players[2 * receiving], d: AT_LINE, goal: AT_LINE };
  return { players, server, shot: 1, hitter: serverOf(server), ball: { h: "mid", pace: 0, bounce: true }, rushed: false };
}

export const clone = (s: State): State => ({ ...s, players: s.players.map((p) => ({ ...p })), ball: { ...s.ball } });

/** Is the hitter still on their way somewhere when they hit? */
export const moving = (s: State) => {
  const p = s.players[s.hitter];
  return s.rushed || Math.abs(p.d - p.goal) > 1;
};

/** The everyday name for a shot, from where it was hit and what it was hit off. */
export function label(kind: Kind, s: State): string {
  const d = s.players[s.hitter].d;
  switch (kind) {
    case "serve":
      return "serve";
    case "deep":
      return "deep return";
    case "short":
      return "short return";
    case "soft":
      if (zone(d) === "kitchen") return "dink";
      return s.shot === 3 || s.ball.bounce ? "drop" : "reset";
    case "hard":
      if (s.ball.h === "high") return "put-away";
      return zone(d) === "kitchen" ? "speed-up" : "drive";
    case "lob":
      return "lob";
  }
}

/** The odds for one shot: the chance it misses, and if it doesn't, how attackable it is for them. */
export function odds(kind: Kind, s: State, p: Params = PARAMS): { err: number; high: number; mid: number } {
  const D = reach(s.players[s.hitter].d, p);
  const m = moving(s) ? 1 : 0;
  const { h, pace } = s.ball;
  switch (kind) {
    case "serve":
      return { err: p.serve.err, high: 0, mid: 1 };
    case "deep":
    case "short":
      return { err: p[kind].err, high: 0, mid: 1 };
    case "soft": {
      const q = p.soft;
      const easy = h === "high" ? 0.6 : 1;
      const err = easy * (q.err + q.errD * D + q.errPace * pace + q.errMoving * m + (h === "low" ? q.errLow : 0));
      const high = easy * (q.high + q.highD * D + q.highPace * pace + q.highMoving * m);
      const mid = q.mid + q.midD * D + q.midPace * pace + q.midMoving * m;
      return { err: clamp(err, 0.01, 0.9), high: clamp(high, 0, 0.9), mid: clamp(mid, 0, 1 - high) };
    }
    case "hard": {
      const q = p.hard;
      const err = q.err + q.errD * D + (h === "low" ? q.errLow : 0) + q.errPace * pace + q.errMoving * m + (h === "high" ? q.errHigh : 0);
      const high = h === "low" ? q.highFromLow : h === "mid" ? q.highFromMid : q.highFromHigh;
      const low = h === "low" ? q.lowFromLow : h === "mid" ? q.lowFromMid : q.lowFromHigh;
      return { err: clamp(err, 0.01, 0.9), high, mid: 1 - high - low };
    }
    case "lob": {
      const q = p.lob;
      const err = q.err + q.errPace * pace + q.errMoving * m;
      // For a lob, "low" means a good one that sends them back; "high" is a short one they can smash.
      return { err: clamp(err, 0.01, 0.9), high: 1 - q.good, mid: 0 };
    }
  }
}

/** The shots a player can choose from here. At the kitchen line, "move in" just means stay. */
export function choices(s: State): Action[] {
  if (s.shot === 1) return [{ kind: "serve", move: "hold" }];
  const kinds: Kind[] = s.shot === 2 ? ["deep", "short"] : ["soft", "hard", "lob"];
  const atLine = zone(s.players[s.hitter].d) === "kitchen";
  const moves: Move[] = atLine ? ["in"] : ["in", "hold"];
  return kinds.flatMap((kind) => moves.map((move) => ({ kind, move })));
}

/** How long the ball is in the air, roughly, over a distance in feet. */
function flight(kind: Kind, dist: number): number {
  switch (kind) {
    case "serve":
      return 1.9;
    case "deep":
      return 2.0;
    case "short":
      return 1.5;
    case "soft":
      return 0.8 + 0.03 * dist;
    case "hard":
      return 0.15 + dist / 60;
    case "lob":
      return 2.2;
  }
}

/**
 * Where the ball comes down on their side, as a depth, given how it came off
 * the paddle and where the receiver will be (`there`). A good soft ball lands
 * at their feet; an attackable one reaches them in the air.
 */
function landing(kind: Kind, out: Height, there: number, r: Rng): number {
  switch (kind) {
    case "serve":
      return 16 + 5 * r();
    case "deep":
    case "short":
      return out === "low" ? 15.5 + 5 * r() : 8.5 + 6 * r();
    case "soft":
      return out === "low" ? Math.max(2.5, there - 1 - 3 * r()) : out === "mid" ? there + 0.5 + 2 * r() : there + 1 + 3 * r();
    case "hard":
      return 14 + 7 * r();
    case "lob":
      return out === "low" ? 17 + 4 * r() : 10 + 4 * r();
  }
}

const ARC: Record<Kind, number> = { serve: 5, deep: 7, short: 5, soft: 4, hard: 1.5, lob: 14 };

export type Step = { next: State | null; winner: Team | null; ev: ShotEvent };

/** Hit one shot. Returns the state for the next hitter, or the winner if the rally is over. */
export function step(s: State, a: Action, r: Rng, p: Params = PARAMS): Step {
  const hitter = s.hitter;
  const T = teamOf(hitter);
  const O = (1 - T) as Team;
  const before = pos(s.players);
  const me = s.players[hitter];
  const from = before[hitter];
  const name = label(a.kind, s);
  const o = odds(a.kind, s, p);

  // Who it goes to.
  const receiver =
    s.shot === 1 ? serverOf(O) : s.shot === 2 ? (r() < 0.6 ? serverOf(O) : 2 * O) : 2 * O + (r() < 0.5 ? 1 : 0);
  const lane = s.players[receiver].x;
  const tx = clamp(lane + (r() - 0.5) * 5, 1.5, COURT_W - 1.5);

  // A miss ends the rally.
  if (r() < o.err) {
    const net = a.kind === "soft" || a.kind === "serve" ? r() < 0.75 : a.kind === "lob" ? false : r() < 0.45;
    const to = net ? { x: tx, y: NET_Y + (T === 0 ? -0.4 : 0.4) } : { x: tx, y: y(O, BASELINE + 2 + 2 * r()) };
    return {
      next: null,
      winner: O,
      ev: { n: s.shot, hitter, action: a, label: name, from, land: null, to, dur: net ? 0.6 : 1.1, arc: net ? 2 : ARC[a.kind], fault: net ? "net" : "out", before, after: before },
    };
  }

  // How it came off the paddle. For returns, "low" stands for "landed deep".
  const roll = r();
  let out: Height;
  if (a.kind === "deep" || a.kind === "short") out = roll < p[a.kind].deep ? "low" : "mid";
  else out = roll < o.high ? "high" : roll < o.high + o.mid ? "mid" : "low";

  const next = clone(s);
  const players = next.players;
  // Where the hitting team is headed. You can't come in before the serve bounces back.
  const goal = (d: number) => (a.move === "in" && a.kind !== "serve" ? AT_LINE : d);
  for (const i of [hitter, partnerOf(hitter)]) players[i].goal = goal(players[i].d);

  const t = flight(a.kind, me.d + s.players[receiver].d);
  const run = p.speed * t;
  players.forEach((pl, i) => {
    // The hitter loses a moment finishing the swing before they can move.
    if (i !== receiver) pl.d = toward(pl.d, pl.goal, i === hitter ? p.speed * Math.max(0, t - p.recover) : run);
  });

  // The receiver: volley it if the rules allow and it reaches them first; otherwise let it bounce.
  const rec = players[receiver];
  const there = toward(rec.d, rec.goal, run);
  const land = landing(a.kind, out, there, r);
  const volleyOK = s.shot + 1 >= 4;
  const goodLob = a.kind === "lob" && out === "low";
  let contact: number;
  let bounce: boolean;
  let rushed: boolean;
  if (land < there) {
    // It lands in front of them: run up to it, if there's time.
    const avail = p.speed * (t + 0.4);
    const need = rec.d - (land + 1.5);
    contact = need <= avail ? land + 1.5 : rec.d - avail;
    bounce = true;
    rushed = need > 0.75 * avail;
  } else if (volleyOK && !goodLob) {
    contact = there;
    bounce = false;
    rushed = false;
  } else {
    contact = land + 1.5;
    bounce = true;
    rushed = contact > there + 2;
  }
  rec.d = contact;
  // Partners move as a pair: if the receiver ran up for a short ball, their partner comes up level too.
  const mate = players[partnerOf(receiver)];
  if (contact < mate.d) mate.d = Math.max(contact, mate.d - p.speed * (t + 0.4));
  rec.x = clamp(tx + (r() - 0.5), 1, COURT_W - 1);

  // What the receiver gets.
  let h: Height;
  if (a.kind === "serve" || a.kind === "deep" || a.kind === "short") h = "mid";
  else if (a.kind === "lob") h = goodLob ? "mid" : "high";
  else if (a.kind === "hard" && bounce && out !== "high") h = "mid";
  else h = out;
  const pace = a.kind === "hard" ? clamp((34 - (me.d + contact)) / 18, 0, 1) * (bounce ? 0.4 : 1) : 0;

  next.shot = s.shot + 1;
  next.hitter = receiver;
  next.ball = { h, pace, bounce };
  next.rushed = rushed;

  const after = pos(players);
  return {
    next,
    winner: null,
    ev: {
      n: s.shot,
      hitter,
      action: a,
      label: name,
      from,
      land: bounce ? { x: tx, y: y(O, land) } : null,
      to: after[receiver],
      dur: t,
      arc: ARC[a.kind],
      fault: null,
      before,
      after,
    },
  };
}

export type Rally = { events: ShotEvent[]; winner: Team; states: State[] };

const MAX_SHOTS = 80;

/**
 * Play a rally out from a state. `first` overrides the policy for the first
 * shot only (that is how a "what if" works). `record` keeps every event and
 * state for drawing; leave it off for speed.
 */
export function play(s0: State, r: Rng, policy: Policy, opts: { first?: Action; record?: boolean; p?: Params } = {}): Rally {
  let s: State | null = s0;
  const events: ShotEvent[] = [];
  const states: State[] = [];
  let first = opts.first;
  for (let i = 0; i < MAX_SHOTS && s; i++) {
    const a: Action = first ?? policy(s, r);
    first = undefined;
    if (opts.record) states.push(clone(s));
    const st = step(s, a, r, opts.p);
    if (opts.record || st.winner !== null) events.push(st.ev);
    if (st.winner !== null) return { events, winner: st.winner, states };
    s = st.next;
  }
  // A rally that won't end: call it for whoever didn't hit last (never happens in practice).
  return { events, winner: s ? teamOf(s.hitter) : 0, states };
}
