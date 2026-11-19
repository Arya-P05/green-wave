import assert from "node:assert/strict";
import test from "node:test";
import { gameWin } from "./game.ts";
import { sensible } from "./policy.ts";
import { rng } from "../shared/random.ts";
import { play, start } from "./rally.ts";
import { cost, options, replays, share } from "./value.ts";

test("replays of the same moment with the same seed are identical", () => {
  const s = start(0);
  assert.deepEqual(replays(s, 50, 9), replays(s, 50, 9));
});

test("every option is scored, and the chosen one costs nothing if it's the best", () => {
  const rally = play(start(0), rng(5), sensible, { record: true });
  const s = rally.states[2];
  const opts = options(s, 200, 1);
  assert.equal(opts.length, 6);
  for (const o of opts) assert.ok(o.win >= 0 && o.win <= 1);
  const c = cost(opts, opts[0].action, 0);
  assert.ok(c.total >= 0 && c.stake >= c.total - 1e-9);
  assert.ok(Math.abs(c.shot + c.move - c.total) < 1e-9);
});

test("the returning team is favoured from the first shot", () => {
  assert.ok(share(replays(start(0), 4000, 2), 1) > 0.5);
});

test("game odds: equal teams split games, a better server wins more", () => {
  const even = gameWin([0.44, 0.44], 20000, 1);
  assert.ok(Math.abs(even - 0.5) < 0.02, String(even));
  assert.ok(gameWin([0.47, 0.44], 20000, 1) > 0.53);
});
