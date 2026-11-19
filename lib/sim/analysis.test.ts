import assert from "node:assert/strict";
import test from "node:test";
import { progressionLift, stoppedAt } from "./analysis.ts";

test("stops are attributed to the light the car was approaching", () => {
  // Lights at 10 and 20. Drives at 2, halts at 8 (before light 0), creeps, then runs through 20.
  const xs = [0, 2, 4, 6, 8, 8, 8, 9, 9, 11, 13, 15, 17, 19, 21, 23];
  const path = xs.flatMap((x, t) => [t, x]);
  assert.deepEqual(stoppedAt(path, [10, 20], 1), [true, false]);
  // The creep (9, 9) after the halt is not a second stop: the car never got back to full speed.
  const back = xs.map((x) => 30 - x).flatMap((x, t) => [t, x]);
  assert.deepEqual(stoppedAt(back, [20, 10], -1), [true, false]);
});

test("progression lift is 1 for independent lights and above 1 when stops come in runs", () => {
  const independent = [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ];
  assert.equal(progressionLift(independent), 1);
  const wave = [
    [false, false, false],
    [true, true, true],
  ];
  assert.equal(progressionLift(wave), 2);
});
