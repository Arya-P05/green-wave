import assert from "node:assert/strict";
import test from "node:test";
import { CLEARANCE_S } from "../model.ts";
import { corridor, MAIN, SIDE } from "../network.ts";
import type { CorridorSpec } from "../network.ts";
import { controllerFor, metrics } from "../scenario.ts";
import { Sim } from "../sim.ts";
import { webster } from "../webster.ts";
import { actuated, MIN_GREEN_S } from "./actuated.ts";
import { fixedTime } from "./fixed.ts";
import { maxPressure, maxPressurePlus } from "./max-pressure.ts";
import { cliff } from "../../cliff.ts";

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

test("a green wave carries a light platoon through every light; no offsets do not", () => {
  const band = (kind: "fixed" | "green-wave") => {
    let clean = 0;
    let trips = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const spec = wave(0.08);
      const { network, index } = corridor(spec);
      const sim = new Sim(network, controllerFor(kind, spec, network), { seed }).run(3000);
      const through = sim.trips.filter((t) => t.born > 600 && t.origin === index.northbound[0]);
      trips += through.length;
      clean += through.filter((t) => t.stops <= 1).length;
    }
    return clean / trips;
  };
  const withWave = band("green-wave");
  const without = band("fixed");
  assert.ok(withWave > without + 0.2, `wave ${withWave} vs none ${without}`);
});

test("actuated rests in green when nobody waits on the other phase", () => {
  const spec = { ...wave(0.3), cross: wave(0).cross.map(() => ({ eastbound: 0, westbound: 0 })) };
  const { network } = corridor(spec);
  const sim = new Sim(network, actuated, { seed: 2 }).run(1000);
  assert.ok(sim.nodes.every((n) => n.phase === MAIN && n.since === 0));
});

test("max-pressure serves a side queue once it outweighs the main street, never before min green", () => {
  const { network } = corridor({
    spacing: [],
    approach: 40,
    arm: 30,
    northbound: 0.05,
    southbound: 0,
    cross: [{ eastbound: 0.3, westbound: 0 }],
  });
  const sim = new Sim(network, maxPressure, { seed: 3, record: true }).run(600);
  const main = sim.aspects![0];
  assert.ok(main.includes("red"));
  // Every main green lasts at least the minimum (the last one may be cut off by the end of the run).
  const greens = main.join("").split(/amber|red/).filter(Boolean).map((g) => g.length / 5);
  for (const g of greens.slice(0, -1)) assert.ok(g >= MIN_GREEN_S, `green of ${g}s`);
  assert.ok(sim.trips.some((t) => t.origin === network.nodes[0].phases[SIDE][0]));
});

test("max-pressure+ survives a busy intersection that breaks the textbook rule", () => {
  const delay = (ctl: typeof maxPressure) => {
    let total = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const { network, index } = cliff(0.85);
      const sim = new Sim(network, ctl, { seed, warmup: 600 }).run(3000);
      total += metrics(sim, index, 600).delay;
    }
    return total / 3;
  };
  const textbook = delay(maxPressure);
  const plus = delay(maxPressurePlus);
  assert.ok(plus < textbook / 2, `plus ${plus} vs textbook ${textbook}`);
});

test("be the light: a light that never switches loses to every controller", async () => {
  const { byHand, gameStart, rivalScore, RIVALS } = await import("../../game.ts");
  const you = byHand();
  const { sim, end } = gameStart(you);
  you.want = sim.nodes[0].phase;
  sim.run(end);
  for (const k of RIVALS) assert.ok(sim.delay > rivalScore(k), k);
  assert.equal(rivalScore("actuated"), rivalScore("actuated"), "the rivals' runs are deterministic");
});
