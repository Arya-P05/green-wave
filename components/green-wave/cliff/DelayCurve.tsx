"use client";

import { useRef } from "react";
import { CLIFF_KINDS } from "@/lib/green-wave/cliff";
import type { CliffData } from "@/lib/green-wave/cliff";
import { LABELS } from "@/lib/green-wave/sim/scenario";
import { useWidth } from "@/components/shared/hooks";

type CliffKind = (typeof CLIFF_KINDS)[number];

const HEIGHT = 288; // 12 lines
const TOP = 12;
const BOTTOM = 36;
const LEFT = 48;
const RIGHT = 120; // room for line labels
const MAX_DELAY = 120;
const CH = 9; // px per character of the 15px mono face

/**
 * Mean delay per car against demand, one line per controller. Lines that run
 * off the top are past the cliff. The dashed line is Webster's 1958 formula.
 */
export default function DelayCurve({
  data,
  demand,
  kind,
}: {
  data: CliffData;
  demand: number;
  kind: CliffKind;
}) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const w = Math.max(0, width - LEFT - RIGHT);
  const h = HEIGHT - TOP - BOTTOM;
  const lo = data.demands[0];
  const hi = data.demands[data.demands.length - 1];
  const x = (d: number) => LEFT + ((d - lo) / (hi - lo)) * w;
  const y = (s: number) => TOP + h - (Math.min(s, MAX_DELAY * 1.5) / MAX_DELAY) * h;
  const path = (ys: (number | null)[]) =>
    ys
      .map((v, i) => (v === null ? null : `${x(data.demands[i])},${y(v)}`))
      .filter(Boolean)
      .join(" ");

  /** Where to name a line: its last point before it runs off the top. */
  const anchor = (ys: (number | null)[]) => {
    let last = 0;
    for (let j = 0; j < ys.length; j++) {
      const v = ys[j];
      if (v === null) break;
      if (v > MAX_DELAY) return { left: x(data.demands[last]), top: TOP - 24, end: true };
      last = j;
    }
    return { left: x(data.demands[last]) + 6, top: y(ys[last] ?? 0) - 12, end: false };
  };
  const labels = [
    ...CLIFF_KINDS.map((k) => ({ key: k, text: LABELS[k], at: anchor(data.delay[k]), ink: k === kind })),
    { key: "webster", text: "webster 1958", at: anchor(data.webster), ink: false },
  ];
  // Lines that leave the top are named where they leave, ending there; if that
  // would run into the name of the line that left before, start there instead.
  let edge = -Infinity;
  for (const l of labels.filter((l) => l.at.end).sort((a, b) => a.at.left - b.at.left)) {
    if (l.at.left - l.text.length * CH < edge) l.at = { ...l.at, left: l.at.left + 4, end: false };
    edge = l.at.end ? l.at.left : l.at.left + l.text.length * CH;
  }

  const i = data.demands.findIndex((d) => Math.abs(d - demand) < 1e-9);
  const value = data.delay[kind][i];
  const order = [...CLIFF_KINDS.filter((k) => k !== kind), kind];

  return (
    <div ref={box} className="relative w-full" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} className="absolute inset-0 overflow-visible" aria-hidden>
          <defs>
            <clipPath id="cliff-plot">
              <rect x={LEFT} y={TOP} width={w} height={h} />
            </clipPath>
          </defs>
          {[0, 30, 60, 90, 120].map((s) => (
            <line key={s} x1={LEFT} x2={LEFT + w} y1={y(s)} y2={y(s)} stroke="var(--color-faint)" strokeWidth={s ? 0.5 : 1} />
          ))}
          <g clipPath="url(#cliff-plot)" fill="none" strokeLinejoin="round" strokeLinecap="round">
            <polyline points={path(data.webster)} stroke="var(--color-muted)" strokeWidth={1} strokeDasharray="2 4" />
            {order.map((k) => (
              <polyline
                key={k}
                points={path(data.delay[k])}
                stroke={k === kind ? "var(--color-ink)" : "var(--color-muted)"}
                strokeOpacity={k === kind ? 1 : 0.45}
                strokeWidth={k === kind ? 1.5 : 1}
                className="transition-[stroke,stroke-opacity] duration-[160ms]"
              />
            ))}
          </g>
          <line x1={x(demand)} x2={x(demand)} y1={TOP} y2={TOP + h} stroke="var(--color-faint)" />
          {value <= MAX_DELAY && <circle cx={x(demand)} cy={y(value)} r={3} fill="var(--color-ink)" />}
        </svg>
      )}
      {width > 0 && (
        <>
          {[0, 60, 120].map((s) => (
            <span key={s} className="absolute left-0 text-muted" style={{ top: y(s) - 12 }}>
              {s}s
            </span>
          ))}
          <span className="absolute left-0 text-muted" style={{ top: TOP - 30 }}>
            wait per car ↑
          </span>
          <span className="absolute text-muted" style={{ left: LEFT + w + 20, top: TOP + h + 6 }}>
            demand →
          </span>
          {[0.2, 0.6, 1].map((d) => (
            <span key={d} className="absolute -translate-x-1/2 text-muted" style={{ left: x(d), top: TOP + h + 6 }}>
              {d.toFixed(1)}
            </span>
          ))}
        </>
      )}
      {width > 0 &&
        labels.map((l) => (
          <span
            key={l.key}
            aria-hidden
            className={`absolute whitespace-nowrap transition-colors duration-[160ms] ${l.ink ? "text-ink" : "text-muted"} ${l.at.end ? "-translate-x-full" : ""}`}
            style={{ left: l.at.left, top: l.at.top }}
          >
            {l.text}
          </span>
        ))}
      <p className="sr-only">
        {LABELS[kind]} at demand {demand.toFixed(2)}: {value} seconds of delay per car.
      </p>
    </div>
  );
}
