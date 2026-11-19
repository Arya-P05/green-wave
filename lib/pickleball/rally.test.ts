import assert from "node:assert/strict";
import test from "node:test";
import { AT_LINE, teamOf } from "./court.ts";
import { sensible } from "./policy.ts";
import { rng } from "../shared/random.ts";
import { choices, play, start, step } from "./rally.ts";

test("same seed, same rally", () => {
  const a = play(start(0), rng(42), sensible, { record: true });
  const b = play(start(0), rng(42), sensible, { record: true });
  assert.deepEqual(a, b);
});

test("the returner's partner starts at the kitchen line; everyone else at the back", () => {
  const s = start(0);
  assert.equal(s.players[2].d, AT_LINE);
  assert.ok(s.players[0].d > 20 && s.players[1].d > 20 && s.players[3].d > 20);
  assert.equal(s.hitter, 1);
});

test("two-bounce rule: the return and the third shot are always hit off the bounce", () => {
  const r = rng(7);
  for (let i = 0; i < 2000; i++) {
    const { events } = play(start((i % 2) as 0 | 1), r, sensible, { record: true });
    for (const ev of events.slice(0, 2)) if (!ev.fault) assert.ok(ev.land, `shot ${ev.n} must bounce`);
  }
});

test("shots alternate between the teams, and a miss ends the rally for the other side", () => {
  const r = rng(3);
  for (let i = 0; i < 500; i++) {
    const { events, winner } = play(start(1), r, sensible, { record: true });
    events.forEach((ev, j) => {
      if (j > 0) assert.notEqual(teamOf(ev.hitter), teamOf(events[j - 1].hitter));
    });
    const last = events[events.length - 1];
    assert.ok(last.fault);
    assert.equal(winner, 1 - teamOf(last.hitter));
  }
});

test("the serving team can't come in on the serve", () => {
  const s = start(0);
  assert.deepEqual(choices(s), [{ kind: "serve", move: "hold" }]);
  const { next } = step(s, { kind: "serve", move: "hold" }, () => 0.99);
  assert.ok(next && next.players[0].goal > 20 && next.players[1].goal > 20);
});

test("at the kitchen line there is no 'hold' to choose: you're already in", () => {
  const s = { ...start(0), shot: 6, hitter: 2 };
  assert.ok(choices(s).every((a) => a.move === "in"));
});
