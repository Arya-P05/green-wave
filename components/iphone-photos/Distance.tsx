"use client";

import { useRef, useState } from "react";
import { distanceFor, focalFor, LENSES, noseGain, PORTRAIT, project, SELFIE } from "@/lib/iphone-photos/lens";
import type { P3 } from "@/lib/iphone-photos/lens";
import Choice from "@/components/shared/Choice";
import { useWidth } from "@/components/shared/hooks";
import Try from "@/components/shared/Try";

type Line = { pts: P3[]; closed?: boolean };

/** An ellipse of points at one depth. */
const ring = (cx: number, cy: number, z: number, rx: number, ry: number, from = 0, to = 2 * Math.PI, n = 28): P3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), z };
  });
const mirror = (pts: P3[]): P3[] => pts.map((p) => ({ ...p, x: -p.x }));

/** A face as lines in millimetres; z is how far behind the tip of the nose each point is. */
const JAW: P3[] = [
  { x: 70, y: 10, z: 90 },
  { x: 69, y: -12, z: 87 },
  { x: 66, y: -32, z: 82 },
  { x: 60, y: -52, z: 72 },
  { x: 51, y: -70, z: 61 },
  { x: 39, y: -88, z: 47 },
  { x: 24, y: -102, z: 34 },
  { x: 10, y: -109, z: 26 },
  { x: 0, y: -110, z: 24 },
];
const EAR = ring(70, 2, 100, 11, 26, -Math.PI / 2, Math.PI / 2, 16);
const BROW: P3[] = [
  { x: 14, y: 24, z: 26 },
  { x: 32, y: 29, z: 30 },
  { x: 50, y: 24, z: 42 },
];
const WING: P3[] = [
  { x: 4, y: -34, z: 2 },
  { x: 16, y: -34, z: 6 },
  { x: 19, y: -26, z: 10 },
  { x: 12, y: -18, z: 8 },
];
const SHOULDER: P3[] = [
  { x: 46, y: -96, z: 110 },
  { x: 50, y: -160, z: 115 },
  { x: 110, y: -185, z: 130 },
  { x: 190, y: -215, z: 145 },
  { x: 220, y: -320, z: 150 },
];

const FACE: Line[] = [
  { pts: ring(0, 10, 90, 70, 95, 0, Math.PI) },
  { pts: [...JAW, ...mirror(JAW).reverse()] },
  { pts: EAR },
  { pts: mirror(EAR) },
  { pts: BROW },
  { pts: mirror(BROW) },
  { pts: ring(32, 10, 32, 13, 6), closed: true },
  { pts: ring(-32, 10, 32, 13, 6), closed: true },
  { pts: ring(32, 10, 30, 3.5, 3.5), closed: true },
  { pts: ring(-32, 10, 30, 3.5, 3.5), closed: true },
  { pts: [{ x: 6, y: 14, z: 22 }, { x: 4, y: -10, z: 10 }, { x: 0, y: -30, z: 0 }] },
  { pts: [...mirror(WING).reverse(), ...WING] },
  { pts: [{ x: -26, y: -64, z: 22 }, { x: -10, y: -68, z: 18 }, { x: 0, y: -68, z: 18 }, { x: 10, y: -68, z: 18 }, { x: 26, y: -64, z: 22 }] },
  { pts: SHOULDER },
  { pts: mirror(SHOULDER) },
];

const STOPS = ["0.5x", "selfie", "1x", "2x", "5 ft"] as const;
type Stop = (typeof STOPS)[number];
const AT: Record<Stop, number> = {
  "0.5x": distanceFor(LENSES[0].focal),
  selfie: SELFIE,
  "1x": distanceFor(LENSES[1].focal),
  "2x": distanceFor(LENSES[2].focal),
  "5 ft": PORTRAIT,
};
const NAMES: Record<Stop, string> = {
  "0.5x": "0.5x",
  selfie: "selfie at arm’s length",
  "1x": "1x",
  "2x": "2x",
  "5 ft": "5 feet",
};
const MIN = 150;
const MAX = 2500;
/** The slider is in log steps, so the close distances (where everything happens) get room. */
const toSlider = (d: number) => Math.log(d / MIN) / Math.log(MAX / MIN);
const fromSlider = (t: number) => MIN * Math.pow(MAX / MIN, t);
const FAR = 1e7;

/** One face, photographed from any distance, framed the same size: the ink lines, over the faint far-away face. */
export default function Distance() {
  const box = useRef<HTMLDivElement>(null);
  const width = Math.min(useWidth(box), 420);
  const height = Math.round(width * 1.15);
  const [d, setD] = useState(AT.selfie);
  const stop = STOPS.find((s) => Math.abs(AT[s] - d) < 1);
  // 1 mm at the cheekbones, in pixels: the face fills about half the width.
  const k = width / 270;
  const cx = width / 2;
  const cy = height * 0.4;
  // Smooth curves through the points: each point becomes a control point, and the curve runs through the midpoints.
  const path = (line: Line, dist: number) => {
    const ps = line.pts.map((p) => {
      const q = project(p, dist);
      return [cx + q.x * k, cy - q.y * k];
    });
    const f = (n: number) => n.toFixed(1);
    let out = `M${f(ps[0][0])} ${f(ps[0][1])}`;
    for (let i = 1; i < ps.length - 1; i++) {
      const mx = (ps[i][0] + ps[i + 1][0]) / 2;
      const my = (ps[i][1] + ps[i + 1][1]) / 2;
      out += ` Q${f(ps[i][0])} ${f(ps[i][1])} ${f(mx)} ${f(my)}`;
    }
    const last = ps[ps.length - 1];
    return `${out} L${f(last[0])} ${f(last[1])}${line.closed ? " Z" : ""}`;
  };
  const gain = noseGain(d);
  const focal = focalFor(d);

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="the same face photographed from different distances, each time with whichever lens makes it fill the frame the same. The faint lines are the face from very far away.">
        start at a selfie, then step back to 5 feet. Watch the nose, the ears and the shoulders.
      </Try>
      <Choice label="where you stand" options={STOPS} value={stop ?? ("" as Stop)} onChange={(s) => setD(AT[s])} names={NAMES} />
      <label className="grid max-w-[56ch] grid-cols-[auto_1fr] items-center gap-x-[2ch]">
        <span className="tabular-nums">{d < 1000 ? `${Math.round(d / 10)} cm` : `${(d / 1000).toFixed(2)} m`} away</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={toSlider(d)}
          onChange={(e) => setD(fromSlider(Number(e.target.value)))}
          aria-label="how far the camera is from the face"
          aria-valuetext={`${Math.round(d / 10)} centimetres`}
        />
      </label>
      <div ref={box} className="w-full">
        {width > 0 && (
          <svg width={width} height={height} className="block" role="img" aria-label={`A face drawn from ${Math.round(d / 10)} cm away, over the same face from far away.`}>
            <defs>
              <clipPath id="distance-clip">
                <rect width={width} height={height} />
              </clipPath>
            </defs>
            <g clipPath="url(#distance-clip)" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <g stroke="var(--color-muted)" strokeOpacity={0.45} strokeWidth={1} strokeDasharray="2 3">
                {FACE.map((l, i) => (
                  <path key={i} d={path(l, FAR)} />
                ))}
              </g>
              <g stroke="var(--color-ink)" strokeWidth={1.5}>
                {FACE.map((l, i) => (
                  <path key={i} d={path(l, d)} />
                ))}
              </g>
            </g>
          </svg>
        )}
      </div>
      <p className="tabular-nums">
        Next to the cheekbones, the nose looks <span className="text-ink">{Math.round((gain - 1) * 100)}% wider</span> than from far
        away. To fill the frame with head and shoulders from here you’d want about a {focal < 18 ? "0.5x" : focal < 39 ? "1x" : focal < 78 ? "2x" : `${(focal / 26).toFixed(1)}x`} lens.
      </p>
      <figcaption className="max-w-[64ch] text-muted">
        The geometry from Ward et al. (2018): every part of the face shrinks by its distance from the lens, using rough depths
        for an average face. The lenses are iPhone 17’s 13, 26 and 52 mm (35 mm equivalent), framing about 50 cm top to bottom.
      </figcaption>
    </figure>
  );
}
