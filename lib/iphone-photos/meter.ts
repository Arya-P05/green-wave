/**
 * A toy light meter. Every part of a scene has a brightness, counted in
 * stops (each stop is twice the light). The camera picks an exposure so that
 * whatever it measured comes out middle grey, and the sensor can only hold so
 * many stops either side of that before it clips to white or black.
 */

/** Stops above middle grey that still show detail before turning pure white. */
export const HEADROOM = 3;
/** Stops below middle grey before detail sinks into black. */
export const FLOOR = 5;

export type Region = { key: string; name: string; stops: number; area: number };

/** What a part of the picture looks like: 0 = black, 1 = white, plus whether it clipped. */
export function render(stops: number, exposure: number): { v: number; clipped: "white" | "black" | null } {
  const rel = stops - exposure;
  if (rel >= HEADROOM) return { v: 1, clipped: "white" };
  if (rel <= -FLOOR) return { v: 0, clipped: "black" };
  // A curve that puts middle grey (rel = 0) at about 0.46 on screen.
  const t = (rel + FLOOR) / (HEADROOM + FLOOR);
  return { v: Math.pow(t, 1.65), clipped: null };
}

/** A plain average meter: the exposure that makes the whole frame's average middle grey. */
export function average(regions: Region[]): number {
  const total = regions.reduce((s, r) => s + r.area, 0);
  // Light adds, so average the light (2^stops), not the stops.
  const light = regions.reduce((s, r) => s + r.area * 2 ** r.stops, 0) / total;
  return Math.log2(light);
}
