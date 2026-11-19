import type { Kind } from "./sim/scenario.ts";

/** One direction of Spadina, averaged over seeds. */
export type Direction = {
  travelTime: number; // s, end to end
  stops: number; // per trip
  band: number; // share of trips with no stop at all
  platoon: number; // HCM platoon ratio at lights after the first
};

/** One experiment point: a demand, a controller, the mean over seeds. */
export type Point = { delay: number; side: number; northbound: Direction; southbound: Direction };

/** The shape of data/experiment.json, written by scripts/experiment.ts. */
export type Experiment = {
  meta: { seeds: number; warmup: number; measure: number; date: string; peak: string };
  day: {
    hours: string[];
    demand: { northbound: number; southbound: number; sideShare: number }[];
    results: Record<Kind, Point[]>;
  };
  side: { scales: number[]; shares: number[]; results: Record<Kind, Point[]> };
  minGreen: { values: number[]; results: Point[] };
};

/** The measures a results figure can show, and how to read each off a point. */
export const MEASURES = {
  delay: { label: "delay, every car", unit: "s", get: (p: Point) => p.delay },
  northbound: { label: "northbound trip", unit: "s", get: (p: Point) => p.northbound.travelTime },
  southbound: { label: "southbound trip", unit: "s", get: (p: Point) => p.southbound.travelTime },
  side: { label: "side-street delay", unit: "s", get: (p: Point) => p.side },
  platoon: { label: "platoon ratio, nb", unit: "", get: (p: Point) => p.northbound.platoon },
} as const;

export type Measure = keyof typeof MEASURES;
