import type { Team } from "./court.ts";
import { rng } from "../shared/random.ts";

/**
 * A whole game from rally odds: traditional side-out scoring to 11, win by
 * 2. Only the serving team scores; each team gets two servers per turn,
 * except the very first turn of the game, which gets one.
 *
 * `serve[t]` is team t's chance of winning a rally it serves.
 */
export function gameWin(serve: [number, number], games: number, seed: number): number {
  const r = rng(seed);
  let wins = 0;
  for (let g = 0; g < games; g++) {
    // Alternate who serves first, so neither team gets that (tiny) edge.
    let serving = (g % 2) as Team;
    let server = 2; // the game starts at "0-0-2": one serve turn only
    const score = [0, 0];
    for (;;) {
      if (r() < serve[serving]) {
        score[serving]++;
        if (score[serving] >= 11 && score[serving] - score[1 - serving] >= 2) break;
      } else if (server === 1) server = 2;
      else {
        serving = (1 - serving) as Team;
        server = 1;
      }
    }
    if (score[0] > score[1]) wins++;
  }
  return wins / games;
}
