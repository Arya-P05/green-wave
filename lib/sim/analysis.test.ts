import assert from "node:assert/strict";
import test from "node:test";
import { platoonRatio, projectedArrivals } from "./analysis.ts";

test("projected arrivals assume free speed from the previous light", () => {
  // Lights at 0, 19 and 38; the car passes x = 0 at t = 3 and x = 19 at t = 20.
  const path = [2, -1, 3, 0, 20, 19, 21, 20];
  assert.deepEqual(projectedArrivals(path, [0, 19, 38], 1), [3 + 10, 20 + 10]);
});

test("platoon ratio compares arrivals on green with chance", () => {
  assert.equal(platoonRatio(30, 30), 1);
  assert.equal(platoonRatio(45, 30), 1.5);
});
