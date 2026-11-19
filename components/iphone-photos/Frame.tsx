"use client";

import { useRef, useState } from "react";
import { PHI, preferred, THIRDS, verdict } from "@/lib/iphone-photos/frame";
import type { Facing, Verdict } from "@/lib/iphone-photos/frame";
import Choice from "@/components/shared/Choice";
import { useWidth } from "@/components/shared/hooks";
import Try from "@/components/shared/Try";

const GRIDS = ["thirds", "phi", "centre", "none"] as const;
type Grid = (typeof GRIDS)[number];
const GRID_NAMES: Record<Grid, string> = { thirds: "thirds", phi: "phi grid", centre: "centre", none: "no grid" };
const FACINGS = ["left", "you", "right"] as const;
const FACING_NAMES: Record<Facing, string> = { left: "looking left", you: "looking at you", right: "looking right" };

const RATIO = 3 / 2;
/** A person is this many head-heights tall. */
const HEADS = 7.5;

const SAYS: Record<Verdict, string> = {
  centre: "",
  inward:
    "Off-centre, looking into the frame, with room in front of her. This is the one case where the rule of thirds and the research agree.",
  outward:
    "Looking out of the frame, with her back to the empty space. Most of Palmer’s viewers disliked this, even on a third line.",
  "off-centre":
    "Off-centre but looking straight at you. For a subject facing them, Palmer’s viewers liked the centre most, and liked it less the further out it went.",
};

/** Drag one person around a frame, with the usual grids over it, and see what the research says about where she is. */
export default function Frame() {
  const box = useRef<HTMLDivElement>(null);
  const width = Math.min(useWidth(box), 640);
  const height = width / RATIO;
  const [grid, setGrid] = useState<Grid>("thirds");
  const [facing, setFacing] = useState<Facing>("right");
  // Where the top of her head is (0–1 of the frame), and how tall she is (fraction of frame height).
  const [pos, setPos] = useState({ x: 2 / 3, y: 0.3 });
  const [tall, setTall] = useState(0.55);
  const drag = useRef(false);

  const place = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    setPos({ x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) });
  };
  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    setPos((p) => ({ x: Math.max(0, Math.min(1, p.x + d[0])), y: Math.max(0, Math.min(1, p.y + d[1])) }));
  };

  const v = verdict(pos.x, facing);
  const head = (tall * height) / HEADS;
  const headroom = pos.y - head / 2 / height;
  const lines = grid === "thirds" ? THIRDS : grid === "phi" ? PHI : grid === "centre" ? [0.5] : [];
  const onThird = THIRDS.some((t) => Math.abs(pos.x - t) < 0.04);
  const says =
    v === "centre"
      ? facing === "you"
        ? "Centred and looking at you: the spot Palmer’s viewers liked best for a subject facing them."
        : "Centred, looking sideways. Palmer’s viewers liked this about as much as nudging her a little away from where she’s looking."
      : SAYS[v];

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="a frame with one person in it, the way you’d see her on your screen. The small mark under the frame is where people in Palmer’s experiments liked a subject facing this way best.">
        drag her onto a third line, then turn her to look out of the frame. Then try her in the middle, looking at you.
      </Try>
      <Choice label="which way she looks" options={FACINGS} value={facing} onChange={setFacing} names={FACING_NAMES} />
      <Choice label="grid" options={GRIDS} value={grid} onChange={setGrid} names={GRID_NAMES} />
      <label className="grid max-w-[56ch] grid-cols-[auto_1fr] items-center gap-x-[2ch]">
        <span>how big she is</span>
        <input
          type="range"
          min={0.15}
          max={2.4}
          step={0.01}
          value={tall}
          onChange={(e) => setTall(Number(e.target.value))}
          aria-label="how big she is in the frame"
        />
      </label>
      <div ref={box} className="w-full">
        {width > 0 && (
          <svg
            width={width}
            height={height + 28}
            className="block touch-none select-none"
            onPointerDown={(e) => {
              drag.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              place(e);
            }}
            onPointerMove={(e) => drag.current && place(e)}
            onPointerUp={() => (drag.current = false)}
            role="img"
            aria-label={`A frame with a person ${Math.round(pos.x * 100)}% of the way across, ${FACING_NAMES[facing]}.`}
          >
            <defs>
              <clipPath id="frame-clip">
                <rect width={width} height={height} />
              </clipPath>
            </defs>
            <rect x={0.5} y={0.5} width={width - 1} height={height - 1} fill="none" stroke="var(--color-faint)" />
            <g stroke="var(--color-muted)" strokeWidth={0.75} strokeDasharray="2 4">
              {lines.map((t) => (
                <line key={`v${t}`} x1={t * width} x2={t * width} y1={0} y2={height} />
              ))}
              {lines.map((t) => (
                <line key={`h${t}`} y1={t * height} y2={t * height} x1={0} x2={width} />
              ))}
            </g>
            <g clipPath="url(#frame-clip)">
              <Person x={pos.x * width} y={pos.y * height} head={head} facing={facing} />
            </g>
            <g
              tabIndex={0}
              onKeyDown={nudge}
              aria-label="the person; arrow keys move her"
              role="button"
              className="outline-none focus-visible:[&>circle]:stroke-ink"
            >
              <circle cx={pos.x * width} cy={pos.y * height} r={Math.max(head / 2, 14)} fill="transparent" stroke="transparent" />
            </g>
            <g transform={`translate(${preferred(facing) * width}, ${height + 4})`}>
              <path d="M0 0 L-5 8 L5 8 Z" fill="var(--color-green)" />
            </g>
            <text
              x={preferred(facing) * width}
              y={height + 24}
              textAnchor={preferred(facing) > 0.5 ? "start" : "end"}
              dx={preferred(facing) > 0.5 ? -4 : 4}
              className="fill-muted text-[13px]"
            >
              liked best
            </text>
          </svg>
        )}
      </div>
      <p className="tabular-nums text-muted">
        {Math.round(pos.x * 100)}% across{onThird && " (on a third line)"} ·{" "}
        {headroom < 0 ? "top of her head cut off" : `${Math.round(headroom * 100)}% room above her head`}
      </p>
      <p>{says}</p>
      <figcaption className="max-w-[64ch] text-muted">
        “Liked best” is from Palmer, Gardner &amp; Wickens (2008), who tested single objects on plain backgrounds. With a real
        background behind her, the answer can change.
      </figcaption>
    </figure>
  );
}

/** A plain figure: head, body and legs, seven and a half heads tall. (x, y) is the middle of the head. */
function Person({ x, y, head, facing }: { x: number; y: number; head: number; facing: Facing }) {
  const side = facing === "you" ? 0 : facing === "right" ? 1 : -1;
  const shoulders = side ? head * 1.15 : head * 1.9;
  const hips = side ? head * 1.0 : head * 1.4;
  const r = head / 2;
  const top = y + r * 1.25; // bottom of the neck
  const waist = y + head * 3.7;
  const feet = y + head * (HEADS - 0.5);
  const legGap = side ? head * 0.08 : head * 0.2;
  return (
    <g fill="var(--color-ink)">
      <circle cx={x} cy={y} r={r} />
      {side !== 0 && <path d={`M${x + side * r * 0.9} ${y - r * 0.15} L${x + side * r * 1.25} ${y + r * 0.2} L${x + side * r * 0.85} ${y + r * 0.3} Z`} />}
      {/* Eyes, in the canvas colour, so you can tell where she's looking. */}
      <g fill="var(--color-canvas)">
        {side === 0 ? (
          <>
            <circle cx={x - r * 0.35} cy={y - r * 0.05} r={Math.max(r * 0.1, 0.8)} />
            <circle cx={x + r * 0.35} cy={y - r * 0.05} r={Math.max(r * 0.1, 0.8)} />
          </>
        ) : (
          <circle cx={x + side * r * 0.55} cy={y - r * 0.1} r={Math.max(r * 0.1, 0.8)} />
        )}
      </g>
      <path
        d={`M${x - shoulders / 2} ${top + head * 0.3} Q${x - shoulders / 2} ${top} ${x} ${top} Q${x + shoulders / 2} ${top} ${x + shoulders / 2} ${top + head * 0.3} L${x + hips / 2} ${waist} L${x - hips / 2} ${waist} Z`}
      />
      <path
        d={`M${x - hips / 2} ${waist - 1} L${x + hips / 2} ${waist - 1} L${x + legGap / 2 + head * 0.25} ${feet} L${x + legGap / 2} ${feet} L${x} ${waist + head} L${x - legGap / 2} ${feet} L${x - legGap / 2 - head * 0.25} ${feet} Z`}
      />
    </g>
  );
}
