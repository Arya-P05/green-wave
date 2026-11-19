import type { Point, ShotEvent } from "@/lib/pickleball/rally";

/** One shot on the playback clock, in sim seconds. */
export type Clip = { start: number; dur: number; ev: ShotEvent };

/** Shots shorter than this get stretched a little, so nothing on screen is a blur. */
const MIN_DUR = 0.55;
/** How long the end of the rally stays up before playback stops. */
export const END_HOLD = 1.2;

export function clips(events: ShotEvent[]): { clips: Clip[]; total: number } {
  let t = 0;
  const out = events.map((ev) => {
    const dur = Math.max(MIN_DUR, ev.dur);
    const c = { start: t, dur, ev };
    t += dur;
    return c;
  });
  return { clips: out, total: t + END_HOLD };
}

export const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
const lerp = (a: Point, b: Point, u: number): Point => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });

/** Which clip the clock is in, and how far through it (0 to 1). */
export function locate(cs: Clip[], t: number): { i: number; u: number } {
  let i = 0;
  while (i + 1 < cs.length && cs[i + 1].start <= t) i++;
  return { i, u: Math.min(1, Math.max(0, (t - cs[i].start) / cs[i].dur)) };
}

export function playersAt(c: Clip, u: number): Point[] {
  const e = ease(u);
  return c.ev.before.map((p, j) => lerp(p, c.ev.after[j], e));
}

/** Where the ball is (on the ground) and how high, in feet. Paddle contact is about 2.5 ft up. */
export function ballAt(c: Clip, u: number): { p: Point; h: number } {
  const { from, land, to, arc } = c.ev;
  const CONTACT = 2.5;
  if (!land) {
    const end = c.ev.fault === "net" ? 1 : CONTACT;
    return { p: lerp(from, to, u), h: CONTACT + (end - CONTACT) * u + 4 * arc * u * (1 - u) };
  }
  const split = 0.75;
  if (u < split) {
    const v = u / split;
    return { p: lerp(from, land, v), h: CONTACT * (1 - v) + 4 * arc * v * (1 - v) };
  }
  const v = (u - split) / (1 - split);
  return { p: lerp(land, to, v), h: CONTACT * v + 4 * 1.2 * v * (1 - v) };
}
