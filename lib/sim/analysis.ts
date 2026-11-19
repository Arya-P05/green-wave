import { VMAX } from "./model.ts";

/**
 * Where did a car stop? Given its corridor path ([t, x, t, x, ...]) and the
 * lights' positions in driving order, return for each light whether the car
 * stopped on its approach (between the previous light and this one). Uses the
 * sim's own rule: a stop is a halt after having been at full speed.
 */
export function stoppedAt(path: number[], lights: number[], dir: 1 | -1): boolean[] {
  const out = lights.map(() => false);
  let moving = true;
  for (let k = 2; k < path.length; k += 2) {
    const v = Math.abs(path[k + 1] - path[k - 1]);
    if (v === 0 && moving) {
      const x = path[k + 1];
      const i = lights.findIndex((l) => dir * (l - x) > 0);
      if (i !== -1) out[i] = true;
    }
    if (v === 0) moving = false;
    if (v === VMAX) moving = true;
  }
  return out;
}

/**
 * The wave test. If you made one light without stopping, how much likelier
 * are you to make the next one? lift = P(no stop at i+1 | no stop at i) /
 * P(no stop at i+1), pooled over consecutive pairs. Unrelated lights give
 * about 1; a green wave gives more.
 */
export function progressionLift(stops: boolean[][]): number {
  let both = 0;
  let first = 0;
  let second = 0;
  let pairs = 0;
  for (const s of stops) {
    for (let i = 0; i + 1 < s.length; i++) {
      pairs++;
      if (!s[i]) first++;
      if (!s[i + 1]) second++;
      if (!s[i] && !s[i + 1]) both++;
    }
  }
  if (!first || !second) return NaN;
  return both / first / (second / pairs);
}
