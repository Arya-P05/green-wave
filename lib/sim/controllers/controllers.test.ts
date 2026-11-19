import assert from "node:assert/strict";
import test from "node:test";
import { CLEARANCE_S } from "../model.ts";
import { corridor, MAIN } from "../network.ts";
import type { CorridorSpec } from "../network.ts";
import { Sim } from "../sim.ts";
import { webster } from "../webster.ts";
import { actuated } from "./actuated.ts";
import { fixedTime } from "./fixed.ts";

test("Webster: C = (1.5L + 5) / (1 - Y), greens split by y", () => {
  // Two phases, L = 8 s: C = (12 + 5) / (1 - 0.5) = 34 s, usable green 26 s.
  assert.deepEqual(webster([0.3, 0.2]), { cycle: 34, greens: [16, 10] });
  // Near capacity the formula explodes; the cycle is capped.
  assert.equal(webster([0.6, 0.39]).cycle, 120);
});

test("fixed-time shows exactly the planned green every cycle", () => {
  const { network } = corridor({
    spacing: [],
    approach: 40,
    arm: 20,
    northbound: 0,
    southbound: 0,
    cross: [{ eastbound: 0, westbound: 0 }],
  });
  const ctl = fixedTime("fixed", [{ cycle: 50, greens: [24, 18], offset: 0 }]);
  const sim = new Sim(network, ctl, { seed: 1, record: true }).run(250);
  const main = sim.aspects![0];
  for (let c = 1; c < 4; c++) {
    const cycle = main.slice(c * 50, c * 50 + 50);
    assert.equal(cycle.filter((a) => a === "green").length, 24);
    assert.equal(cycle.filter((a) => a === "amber").length, 3);
    assert.equal(cycle[0], "green");
  }
  assert.equal(24 + 18 + 2 * CLEARANCE_S, 50);
});

const wave = (northbound: number): CorridorSpec => ({
  spacing: [60, 75, 50, 70],
  approach: 30,
  arm: 20,
  northbound,
  southbound: 0,
  cross: Array.from({ length: 5 }, () => ({ eastbound: 0.12, westbound: 0.12 })),
});

test("actuated rests in green when nobody waits on the other phase", () => {
  const spec = { ...wave(0.3), cross: wave(0).cross.map(() => ({ eastbound: 0, westbound: 0 })) };
  const { network } = corridor(spec);
  const sim = new Sim(network, actuated, { seed: 2 }).run(1000);
  assert.ok(sim.nodes.every((n) => n.phase === MAIN && n.since === 0));
});

