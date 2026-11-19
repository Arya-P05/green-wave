import cliffData from "@/data/green-wave/cliff.json";
import experimentData from "@/data/green-wave/experiment.json";
import type { CliffData } from "@/lib/green-wave/cliff";
import type { Experiment, Point } from "@/lib/green-wave/experiment";
import type { Kind } from "@/lib/green-wave/sim/scenario";

/**
 * Every number the prose quotes, read from the experiment's output so the
 * words can't drift from the data.
 */
const experiment = experimentData as Experiment;
const cliff = cliffData as CliffData;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Day average (every hour weighted equally) of one measure under one controller. */
export const day = (kind: Kind, f: (p: Point) => number) => mean(experiment.day.results[kind].map(f));

export const stops = (kind: Kind, dir: "northbound" | "southbound" = "northbound") => day(kind, (p) => p[dir].stops);
export const trip = (kind: Kind, dir: "northbound" | "southbound" = "northbound") => day(kind, (p) => p[dir].travelTime);
export const delay = (kind: Kind) => day(kind, (p) => p.delay);
export const side = (kind: Kind) => day(kind, (p) => p.side);
export const platoon = (kind: Kind, dir: "northbound" | "southbound" = "northbound") => day(kind, (p) => p[dir].platoon);

/** The lowest and highest hourly platoon ratio under one controller, both directions. */
export const platoonRange = (kind: Kind) => {
  const all = experiment.day.results[kind].flatMap((p) => [p.northbound.platoon, p.southbound.platoon]);
  return [Math.min(...all), Math.max(...all)];
};

/** Hours (of the day's 14) where `a` has less delay than `b`. */
export const hoursBetter = (a: Kind, b: Kind) =>
  experiment.day.results[a].filter((p, i) => p.delay < experiment.day.results[b][i].delay).length;

export const hourCount = experiment.day.hours.length;

/** Delay per car at one intersection at demand Y. */
export const cliffDelay = (kind: keyof CliffData["delay"], y: number) => cliff.delay[kind][cliff.demands.indexOf(y)];

export const f1 = (x: number) => x.toFixed(1);
export const s0 = (x: number) => `${Math.round(x)}s`;
