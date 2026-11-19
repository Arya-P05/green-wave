import assert from "node:assert/strict";
import test from "node:test";
import { CLEARANCE_S, FREE_SPEED, SATURATION_FLOW } from "./model.ts";
import { corridor, MAIN, SIDE } from "./network.ts";
import { rng } from "./random.ts";
import { Sim } from "./sim.ts";
import type { Controller } from "./sim.ts";

const always = (phase: number): Controller => ({ name: "always", choose: () => phase });

const single = (northbound: number, eastbound = 0) =>
  corridor({
    spacing: [],
    approach: 200,
    arm: 40,
    northbound,
    southbound: 0,
    cross: [{ eastbound, westbound: 0 }],
  });

test("the PRNG is deterministic per seed", () => {
  const a = rng(7);
  const b = rng(7);
  const c = rng(8);
  const xs = Array.from({ length: 5 }, a);
  assert.deepEqual(xs, Array.from({ length: 5 }, b));
  assert.notDeepEqual(xs, Array.from({ length: 5 }, c));
  for (const x of xs) assert.ok(x >= 0 && x < 1);
});

test("the same seed gives the same run", () => {
  const run = (seed: number) => {
    const { network } = corridor({
      spacing: [60, 60],
      approach: 40,
      arm: 20,
      northbound: 0.2,
      southbound: 0.2,
      cross: [0, 1, 2].map(() => ({ eastbound: 0.1, westbound: 0.1 })),
    });
    const flip: Controller = { name: "flip", choose: (_s, _n, t) => (t % 60 < 30 ? MAIN : SIDE) };
    return new Sim(network, flip, { seed }).run(600).trips;
  };
  assert.deepEqual(run(1), run(1));
  assert.notDeepEqual(run(1), run(2));
});

test("a lone car drives at free speed and never stops", () => {
  const { network } = single(0);
  network.links[0].demand = 1; // exactly one car, then switch the source off
  const sim = new Sim(network, always(MAIN), { seed: 3 });
  sim.step();
  network.links[0].demand = 0;
  sim.run(400);
  assert.equal(sim.trips.length, 1);
  const [trip] = sim.trips;
  const cells = 200 + 200;
  const expected = cells / FREE_SPEED;
  assert.ok(Math.abs(trip.done - trip.born - expected) < expected * 0.1);
  assert.equal(trip.stops, 0);
});

test("nobody crosses a red", () => {
  const { network, index } = single(0.3);
  const sim = new Sim(network, always(SIDE), { seed: 4 }).run(1200);
  assert.equal(sim.trips.filter((t) => t.origin === index.northbound[0]).length, 0);
  assert.equal(sim.count(index.northbound[0]), sim.arrivals);
});

test("cars are conserved", () => {
  const { network } = corridor({
    spacing: [40, 80, 30],
    approach: 30,
    arm: 15,
    northbound: 0.3,
    southbound: 0.25,
    cross: [0, 1, 2, 3].map(() => ({ eastbound: 0.15, westbound: 0.1 })),
  });
  const flip: Controller = { name: "flip", choose: (_s, n, t) => ((t + 7 * n) % 50 < 28 ? MAIN : SIDE) };
  const sim = new Sim(network, flip, { seed: 5 }).run(1800);
  const inside = network.links.reduce((n, _, l) => n + sim.count(l), 0);
  assert.equal(sim.trips.length + inside, sim.arrivals);
});

test("a phase change costs exactly the clearance interval", () => {
  const { network } = single(0);
  const ctl: Controller = { name: "once", choose: (_s, _n, t) => (t < 10 ? MAIN : SIDE) };
  const sim = new Sim(network, ctl, { seed: 6, record: true }).run(30);
  const side = network.nodes[0].phases[SIDE][0];
  const main = sim.aspects![0];
  assert.deepEqual(main.slice(9, 15), ["green", "amber", "amber", "amber", "red", "red"]);
  assert.equal(sim.nodes[0].phase, SIDE);
  assert.equal(sim.aspect(side), "green");
  assert.equal(sim.nodes[0].since, 10 + CLEARANCE_S);
});

test("a standing queue drains at the saturation flow", () => {
  const rates = [1, 2, 3, 4, 5].map((seed) => {
    const { network } = single(0.9);
    const ctl: Controller = { name: "red-then-green", choose: (_s, _n, t) => (t < 300 ? SIDE : MAIN) };
    const sim = new Sim(network, ctl, { seed }).run(300 + CLEARANCE_S + 110);
    const before = sim.trips.length;
    sim.run(200);
    return (sim.trips.length - before) / 200;
  });
  const mean = rates.reduce((a, b) => a + b) / rates.length;
  assert.ok(Math.abs(mean - SATURATION_FLOW) < 0.02, `measured ${mean}`);
});

test("ring road: no car leaves, and a fuller road is slower with no lights at all", async () => {
  const { meanSpeed, ring } = await import("../ring.ts");
  const speed = (cars: number) => {
    const s = ring(cars).run(600);
    assert.equal(s.onRoad().length, cars);
    return meanSpeed(s);
  };
  assert.ok(speed(12) > 1.8, "a nearly empty ring flows at free speed");
  assert.ok(speed(60) < 1, "half full, jams form from nothing");
});

test("two-lane ring: each lane keeps its own cars", async () => {
  const { ring } = await import("../ring.ts");
  const s = ring(30, 1, 2).run(300);
  s.cells.forEach((lane, l) => {
    const ids = lane.filter((c) => c).map((c) => c!.id);
    assert.equal(ids.length, 30);
    assert.ok(ids.every((id) => Math.floor(id / 30) === l));
  });
});
