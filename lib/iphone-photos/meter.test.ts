import assert from "node:assert/strict";
import test from "node:test";
import { average, render } from "./meter.ts";

test("what you meter on comes out middle grey", () => {
  const { v, clipped } = render(2, 2);
  assert.equal(clipped, null);
  assert.ok(v > 0.4 && v < 0.55);
});

test("far brighter than the meter reading clips to white, far darker to black", () => {
  assert.equal(render(6, 0).clipped, "white");
  assert.equal(render(-6, 0).clipped, "black");
});

test("a bright sky drags an average meter up", () => {
  const face = { key: "face", name: "face", stops: -1, area: 1 };
  const sky = { key: "sky", name: "sky", stops: 3, area: 3 };
  assert.ok(average([face, sky]) > 2);
  assert.ok(render(face.stops, average([face, sky])).v < 0.3);
});
