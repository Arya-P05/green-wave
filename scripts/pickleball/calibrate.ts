import { calibrate } from "../../lib/pickleball/stats.ts";

const n = Number(process.argv[2] ?? 40000);
const t = performance.now();
const c = calibrate(n, 1);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
for (const [k, v] of Object.entries(c)) console.log(k.padEnd(16), k === "rallies" || k === "meanLength" ? v.toFixed?.(2) ?? v : pct(v));
console.log(`${((performance.now() - t) / 1000).toFixed(1)}s`);
