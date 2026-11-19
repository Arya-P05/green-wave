/**
 * The road is a row of 7.5 m cells (one car length plus a gap). Time moves in
 * 1 s ticks. A car's speed is a whole number of cells per tick.
 */
export const CELL_M = 7.5;
export const VMAX = 2; // cells per tick: 15 m/s = 54 km/h, a city speed limit
export const P_SLOW = 0.1; // Nagel-Schreckenberg random slowdown
/** Average speed of a car with an empty road ahead: it dawdles 10% of ticks. */
export const FREE_SPEED = VMAX - P_SLOW;

/** Clearance between two greens: amber, then all-red. Both act as red. */
export const AMBER_S = 3;
export const ALL_RED_S = 1;
export const CLEARANCE_S = AMBER_S + ALL_RED_S;

export type Aspect = "green" | "amber" | "red";

/** A one-lane, one-way stretch of road. Cars drive from cell 0 to the end. */
export type Link = {
  length: number; // cells
  /** The link a car continues onto past the end, or null if it leaves. */
  next: number | null;
  /** The signal at the end of this link, or null if there is none. */
  signal: { node: number; phase: number } | null;
  /** Cars per second arriving at cell 0 from outside, if this is an entry. */
  demand: number;
  /** Where cell 0 sits on the corridor (cells) and which way it runs, for the main street. */
  corridor: { x0: number; dir: 1 | -1 } | null;
};

/** A signalized intersection: phases are groups of links that get green together. */
export type Node = {
  phases: number[][];
  /** Corridor position (cells), for drawing. */
  x: number;
};

export type Network = {
  links: Link[];
  nodes: Node[];
};

/**
 * Saturation flow: how fast a standing queue drains through a green, in cars
 * per second (about 1,690 per hour, close to the textbook ~1,700-1,900 per lane).
 * Measured from the model itself; see sim.test.ts.
 */
export const SATURATION_FLOW = 0.47;
