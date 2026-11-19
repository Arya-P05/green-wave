/**
 * Every made-up number in the model lives here, in one place, so the
 * calibration test can hold them to the published stats.
 *
 * None of these are measured. They were tuned (by a small random search,
 * then rounded) so that sensible 4.0-level players reproduce a handful of
 * real numbers: who wins on serve, what a deep return is worth, drop vs
 * drive, and how long rallies last. See calibration.test.ts.
 */
export const PARAMS = {
  /** Feet per second a player really covers between shots, split-step and all. */
  speed: 5,
  /** Seconds after hitting before the hitter can start moving. */
  recover: 0.55,
  /** How sharply difficulty grows with distance from the net (1 = in a straight line). */
  reachPow: 2.5,

  serve: { err: 0.035 },

  /** Returns. "deep" aims for the back third; "short" just gets it in. */
  deep: { err: 0.08, deep: 0.84 },
  short: { err: 0.045, deep: 0.12 },

  /**
   * Soft shots (drop, reset, dink). Harder the further from the net you are
   * (D: 0 at the kitchen line, 1 at the baseline), the faster the ball
   * coming at you, and if you're still running when you hit.
   */
  soft: {
    err: 0.03,
    errD: 0.23,
    errPace: 0.39,
    errMoving: 0.01,
    errLow: 0.015,
    /** Chance it floats up high enough to be put away. */
    high: 0.02,
    highD: 0.47,
    highPace: 0.27,
    highMoving: 0,
    /** Chance it's attackable but not a sitter. */
    mid: 0.1,
    midD: 0.18,
    midPace: 0.1,
    midMoving: 0.06,
  },

  /** Hard shots (drive, speed-up, put-away). */
  hard: {
    err: 0.1,
    errD: 0.19,
    errLow: 0.2,
    errPace: 0.37,
    errMoving: 0.09,
    errHigh: -0.04,
    /** Hit off a low ball, it has to go up: chance it sits up for them. */
    highFromLow: 0.24,
    highFromMid: 0.04,
    highFromHigh: 0.03,
    /** Chance it comes in low and hard, at their feet. */
    lowFromLow: 0.28,
    lowFromMid: 0.3,
    lowFromHigh: 0.74,
  },

  lob: { err: 0.2, errPace: 0.15, errMoving: 0.08, good: 0.65 },
};

export type Params = typeof PARAMS;
