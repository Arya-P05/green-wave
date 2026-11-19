// The "what if" replays, off the main thread so the court never stutters.
// Given a rally (by seed), a shot and a choice, play that moment out many
// times and send back where each replay's ball went and who won.
import { sensible } from "@/lib/pickleball/policy";
import { clone, play, start } from "@/lib/pickleball/rally";
import type { Action, Point } from "@/lib/pickleball/rally";
import { replaySeed } from "@/lib/pickleball/value";
import { rng } from "@/lib/shared/random";

export type GhostRequest = { key: string; seed: number; server: 0 | 1; shot: number; action: Action };
export type Ghost = { path: Point[]; won: boolean };
export type GhostReply = { key: string; ghosts: Ghost[]; win: number };

/** How many shots of each replay to draw before jumping to where it ended. */
const SHOTS = 3;
/** Replays to score a choice with (the same seeds the experiment used, so the numbers match the write-up). */
export const REPLAYS = 600;
/** Of those, how many to draw. */
export const DRAWN = 200;

const worker = self as unknown as { onmessage: (e: MessageEvent<GhostRequest>) => void; postMessage: (m: GhostReply) => void };

worker.onmessage = ({ data }) => {
  const { key, seed, server, shot, action } = data;
  const rally = play(start(server), rng(seed), sensible, { record: true });
  const s = rally.states[shot - 1];
  const base = seed * 100 + shot - 1;
  const ghosts: Ghost[] = [];
  let wins = 0;
  for (let i = 0; i < REPLAYS; i++) {
    const g = play(clone(s), rng(replaySeed(base, i)), sensible, { first: action, record: true });
    if (i >= DRAWN) {
      if (g.winner === 0) wins++;
      continue;
    }
    const path: Point[] = [g.events[0].from];
    g.events.slice(0, SHOTS).forEach((ev) => {
      if (ev.land) path.push(ev.land);
      path.push(ev.to);
    });
    const last = g.events[g.events.length - 1];
    if (g.events.length > SHOTS) path.push(last.to);
    const won = g.winner === 0;
    if (won) wins++;
    if (i < DRAWN) ghosts.push({ path, won });
  }
  worker.postMessage({ key, ghosts, win: wins / REPLAYS });
};
