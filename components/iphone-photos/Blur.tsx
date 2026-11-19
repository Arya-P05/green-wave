"use client";

import { useRef, useState } from "react";
import { blur } from "@/lib/iphone-photos/blur";
import Choice from "@/components/shared/Choice";
import { useWidth } from "@/components/shared/hooks";
import Try from "@/components/shared/Try";

/** Height of the world the 1x lens sees at 1 m, in metres (24 mm of a 35 mm frame over 26 mm). */
const FIELD = 24 / 26;
/** The phone is held at eye height, so the middle of the frame is 1.5 m off the ground. */
const EYE = 1.5;
/** Blur in pixels per unit of relative blur, at 600 px wide. Drawn to scale with itself, not any real phone. */
const PX = 3;
/** The farthest the side view shows. */
const MAX = 12;
const MODES = ["camera", "portrait"] as const;
type Mode = (typeof MODES)[number];
const MODE_NAMES: Record<Mode, string> = { camera: "plain photo", portrait: "Portrait mode" };

/** Move yourself and the wall: how blurry the background gets, and how much of it you see. */
export default function Blur() {
  const box = useRef<HTMLDivElement>(null);
  const width = Math.min(useWidth(box), 640);
  const height = Math.round((width * 2) / 3);
  const [you, setYou] = useState(1.5);
  const [wall, setWall] = useState(0.5);
  const [mode, setMode] = useState<Mode>("camera");

  const rel = blur(you, wall);
  const fake = mode === "portrait";
  const px = (fake ? Math.max(rel, 5) : rel) * PX * (width / 600);
  // How many pixels one metre is, at your friend and at the wall.
  const atFriend = height / (FIELD * you);
  const atWall = height / (FIELD * (you + wall));

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="the photo you’d get of a friend in front of a busy wall, and below it the same scene from the side: you, your friend, the wall.">
        put the wall right behind her, then move it far away. Then walk closer to her. Then try Portrait mode with the wall close.
      </Try>
      <Choice label="mode" options={MODES} value={mode} onChange={setMode} names={MODE_NAMES} />
      <div ref={box} className="w-full">
        {width > 0 && (
          <svg width={width} height={height} className="block" role="img" aria-label={`A friend ${you} metres away with a wall ${wall} metres behind her.`}>
            <defs>
              <clipPath id="blur-clip">
                <rect width={width} height={height} />
              </clipPath>
              <filter id="blur-bg" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation={px / 2} />
              </filter>
            </defs>
            <g clipPath="url(#blur-clip)">
              <rect width={width} height={height} fill="var(--color-canvas)" />
              <g filter="url(#blur-bg)">
                <Wall cx={width / 2} mid={height / 2} m={atWall} width={width} height={height} />
              </g>
              <Friend cx={width / 2} mid={height / 2} m={atFriend} />
            </g>
            <rect x={0.5} y={0.5} width={width - 1} height={height - 1} fill="none" stroke="var(--color-faint)" />
          </svg>
        )}
      </div>
      {width > 0 && <Side width={width} you={you} wall={wall} />}
      <label className="grid max-w-[60ch] grid-cols-[20ch_1fr] items-center gap-x-[2ch]">
        <span className="tabular-nums">you to her {you.toFixed(1)} m</span>
        <input type="range" min={0.5} max={4} step={0.1} value={you} onChange={(e) => setYou(Number(e.target.value))} aria-label="how far you are from her, in metres" />
      </label>
      <label className="grid max-w-[60ch] grid-cols-[20ch_1fr] items-center gap-x-[2ch]">
        <span className="tabular-nums">her to wall {wall.toFixed(1)} m</span>
        <input type="range" min={0} max={8} step={0.1} value={wall} onChange={(e) => setWall(Number(e.target.value))} aria-label="how far the wall is behind her, in metres" />
      </label>
      <p className="tabular-nums">
        Background blur: <span className="text-ink">{rel.toFixed(1)}×</span> a shot from 1 m with the wall 1 m behind her.
        {fake && " Portrait mode adds its own blur on top, wherever the wall is."}
      </p>
      <figcaption className="max-w-[64ch] text-muted">
        Blur from the thin-lens formula, drawn to scale with itself rather than with any real phone’s numbers. The lens stays
        at 1x the whole time, so walking closer also makes her bigger.
      </figcaption>
    </figure>
  );
}

/** A busy wall: a railing, lamps, a doorway, a plant and three people, in metres above the ground. */
function Wall({ cx, mid, m, width, height }: { cx: number; mid: number; m: number; width: number; height: number }) {
  const X = (x: number) => cx + x * m;
  const Y = (y: number) => mid - (y - EYE) * m;
  const people = [-1.9, 1.6, 2.6];
  return (
    <g>
      <rect width={width} height={height} fill="var(--color-faint)" fillOpacity={0.35} />
      {/* The floor and the railing. */}
      <rect x={0} y={Y(0)} width={width} height={height} fill="var(--color-faint)" fillOpacity={0.6} />
      {Array.from({ length: 41 }, (_, i) => i - 20).map((i) => (
        <line key={i} x1={X(i * 0.3)} x2={X(i * 0.3)} y1={Y(1)} y2={Y(0)} stroke="var(--color-muted)" strokeWidth={Math.max(1, 0.04 * m)} />
      ))}
      <line x1={0} x2={width} y1={Y(1)} y2={Y(1)} stroke="var(--color-muted)" strokeWidth={Math.max(1, 0.06 * m)} />
      {/* A doorway. */}
      <rect x={X(-1)} y={Y(2.1)} width={0.9 * m} height={2.1 * m} fill="var(--color-muted)" fillOpacity={0.5} />
      {/* Windows along the wall. */}
      {[-4.4, -2.6, 0.6, 2.4, 4.2].map((x) => (
        <rect key={x} x={X(x)} y={Y(2.3)} width={1.1 * m} height={1 * m} fill="none" stroke="var(--color-muted)" strokeWidth={Math.max(1, 0.05 * m)} />
      ))}
      {/* String lights: little points that turn into soft discs when they blur. */}
      {Array.from({ length: 49 }, (_, i) => (i - 24) * 0.25).map((x) => (
        <circle key={x} cx={X(x)} cy={Y(2.75 - 0.25 * Math.cos((x * Math.PI) / 1.5) ** 2)} r={Math.max(1.2, 0.035 * m)} fill="var(--color-amber)" />
      ))}
      {/* A plant. */}
      <g fill="var(--color-green)">
        {[-0.3, 0, 0.3].map((dx) => (
          <ellipse key={dx} cx={X(-3 + dx)} cy={Y(0.6 - Math.abs(dx))} rx={0.18 * m} ry={0.45 * m} />
        ))}
      </g>
      {/* People wandering past. */}
      {people.map((x, i) => (
        <g key={x} fill={i === 1 ? "var(--color-red)" : "var(--color-muted)"}>
          <circle cx={X(x)} cy={Y(1.62)} r={0.11 * m} />
          <rect x={X(x - 0.2)} y={Y(1.48)} width={0.4 * m} height={0.75 * m} rx={0.1 * m} />
          <rect x={X(x - 0.15)} y={Y(0.73)} width={0.3 * m} height={0.93 * m} />
        </g>
      ))}
    </g>
  );
}

/** Your friend, 1.7 m tall, standing on the ground, sharp. */
function Friend({ cx, mid, m }: { cx: number; mid: number; m: number }) {
  const Y = (y: number) => mid - (y - EYE) * m;
  const w = (metres: number) => metres * m;
  return (
    <g fill="var(--color-ink)">
      <ellipse cx={cx} cy={Y(1.58)} rx={w(0.085)} ry={w(0.115)} />
      <path
        d={`M${cx - w(0.21)} ${Y(1.0)} L${cx - w(0.21)} ${Y(1.36)} Q${cx - w(0.21)} ${Y(1.44)} ${cx} ${Y(1.45)} Q${cx + w(0.21)} ${Y(1.44)} ${cx + w(0.21)} ${Y(1.36)} L${cx + w(0.21)} ${Y(1.0)} Z`}
      />
      <path d={`M${cx - w(0.17)} ${Y(1.02)} L${cx + w(0.17)} ${Y(1.02)} L${cx + w(0.14)} ${Y(0)} L${cx + w(0.03)} ${Y(0)} L${cx} ${Y(0.7)} L${cx - w(0.03)} ${Y(0)} L${cx - w(0.14)} ${Y(0)} Z`} />
    </g>
  );
}

/** The scene from the side, to scale: you, her, the wall. */
function Side({ width, you, wall }: { width: number; you: number; wall: number }) {
  const h = 64;
  const left = 24;
  const k = (width - left - 16) / MAX;
  const ground = h - 18;
  const her = left + you * k;
  const back = her + wall * k;
  return (
    <svg width={width} height={h} className="block" aria-hidden>
      <line x1={0} x2={width} y1={ground} y2={ground} stroke="var(--color-faint)" />
      {/* You, holding the phone. */}
      <rect x={left - 7} y={ground - 22} width={8} height={14} rx={2} fill="var(--color-muted)" />
      <path d={`M${left + 1} ${ground - 18} L${her} ${ground - 34} M${left + 1} ${ground - 12} L${her} ${ground}`} stroke="var(--color-faint)" strokeDasharray="2 4" />
      {/* Her. */}
      <circle cx={her} cy={ground - 31} r={4} fill="var(--color-ink)" />
      <line x1={her} x2={her} y1={ground - 27} y2={ground} stroke="var(--color-ink)" strokeWidth={4} />
      {/* The wall. */}
      <line x1={back + 4} x2={back + 4} y1={4} y2={ground} stroke="var(--color-muted)" strokeWidth={3} />
      <text x={(left + her) / 2} y={h - 2} textAnchor="middle" className="fill-muted text-[13px]">
        {you.toFixed(1)} m
      </text>
      {wall >= 0.6 && (
        <text x={(her + back) / 2 + 2} y={h - 2} textAnchor="middle" className="fill-muted text-[13px]">
          {wall.toFixed(1)} m
        </text>
      )}
    </svg>
  );
}
