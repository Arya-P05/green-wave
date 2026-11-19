import assert from "node:assert/strict";
import test from "node:test";
import { distanceFor, focalFor, LENSES, noseGain, PORTRAIT, SELFIE } from "./lens.ts";

test("a 12-inch selfie widens the nose by about 30%, like Ward et al.", () => {
  const gain = noseGain(SELFIE);
  assert.ok(gain > 1.27 && gain < 1.32, `got ${gain}`);
});

test("at 5 feet the change is small", () => {
  assert.ok(noseGain(PORTRAIT) < 1.07);
});

test("closer always means more distortion", () => {
  for (let d = 150; d < 3000; d += 50) assert.ok(noseGain(d) > noseGain(d + 50));
});

test("the longer the lens, the further back it puts you", () => {
  const ds = LENSES.map((l) => distanceFor(l.focal));
  assert.ok(ds[0] < ds[1] && ds[1] < ds[2]);
  assert.equal(Math.round(focalFor(distanceFor(26))), 26);
});
