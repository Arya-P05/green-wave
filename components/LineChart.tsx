"use client";

import { useRef } from "react";
import { useWidth } from "./hooks";

export type Series = { key: string; label: string; values: number[] };

const TOP = 24;
const BOTTOM = 36;
const LEFT = 56;
const RIGHT = 128; // room for line labels

/**
 * A plain line chart in the page's type: hairline grid, one ink line for the
 * series in focus, muted lines for the rest, each named at its right end.
 */
export default function LineChart({
  xs,
  series,
  focus,
  height = 264,
  xTicks,
  xFormat,
  yFormat,
  yMin = 0,
  yMax,
  reference,
  label,
  yLabel,
}: {
  xs: number[];
  series: Series[];
  focus: string;
  height?: number;
  xTicks: number[];
  xFormat: (x: number) => string;
  yFormat: (y: number) => string;
  yMin?: number;
  yMax?: number;
  /** A horizontal guide, e.g. "1 = no coordination". */
  reference?: { y: number; label: string };
  label: string;
  /** What the y axis measures, written above it. */
  yLabel?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const w = Math.max(0, width - LEFT - RIGHT);
  const h = height - TOP - BOTTOM;
  const all = series.flatMap((s) => s.values).filter(Number.isFinite);
  const top = yMax ?? niceCeil(Math.max(...all, reference?.y ?? 0));
  const x = (v: number) => LEFT + ((v - xs[0]) / (xs[xs.length - 1] - xs[0])) * w;
  const y = (v: number) => TOP + h - ((v - yMin) / (top - yMin)) * h;
  const yTicks = [yMin, (yMin + top) / 2, top];
  const order = [...series.filter((s) => s.key !== focus), ...series.filter((s) => s.key === focus)];

  // Spread end labels so they never overlap: at least one line (24px) apart.
  const ends = series
    .map((s) => ({ key: s.key, label: s.label, y: y(s.values[s.values.length - 1]) - 12 }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 24);

  return (
    <div ref={box} className="relative w-full" style={{ height }} role="img" aria-label={label}>
      {width > 0 && (
        <>
          <svg width={width} height={height} className="absolute inset-0 overflow-visible" aria-hidden>
            {yTicks.map((t) => (
              <line key={t} x1={LEFT} x2={LEFT + w} y1={y(t)} y2={y(t)} stroke="var(--color-faint)" strokeWidth={t === yMin ? 1 : 0.5} />
            ))}
            {reference && (
              <line x1={LEFT} x2={LEFT + w} y1={y(reference.y)} y2={y(reference.y)} stroke="var(--color-muted)" strokeDasharray="2 4" />
            )}
            <g fill="none" strokeLinejoin="round" strokeLinecap="round">
              {order.map((s) => (
                <polyline
                  key={s.key}
                  points={s.values.map((v, i) => `${x(xs[i])},${y(v)}`).join(" ")}
                  stroke={s.key === focus ? "var(--color-ink)" : "var(--color-muted)"}
                  strokeOpacity={s.key === focus ? 1 : 0.45}
                  strokeWidth={s.key === focus ? 1.5 : 1}
                  className="transition-[stroke,stroke-opacity] duration-[160ms]"
                />
              ))}
            </g>
          </svg>
          {yTicks.map((t) => (
            <span key={t} className="absolute left-0 text-muted tabular-nums" style={{ top: y(t) - 12 }}>
              {yFormat(t)}
            </span>
          ))}
          {xTicks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 text-muted tabular-nums" style={{ left: x(t), top: TOP + h + 6 }}>
              {xFormat(t)}
            </span>
          ))}
          {ends.map((e) => (
            <span
              key={e.key}
              className={`absolute whitespace-nowrap transition-colors duration-[160ms] ${e.key === focus ? "text-ink" : "text-muted"}`}
              style={{ left: LEFT + w + 8, top: e.y }}
            >
              {e.label}
            </span>
          ))}
          {yLabel && (
            <span className="absolute top-0 text-muted" style={{ left: LEFT + 6 }}>
              {yLabel} ↑
            </span>
          )}
          {reference && (
            <span className="absolute text-muted" style={{ left: LEFT + 6, top: y(reference.y) - 24 }}>
              {reference.label}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/** Round up to 1, 1.5, 2, 3, 5 or 7.5 times a power of ten, so the top gridline is a readable number. */
function niceCeil(v: number): number {
  if (!(v > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 1.5, 2, 3, 5, 7.5, 10].map((m) => m * p).find((n) => n >= v)!;
}
