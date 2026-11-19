/**
 * Turn the City of Toronto's turning movement counts into corridor demand.
 *
 * Source: "Traffic Volumes at Intersections for All Modes", City of Toronto
 * Open Data, resource tmc_raw_data_2020_2029.csv. Contains information licensed
 * under the Open Government Licence – Toronto.
 *
 *   # once, to cut the 90 MB file down to the eight counts used here:
 *   node scripts/toronto.ts path/to/tmc_raw_data_2020_2029.csv
 *   # afterwards, from the committed subset alone:
 *   node scripts/toronto.ts
 *
 * Writes data/toronto/spadina-2025-04-23.csv (the raw rows, unchanged) and
 * data/spadina.json (cars per second per lane, per 15 minutes).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CELL_M } from "../lib/sim/model.ts";
import type { Bin, SpadinaData } from "../lib/spadina.ts";

const DATE = "2025-04-23";
const SUBSET = new URL(`../data/toronto/spadina-${DATE}.csv`, import.meta.url);
const OUT = new URL("../data/spadina.json", import.meta.url);

/**
 * On 23 April 2025 the City counted eight consecutive signalized Spadina
 * Avenue intersections on the same day, from Fort York Blvd up to College St.
 * Wellington St (between King and Front) and the minor signals north of
 * Dundas were not counted that day, so they are not in the model.
 * Listed south to north.
 */
const LIGHTS = [
  { countId: "112535", short: "Fort York", crossLanes: 2 },
  { countId: "112537", short: "Front", crossLanes: 2 },
  { countId: "112536", short: "King", crossLanes: 1 },
  { countId: "112538", short: "Adelaide", crossLanes: 2 },
  { countId: "112540", short: "Richmond", crossLanes: 2 },
  { countId: "112542", short: "Queen", crossLanes: 1 },
  { countId: "112539", short: "Dundas", crossLanes: 1 },
  { countId: "112541", short: "College", crossLanes: 1 },
];
/** Spadina has two general traffic lanes each way beside the streetcar right-of-way. */
const MAIN_LANES = 2;

/** Split one CSV line, honouring double quotes. */
function split(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const full = process.argv[2];
if (full) {
  const ids = new Set(LIGHTS.map((l) => l.countId));
  const lines = readFileSync(full, "utf8").split(/\r?\n/);
  const keep = lines.slice(1).filter((line) => {
    const cols = split(line);
    return ids.has(cols[1]) && cols[2] === DATE;
  });
  writeFileSync(SUBSET, [lines[0], ...keep].join("\n") + "\n");
  console.log(`kept ${keep.length} of ${lines.length - 1} rows`);
}

const [header, ...body] = readFileSync(SUBSET, "utf8").trim().split("\n");
const names = split(header);
const rows = body.map((line) => Object.fromEntries(split(line).map((v, i) => [names[i], v])));

/** Vehicles approaching from one side in one row: cars, trucks and buses, every movement. */
const approach = (row: Record<string, string>, side: "n" | "s" | "e" | "w") =>
  ["cars", "truck", "bus"]
    .flatMap((mode) => ["r", "t", "l"].map((m) => Number(row[`${side}_appr_${mode}_${m}`] || 0)))
    .reduce((a, b) => a + b, 0);

const at = (countId: string) => rows.filter((r) => r.count_id === countId);
const starts = [...new Set(rows.map((r) => r.start_time))].sort();

const perSecond = (vehicles: number, lanes: number) => Math.round((vehicles / 900 / lanes) * 1e4) / 1e4;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

const bins: Bin[] = starts.map((start) => {
  const row = (id: string) => at(id).find((r) => r.start_time === start)!;
  // Through-only model: one main-street demand per direction, the corridor average.
  return {
    start: start.slice(11, 16),
    northbound: perSecond(mean(LIGHTS.map((l) => approach(row(l.countId), "s"))), MAIN_LANES),
    southbound: perSecond(mean(LIGHTS.map((l) => approach(row(l.countId), "n"))), MAIN_LANES),
    cross: LIGHTS.map((l) => ({
      eastbound: perSecond(approach(row(l.countId), "w"), l.crossLanes),
      westbound: perSecond(approach(row(l.countId), "e"), l.crossLanes),
    })),
  };
});

/** Metres between two points on the Earth (haversine). */
function metres(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = 6371000;
  const rad = Math.PI / 180;
  const dlat = (b.lat - a.lat) * rad;
  const dlon = (b.lon - a.lon) * rad;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

const points = LIGHTS.map((l) => {
  const r = at(l.countId)[0];
  return { name: r.location_name, short: l.short, lat: Number(r.latitude), lon: Number(r.longitude) };
});
const spacing = points.slice(1).map((p, i) => Math.round(metres(points[i], p) / CELL_M));
let x = 0;
const lights = points.map((p, i) => ({ ...p, x: i === 0 ? 0 : (x += spacing[i - 1]) }));

const data: SpadinaData = {
  source: {
    dataset: "Traffic Volumes at Intersections for All Modes",
    url: "https://open.toronto.ca/dataset/traffic-volumes-at-intersections-for-all-modes/",
    resource: "tmc_raw_data_2020_2029.csv",
    licence: "Open Government Licence – Toronto",
    attribution: "Contains information licensed under the Open Government Licence – Toronto.",
    date: DATE,
    countIds: LIGHTS.map((l) => l.countId),
  },
  lanes: { main: MAIN_LANES, cross: LIGHTS.map((l) => l.crossLanes) },
  lights,
  spacing,
  bins,
};
writeFileSync(OUT, JSON.stringify(data, null, 1) + "\n");
console.log(lights.map((l) => `${l.short} @ ${Math.round(l.x * CELL_M)} m`).join(", "));
console.log(`${bins.length} bins, ${bins[0].start} to ${bins[bins.length - 1].start}`);
