import assert from "node:assert/strict";
import test from "node:test";
import { backgroundScale, blur } from "./blur.ts";

test("the reference shot is 1", () => {
  assert.equal(blur(1, 1), 1);
});

test("a further wall blurs more, but it levels off", () => {
  assert.ok(blur(1, 3) > blur(1, 1));
  assert.ok(blur(1, 100) < 2);
});

test("stepping closer to your friend blurs the background more", () => {
  assert.ok(blur(0.5, 2) > blur(1, 2));
});

test("a wall right behind them stays sharp", () => {
  assert.ok(blur(1, 0.05) < 0.1);
  assert.ok(backgroundScale(1, 0) === 1);
});
