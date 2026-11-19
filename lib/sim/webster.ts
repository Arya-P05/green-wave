import { CLEARANCE_S } from "./model.ts";

/** Longest cycle any real controller would run; Webster's formula blows up as Y nears 1. */
export const MAX_CYCLE_S = 120;
export const MIN_CYCLE_S = 30;

export type Timing = { cycle: number; greens: number[] };

/**
 * Webster (1958). Each phase's critical flow ratio y is its busiest approach's
 * demand over the saturation flow. With Y = sum(y) and lost time L, the
 * delay-minimizing cycle is C = (1.5L + 5) / (1 - Y), and the usable green
 * C - L is split in proportion to y.
 */
export function webster(y: number[], cycle?: number): Timing {
  const L = y.length * CLEARANCE_S;
  const Y = y.reduce((a, b) => a + b, 0);
  if (!(Y > 0)) throw new Error("Webster needs some demand");
  const ideal = Y < 1 ? (1.5 * L + 5) / (1 - Y) : Infinity;
  const C = cycle ?? Math.round(Math.min(MAX_CYCLE_S, Math.max(MIN_CYCLE_S, ideal)));
  const greens = y.map((yi) => Math.round(((C - L) * yi) / Y));
  // Give rounding drift to the last phase so the greens fill the cycle exactly.
  greens[greens.length - 1] = C - L - greens.slice(0, -1).reduce((a, b) => a + b, 0);
  return { cycle: C, greens };
}

/**
 * Webster's delay formula: average delay per car (s) on one approach with
 * cycle C, green ratio λ = g/C, arrivals q (cars/s) and degree of
 * saturation x = q / (λs). Only meaningful for x < 1.
 */
export function websterDelay(C: number, g: number, q: number, s: number): number {
  const lambda = g / C;
  const x = q / (lambda * s);
  if (x >= 1) return Infinity;
  return (
    (C * (1 - lambda) ** 2) / (2 * (1 - lambda * x)) +
    x ** 2 / (2 * q * (1 - x)) -
    0.65 * Math.cbrt(C / q ** 2) * x ** (2 + 5 * lambda)
  );
}
