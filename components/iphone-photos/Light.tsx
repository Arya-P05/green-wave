"use client";

import { useEffect, useRef, useState } from "react";
import { geometry, shade } from "@/lib/iphone-photos/head";
import type { Geometry, Light as L } from "@/lib/iphone-photos/head";
import Choice from "@/components/shared/Choice";
import { sizeCanvas, token, useVisible, useWidth } from "@/components/shared/hooks";
import Try from "@/components/shared/Try";

/** The head is worked out on this grid, then scaled up smoothly. */
const GW = 150;
const GH = 162;

const PRESETS = {
  front: { azimuth: 0, elevation: 12, size: 0.35 },
  side: { azimuth: 90, elevation: 10, size: 0.12 },
  window: { azimuth: 65, elevation: 12, size: 0.95 },
  noon: { azimuth: 10, elevation: 82, size: 0.02 },
  back: { azimuth: 180, elevation: 15, size: 0.3 },
  below: { azimuth: 0, elevation: -45, size: 0.2 },
} satisfies Record<string, L>;
type Preset = keyof typeof PRESETS | "yours";
const NAMES: Record<Preset, string> = {
  front: "from the front",
  side: "from the side",
  window: "a window",
  noon: "midday sun",
  back: "from behind",
  below: "from below",
  yours: "yours",
};

/** What this light does to a face, in a sentence. */
function describe({ azimuth, elevation, size }: L): string {
  const soft = size > 0.6;
  const a = Math.abs(((azimuth + 540) % 360) - 180); // 0 = front, 180 = behind
  if (elevation < -15)
    return "Light from below: the torch-under-the-chin look. Our eyes assume light comes from above, and faces lit from below are harder for us to read.";
  if (elevation > 60)
    return soft
      ? "Soft light from overhead, like a cloudy day. Even and kind, if a little flat."
      : "Hard light from straight above, like midday sun: dark eye sockets and a sharp shadow under the nose and chin.";
  if (a < 35)
    return soft
      ? "Soft light from the front. Even and flattering, but there’s not much shape: the face starts to look flat."
      : "Hard light from the front, like the phone’s flash. Hardly any shadows, so the face loses its shape.";
  if (a < 125)
    return soft
      ? "A big soft light to one side, like a window. One side falls gently into shadow, so you see the shape of the face without harsh lines."
      : "Hard light from the side: half the face in deep shadow, with a sharp line down the middle. Dramatic, and it shows every bump.";
  return "Light from behind: the face sits in its own shadow while the background glows, with a thin bright edge around the head. Your phone will want to expose for the bright part.";
}

/**
 * The lighting demo: a plaster head, a light you can move around it (seen
 * from above on the dial), how high it is, and how big it is.
 */
export default function Light() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const visible = useVisible(box);
  const [light, setLight] = useState<L>(PRESETS.window);
  const [preset, setPreset] = useState<Preset>("window");
  const geo = useRef<Geometry | null>(null);
  const buf = useRef<Float32Array | null>(null);

  const change = (next: Partial<L>) => {
    setLight((l) => ({ ...l, ...next }));
    setPreset("yours");
  };

  // Two columns when there's room: the head, and the dial next to it.
  const wide = width >= 560;
  const size = Math.max(0, Math.min(wide ? width - 236 : width, 340));

  useEffect(() => {
    if (!visible || !size || !canvas.current) return;
    const frame = requestAnimationFrame(() => {
      geo.current ??= geometry(GW, GH);
      buf.current ??= new Float32Array(GW * GH);
      const g = geo.current;
      const out = buf.current;
      shade(g, light, out);
      const off = document.createElement("canvas");
      off.width = GW;
      off.height = GH;
      const octx = off.getContext("2d")!;
      const img = octx.createImageData(GW, GH);
      const dark = rgb(token("ink"));
      const lit = [255, 251, 244];
      for (let p = 0; p < GW * GH; p++) {
        const v = Math.pow(out[p], 0.8);
        img.data[p * 4] = dark[0] + (lit[0] - dark[0]) * v;
        img.data[p * 4 + 1] = dark[1] + (lit[1] - dark[1]) * v;
        img.data[p * 4 + 2] = dark[2] + (lit[2] - dark[2]) * v;
        img.data[p * 4 + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      const h = Math.round((size * GH) / GW);
      const ctx = sizeCanvas(canvas.current!, size, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, size, h);
    });
    return () => cancelAnimationFrame(frame);
  }, [light, size, visible]);

  const options = (Object.keys(PRESETS) as Preset[]).concat(preset === "yours" ? ["yours"] : []);

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="a plain plaster head, lit by one light. The dial is the same head seen from above, with you at the bottom; the amber dot is the light.">
        drag the light around the dial, then make it small and hard, then big and soft. Watch the edge of the shadow on the cheek.
      </Try>
      <Choice
        label="light presets"
        options={options}
        value={preset}
        onChange={(p) => {
          setPreset(p);
          if (p !== "yours") setLight(PRESETS[p]);
        }}
        names={NAMES}
      />
      <div ref={box} className={`grid gap-x-2 gap-y-1 ${wide ? "grid-cols-[auto_1fr] items-start" : ""}`}>
        <canvas ref={canvas} role="img" aria-label={`A plaster head. ${describe(light)}`} className="block" />
        <div className="grid gap-y-1">
          <Dial azimuth={light.azimuth} onChange={(azimuth) => change({ azimuth })} />
          <label className="grid grid-cols-[9ch_1fr] items-center gap-x-[1ch]">
            <span>height</span>
            <input
              type="range"
              min={-60}
              max={88}
              step={1}
              value={light.elevation}
              onChange={(e) => change({ elevation: Number(e.target.value) })}
              aria-label="how high the light is"
              aria-valuetext={`${light.elevation} degrees`}
            />
          </label>
          <p className="-mt-1 flex justify-between pl-[10ch] text-muted">
            <span>below</span>
            <span>overhead</span>
          </p>
          <label className="grid grid-cols-[9ch_1fr] items-center gap-x-[1ch]">
            <span>size</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={light.size}
              onChange={(e) => change({ size: Number(e.target.value) })}
              aria-label="how big the light is"
            />
          </label>
          <p className="-mt-1 flex justify-between pl-[10ch] text-muted">
            <span>sun</span>
            <span>window</span>
          </p>
        </div>
      </div>
      <p className="max-w-[64ch]">{describe(light)}</p>
      <figcaption className="max-w-[64ch] text-muted">
        A drawing, not a photo: one light, one plaster head, no colour. Each shadow is worked out by tracing a ray from the
        face toward the light and seeing whether anything is in the way.
      </figcaption>
    </figure>
  );
}

/** The head from above, you at the bottom, and the light on a ring around it. */
function Dial({ azimuth, onChange }: { azimuth: number; onChange: (a: number) => void }) {
  const S = 200;
  const c = S / 2;
  const R = 72;
  const a = (azimuth * Math.PI) / 180;
  const lx = c + R * Math.sin(a);
  const ly = c + R * Math.cos(a);
  const drag = useRef(false);
  const set = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width) * S - c;
    const dy = ((e.clientY - r.top) / r.height) * S - c;
    onChange(Math.round(((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360));
  };
  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width={S}
      height={S}
      className="touch-none select-none"
      onPointerDown={(e) => {
        drag.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => drag.current && set(e)}
      onPointerUp={() => (drag.current = false)}
    >
      <circle cx={c} cy={c} r={R} fill="none" stroke="var(--color-faint)" />
      <line x1={c} y1={c} x2={lx} y2={ly} stroke="var(--color-amber)" strokeDasharray="2 4" />
      {/* The head from above, nose toward you. */}
      <ellipse cx={c} cy={c} rx={22} ry={25} fill="var(--color-ink)" />
      <path d={`M${c - 5} ${c + 23} L${c} ${c + 31} L${c + 5} ${c + 23} Z`} fill="var(--color-ink)" />
      <text x={c} y={S - 4} textAnchor="middle" className="fill-muted text-[13px]">
        you
      </text>
      <text x={c} y={14} textAnchor="middle" className="fill-muted text-[13px]">
        behind
      </text>
      <circle
        cx={lx}
        cy={ly}
        r={9}
        fill="var(--color-amber)"
        tabIndex={0}
        role="slider"
        aria-label="where the light is, around the head"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={azimuth}
        aria-valuetext={`${azimuth} degrees from the front`}
        onKeyDown={(e) => {
          const d = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -5 : e.key === "ArrowRight" || e.key === "ArrowUp" ? 5 : 0;
          if (!d) return;
          e.preventDefault();
          onChange((azimuth + d + 360) % 360);
        }}
        className="cursor-grab"
      />
    </svg>
  );
}

/** "#1f1d1a" → [31, 29, 26]. */
function rgb(hex: string): number[] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
