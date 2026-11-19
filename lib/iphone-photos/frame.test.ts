import assert from "node:assert/strict";
import test from "node:test";
import { preferred, verdict } from "./frame.ts";

test("facing you, the preferred spot is the centre", () => {
  assert.equal(preferred("you"), 0.5);
  assert.equal(verdict(0.5, "you"), "centre");
});

test("facing right on the left third looks into the frame; on the right third, out of it", () => {
  assert.equal(verdict(1 / 3, "right"), "inward");
  assert.equal(verdict(2 / 3, "right"), "outward");
  assert.equal(verdict(2 / 3, "left"), "inward");
});
