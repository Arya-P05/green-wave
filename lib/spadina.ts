import type { CorridorSpec } from "./sim/network.ts";

/** The demand file written by scripts/toronto.ts. Rates are cars per second per lane. */
export type SpadinaData = {
  source: {
    dataset: string;
    url: string;
    resource: string;
    licence: string;
    attribution: string;
    date: string;
    countIds: string[];
  };
  /** Lanes each approach volume was divided across (see scripts/toronto.ts). */
  lanes: { main: number; cross: number[] };
  /** South to north, the direction the corridor's x runs. */
  lights: { name: string; short: string; lat: number; lon: number; x: number }[];
  /** Cells between consecutive lights. */
  spacing: number[];
  bins: Bin[];
};

export type Bin = {
  start: string; // local time the 15 minutes begin, "HH:MM"
  northbound: number;
  southbound: number;
  cross: { eastbound: number; westbound: number }[];
};

export const APPROACH = 60; // cells of road before the first light and after the last
export const ARM = 40; // cells of each side-street arm

/** The corridor for one demand period, with side streets scaled by `side`. */
export function spadinaSpec(data: SpadinaData, bin: Bin, side = 1): CorridorSpec {
  return {
    spacing: data.spacing,
    approach: APPROACH,
    arm: ARM,
    northbound: bin.northbound,
    southbound: bin.southbound,
    cross: bin.cross.map((c) => ({ eastbound: c.eastbound * side, westbound: c.westbound * side })),
  };
}

/** Average 15-minute bins into one: an hour is four bins. */
export function average(bins: Bin[]): Bin {
  const m = (f: (b: Bin) => number) => bins.reduce((a, b) => a + f(b), 0) / bins.length;
  return {
    start: bins[0].start,
    northbound: m((b) => b.northbound),
    southbound: m((b) => b.southbound),
    cross: bins[0].cross.map((_, i) => ({
      eastbound: m((b) => b.cross[i].eastbound),
      westbound: m((b) => b.cross[i].westbound),
    })),
  };
}

/** Hourly demand: each hour is the average of its four bins. */
export function hours(data: SpadinaData): Bin[] {
  const out: Bin[] = [];
  for (let i = 0; i + 4 <= data.bins.length; i += 4) out.push(average(data.bins.slice(i, i + 4)));
  return out;
}

/** The hour with the most main-street traffic: the figure's default. */
export function peakHour(data: SpadinaData): Bin {
  return hours(data).reduce((a, b) => (b.northbound + b.southbound > a.northbound + a.southbound ? b : a));
}
