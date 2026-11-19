import assert from "node:assert/strict";
import test from "node:test";
import { direction, geometry, shade } from "./head.ts";

const g = geometry(60, 64);
const at = (out: Float32Array, fx: number, fy: number) => out[Math.floor(fy * g.h) * g.w + Math.floor(fx * g.w)];

test("the face is in the middle of the picture, with empty space at the top corners", () => {
  assert.equal(g.cover[Math.floor(0.4 * g.h) * g.w + Math.floor(0.5 * g.w)], 1);
  assert.equal(g.cover[0], 0);
  assert.ok(Number.isNaN(g.pos[0]));
});

test("the outline has pixels that are partly covered, so it isn't stair-stepped", () => {
  assert.ok(g.cover.some((c) => c > 0.05 && c < 0.95));
});

test("light from the camera lights the face; light from behind leaves it dark and the backdrop bright", () => {
  const out = new Float32Array(g.w * g.h);
  shade(g, { azimuth: 0, elevation: 10, size: 0.2 }, out);
  const front = at(out, 0.5, 0.42);
  const bgBack = shade(g, { azimuth: 180, elevation: 10, size: 0.2 }, out);
  const back = at(out, 0.5, 0.42);
  assert.ok(front > 0.7, `front ${front}`);
  assert.ok(back < 0.25, `back ${back}`);
  assert.ok(bgBack > 0.9);
});

test("side light leaves one cheek much darker than the other", () => {
  const out = new Float32Array(g.w * g.h);
  shade(g, { azimuth: 90, elevation: 10, size: 0.1 }, out);
  assert.ok(at(out, 0.74, 0.5) - at(out, 0.26, 0.5) > 0.4);
});

test("directions are unit vectors", () => {
  const [x, y, z] = direction({ azimuth: 37, elevation: 21, size: 0 });
  assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-9);
});
