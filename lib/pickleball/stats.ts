import { zone } from "./court.ts";
import type { Team } from "./court.ts";
import { sensible } from "./policy.ts";
import { rng } from "../shared/random.ts";
import { label, play, start } from "./rally.ts";
import type { Policy, Rally } from "./rally.ts";
import type { Params } from "./params.ts";

/** The handful of numbers the model is tuned to match, measured over many seeded rallies. */
export type Calibration = {
  rallies: number;
  /** Share of rallies the serving team wins. */
  serveWin: number;
  serveErr: number;
  returnErr: number;
  /** Of returns that went in, the share that landed in the back third. */
  deepShare: number;
  /** Returning team's win rate after a deep / a short return. */
  afterDeep: number;
  afterShort: number;
  /** Returning team's win rate when the third shot was a drop / a drive. */
  vsDrop: number;
  vsDrive: number;
  dropShare: number;
  /** Serving team lost by shot 5 after hitting a drop / a drive (Gandhi's "failure"). */
  dropFail: number;
  driveFail: number;
  /** Shots per rally, counting the serve and the miss. */
  meanLength: number;
  /** Of rallies that reach the fifth shot, how often both servers make it to the kitchen. */
  serveArrive: number;
  /** The serving team's win rate when they do. */
  winWhenArrived: number;
  /** When someone at the kitchen line speeds up a ball that isn't a sitter, how often their team wins the rally. */
  speedupWin: number;
};

const rate = (a: number, b: number) => (b ? a / b : NaN);

export function calibrate(n: number, seed = 1, policy: Policy = sensible, p?: Params): Calibration {
  const r = rng(seed);
  const c = {
    serveWins: 0,
    serveErr: 0,
    returns: 0,
    returnErr: 0,
    deep: 0,
    deepWins: 0,
    short: 0,
    shortWins: 0,
    drop: 0,
    dropWins: 0,
    dropFail: 0,
    drive: 0,
    driveWins: 0,
    driveFail: 0,
    shots: 0,
    reach5: 0,
    arrived: 0,
    arrivedWins: 0,
    speedups: 0,
    speedupWins: 0,
  };
  for (let i = 0; i < n; i++) {
    const server = (i % 2) as Team;
    const rally: Rally = play(start(server), r, policy, { record: true, p });
    const { events, states, winner } = rally;
    const receiving = 1 - server;
    c.shots += events.length;
    if (winner === server) c.serveWins++;
    if (events.length === 1) c.serveErr++;
    if (events.length >= 2) {
      c.returns++;
      if (events.length === 2 && events[1].fault) c.returnErr++;
    }
    if (events.length >= 3) {
      // The return went in. Where did the third get hit from?
      const deep = events[1].land !== null && Math.abs(events[1].land.y - 22) > 44 / 3 - 0.01 ? true : false;
      if (deep) {
        c.deep++;
        if (winner === receiving) c.deepWins++;
      } else {
        c.short++;
        if (winner === receiving) c.shortWins++;
      }
      const third = events[2];
      const name = label(third.action.kind, states[2]);
      const failed = winner === receiving && events.length <= 5;
      if (name === "drop") {
        c.drop++;
        if (winner === receiving) c.dropWins++;
        if (failed) c.dropFail++;
      } else if (name === "drive") {
        c.drive++;
        if (winner === receiving) c.driveWins++;
        if (failed) c.driveFail++;
      }
    }
    states.forEach((s, k) => {
      if (k < 3 || events[k].action.kind !== "hard" || s.ball.h === "high" || zone(s.players[s.hitter].d) !== "kitchen") return;
      c.speedups++;
      if ((s.hitter < 2 ? 0 : 1) === winner) c.speedupWins++;
    });
    if (events.length >= 5) {
      c.reach5++;
      const servers = [2 * server, 2 * server + 1];
      const arrived = states.some((s) => servers.every((j) => zone(s.players[j].d) === "kitchen"));
      if (arrived) {
        c.arrived++;
        if (winner === server) c.arrivedWins++;
      }
    }
  }
  return {
    rallies: n,
    serveWin: rate(c.serveWins, n),
    serveErr: rate(c.serveErr, n),
    returnErr: rate(c.returnErr, c.returns),
    deepShare: rate(c.deep, c.deep + c.short),
    afterDeep: rate(c.deepWins, c.deep),
    afterShort: rate(c.shortWins, c.short),
    vsDrop: rate(c.dropWins, c.drop),
    vsDrive: rate(c.driveWins, c.drive),
    dropShare: rate(c.drop, c.drop + c.drive),
    dropFail: rate(c.dropFail, c.drop),
    driveFail: rate(c.driveFail, c.drive),
    meanLength: rate(c.shots, n),
    serveArrive: rate(c.arrived, c.reach5),
    winWhenArrived: rate(c.arrivedWins, c.arrived),
    speedupWin: rate(c.speedupWins, c.speedups),
  };
}

/** Team 0's rally win rates when serving and when receiving, playing `policy` against sensible opponents. */
export function teamRates(n: number, seed: number, policy: Policy): { serve: number; receive: number } {
  const r = rng(seed);
  const both: Policy = (s, rr) => (s.hitter < 2 ? policy(s, rr) : sensible(s, rr));
  let serveWins = 0;
  let receiveWins = 0;
  for (let i = 0; i < n; i++) {
    const server = (i % 2) as Team;
    const { winner } = play(start(server), r, both);
    if (winner === 0) {
      if (server === 0) serveWins++;
      else receiveWins++;
    }
  }
  return { serve: serveWins / Math.ceil(n / 2), receive: receiveWins / Math.floor(n / 2) };
}
