/**
 * Background blur, from the thin-lens formula for the blur disk of a detail
 * behind the subject (see Wikipedia, "Depth of field", foreground and
 * background blur):
 *
 *   b = aperture × magnification × (subject-to-background) / (camera-to-background)
 *
 * With one lens the aperture is fixed and the magnification of your subject
 * goes as one over your distance to them, so everything here is relative to a
 * reference shot: you 1 m from your friend, the wall 1 m behind them.
 */

/** Blur of the background, relative to the reference shot. `you` and `wall` are metres. */
export function blur(you: number, wall: number): number {
  return relative(you, wall) / relative(1, 1);
}

function relative(you: number, wall: number): number {
  const magnification = 1 / you;
  return magnification * (wall / (you + wall));
}

/** How big the background looks next to your friend: further away, it shrinks. */
export function backgroundScale(you: number, wall: number): number {
  return you / (you + wall);
}
