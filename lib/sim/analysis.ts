import { FREE_SPEED } from "./model.ts";

/**
 * When would the car have reached each light (after the first) if nothing had
 * slowed it after it cleared the previous one? That projected arrival is what
 * a coordination engineer reads off an advance detector. Returns one tick per
 * light from index 1 on, or null where the path doesn't cover it.
 */
export function projectedArrivals(path: number[], lights: number[], dir: 1 | -1): (number | null)[] {
  return lights.slice(1).map((light, i) => {
    const from = lights[i];
    for (let k = 0; k < path.length; k += 2) {
      if (dir * (path[k + 1] - from) >= 0) return Math.round(path[k] + Math.abs(light - from) / FREE_SPEED);
    }
    return null;
  });
}

/**
 * The wave test: the platoon ratio (Highway Capacity Manual). Of the cars
 * arriving at a light, how many arrive on green, compared with how many would
 * if they arrived at random (the light's green share)? About 1 means the
 * lights ignore each other; above 1 means cars arrive in platoons on green, a
 * wave; below 1 means they arrive in platoons on red.
 */
export function platoonRatio(onGreen: number, expected: number): number {
  return expected > 0 ? onGreen / expected : NaN;
}
