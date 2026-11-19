import assert from "node:assert/strict";
import test from "node:test";
import { calibrate } from "./stats.ts";

/**
 * The model is only worth listening to if sensible players in it look like
 * real ones. These are the published 4.0-ish numbers it's held to; see the
 * write-up for sources. Ranges, not points: the real numbers are noisy too.
 */
const c = calibrate(60000, 1);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

test("the serving team wins about 42-46% of rallies", () => {
  assert.ok(c.serveWin >= 0.42 && c.serveWin <= 0.46, pct(c.serveWin));
});

test("a deep return is worth a lot more than a short one (real: about 70% vs 50%)", () => {
  assert.ok(c.afterDeep >= 0.62 && c.afterDeep <= 0.72, `after deep ${pct(c.afterDeep)}`);
  assert.ok(c.afterShort >= 0.47 && c.afterShort <= 0.56, `after short ${pct(c.afterShort)}`);
  assert.ok(c.afterDeep - c.afterShort >= 0.08, "gap");
});

test("about half of returns land deep", () => {
  assert.ok(c.deepShare >= 0.45 && c.deepShare <= 0.55, pct(c.deepShare));
});

test("third-shot drop and drive win about equally", () => {
  assert.ok(Math.abs(c.vsDrop - c.vsDrive) <= 0.04, `${pct(c.vsDrop)} vs ${pct(c.vsDrive)}`);
});

test("third shots fail at least a fifth of the time, drops and drives alike", () => {
  assert.ok(c.dropFail >= 0.2 && c.dropFail <= 0.4, pct(c.dropFail));
  assert.ok(c.driveFail >= 0.2 && c.driveFail <= 0.4, pct(c.driveFail));
});

test("rallies last about 7 shots, like 3.5-4.5 players", () => {
  assert.ok(c.meanLength >= 6.5 && c.meanLength <= 8, c.meanLength.toFixed(2));
});

test("once the servers make it to the kitchen, it's close to even", () => {
  assert.ok(c.winWhenArrived >= 0.42 && c.winWhenArrived <= 0.55, pct(c.winWhenArrived));
});
