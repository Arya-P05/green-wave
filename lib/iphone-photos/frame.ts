/**
 * What the research says about where you put one subject in a frame
 * (Palmer, Gardner & Wickens 2008): people like a subject facing them near
 * the centre, and a subject facing sideways a little off-centre, on the side
 * away from where it's looking, so it looks into the frame.
 */

export type Facing = "left" | "you" | "right";

/** Positions across the frame, 0 = left edge, 1 = right edge. */
export const THIRDS = [1 / 3, 2 / 3];
export const PHI = [1 - 0.618, 0.618];

/** Palmer et al.'s Experiment 2 peaks: about 42% across for right-facing subjects, 58% for left-facing ones. */
export function preferred(facing: Facing): number {
  return facing === "you" ? 0.5 : facing === "right" ? 0.42 : 0.58;
}

export type Verdict = "centre" | "inward" | "outward" | "off-centre";

/** Which of Palmer's cases this placement falls into. `x` is the subject's centre, 0–1. */
export function verdict(x: number, facing: Facing): Verdict {
  const off = x - 0.5;
  if (Math.abs(off) < 0.06) return "centre";
  if (facing === "you") return "off-centre";
  const facesRight = facing === "right";
  // Looking into the frame means looking toward the side with more room.
  return (facesRight && off < 0) || (!facesRight && off > 0) ? "inward" : "outward";
}
