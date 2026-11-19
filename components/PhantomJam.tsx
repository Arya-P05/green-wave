"use client";

import { useEffect, useRef, useState } from "react";
import { meanSpeed, ring, RING_CELLS, ringKmh } from "@/lib/ring";
import { CELL_M, VMAX } from "@/lib/sim/model";
import type { Sim } from "@/lib/sim/sim";
import { sizeCanvas, token, useReducedMotion, useVisible, useWidth } from "./hooks";
import Try from "./Try";

const LANES = 2;
const PACE = { slow: 2, normal: 4 }; // sim seconds per real second
type Pace = keyof typeof PACE;
const FADE_S = 1.5; // how long a car stays coloured after it speeds up again
const ROW_PX = 3;
const MAX_LOOP = 320;
const ROAD_M = RING_CELLS * CELL_M;

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const mix = (a: Rgb, b: Rgb, t: number) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",")})`;

/**
 * A two-lane ring road with no lights at all, twice. On the left, the road
 * itself: cars going round, coloured by how slow they are. On the right, the
 * outer lane unrolled into one line and stacked over time, so jams show up as
 * streaks that drift backwards against the traffic.
 */
export default function PhantomJam() {
  const box = useRef<HTMLDivElement>(null);
  const loop = useRef<HTMLCanvasElement>(null);
  const chart = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const visible = useVisible(box);
  const still = useReducedMotion();
  const [cars, setCars] = useState(36);
  const [speed, setSpeed] = useState<number | null>(null);
  const [pace, setPace] = useState<Pace>("normal");
  const [paused, setPaused] = useState(false);
  const [braked, setBraked] = useState(0);
  const sim = useRef<Sim | null>(null);
  const watched = useRef<number | null>(null);
  const play = useRef({ pace, paused });
  useEffect(() => {
    play.current = { pace, paused };
  }, [pace, paused]);
  const size = Math.min(MAX_LOOP, width);
  const outer = size / 2 - 18; // room outside the road for trees
  const inner = outer - 11;
  // With reduced motion each brake redraws a still of what happens next.
  const redraw = still ? braked : 0;

  useEffect(() => {
    if (!size || !loop.current || !chart.current) return;
    if (!sim.current || sim.current.onRoad().length !== cars * LANES) {
      sim.current = ring(cars, 1, LANES);
      watched.current = null;
    }
    const s = sim.current;
    const ink = rgb(token("ink"));
    const amber = rgb(token("amber"));
    const red = rgb(token("red"));
    const faint = token("faint");
    // 0 at full speed, 1 standing still: ink, then amber, then red.
    const color = (h: number) => (h < 0.5 ? mix(ink, amber, h * 2) : mix(amber, red, h * 2 - 1));
    const heat = new Map<number, number>();
    // Stopped is red; creeping along at half speed gets a little warmth; full speed is ink.
    const target = (v: number) => (v === 0 ? 1 : v < VMAX ? 0.25 : 0);
    let from = new Map<number, number>();

    const lctx = sizeCanvas(loop.current, size, size);
    const c = size / 2;
    const radius = [outer, inner];

    // The ground, drawn once: the road, a dashed line between the lanes, a start line at the top, and
    // trees that stay put, so you can see the cars moving past them rather than the ring turning.
    const ground = document.createElement("canvas");
    const g = sizeCanvas(ground, size, size);
    const mid = (outer + inner) / 2;
    g.strokeStyle = faint;
    g.lineWidth = outer - inner + 9;
    g.beginPath();
    g.arc(c, c, mid, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = token("canvas");
    g.lineWidth = 1;
    g.setLineDash([4, 5]);
    g.beginPath();
    g.arc(c, c, mid, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.strokeStyle = token("muted");
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(c, c - outer - 6);
    g.lineTo(c, c - inner + 6);
    g.stroke();
    g.fillStyle = token("green");
    g.globalAlpha = 0.35;
    const trees: [number, number][] = [
      [0.07, outer + 11], [0.19, outer + 12], [0.33, outer + 10], [0.46, outer + 12], [0.58, outer + 11],
      [0.71, outer + 10], [0.86, outer + 12], [0.12, inner - 22], [0.52, inner - 30], [0.78, inner - 18],
    ];
    for (const [turn, r] of trees) {
      const angle = turn * Math.PI * 2 - Math.PI / 2;
      g.beginPath();
      g.arc(c + r * Math.cos(angle), c + r * Math.sin(angle), 4, 0, Math.PI * 2);
      g.fill();
    }
    const len = ((2 * Math.PI * inner) / RING_CELLS) * 0.75;
    const drawLoop = (a: number) => {
      lctx.clearRect(0, 0, size, size);
      lctx.drawImage(ground, 0, 0, size, size);
      s.cells.forEach((lane, l) =>
        lane.forEach((car, pos) => {
          if (!car) return;
          // Glide from last tick's cell to this one; cars drive clockwise from the top.
          const was = from.get(car.id) ?? pos;
          const at = was + (((pos - was + RING_CELLS) % RING_CELLS) * a);
          const angle = ((at + 0.5) / RING_CELLS) * Math.PI * 2 - Math.PI / 2;
          const x = c + radius[l] * Math.cos(angle);
          const y = c + radius[l] * Math.sin(angle);
          lctx.save();
          lctx.translate(x, y);
          lctx.rotate(angle + Math.PI / 2);
          lctx.fillStyle = color(heat.get(car.id) ?? 0);
          lctx.fillRect(-len / 2, -1.5, len, 3);
          lctx.restore();
          if (car.id === watched.current) {
            lctx.strokeStyle = `rgb(${ink.join(",")})`;
            lctx.lineWidth = 1;
            lctx.beginPath();
            lctx.arc(x, y, 7, 0, Math.PI * 2);
            lctx.stroke();
          }
        }),
      );
    };

    const cw = width;
    const ctx = sizeCanvas(chart.current, cw, size);
    const paper = document.createElement("canvas");
    const off = sizeCanvas(paper, cw, size);
    const cell = cw / RING_CELLS;
    const dpr = paper.width / Math.max(1, cw);
    // Scroll the history up one row and add the outer lane as it is now at the bottom.
    const row = () => {
      off.globalCompositeOperation = "copy";
      off.drawImage(paper, 0, ROW_PX * dpr, paper.width, paper.height - ROW_PX * dpr, 0, 0, cw, size - ROW_PX);
      off.globalCompositeOperation = "source-over";
      s.cells[0].forEach((car, i) => {
        if (!car) return;
        const h = heat.get(car.id) ?? 0;
        const dot = 1.5 + h * 1.5;
        off.fillStyle = color(h);
        off.fillRect((i + 0.5) * cell - dot / 2, size - ROW_PX, dot, ROW_PX);
        if (car.id === watched.current) {
          off.fillStyle = `rgb(${ink.join(",")})`;
          off.fillRect((i + 0.5) * cell - 3, size - ROW_PX, 1, ROW_PX);
          off.fillRect((i + 0.5) * cell + 2, size - ROW_PX, 1, ROW_PX);
        }
      });
    };
    // One sim second: remember where everyone was, move, and light up anyone who slowed.
    const tick = () => {
      from = new Map();
      s.cells.forEach((lane) => lane.forEach((car, pos) => car && from.set(car.id, pos)));
      s.step();
      for (const car of s.onRoad()) heat.set(car.id, Math.max(heat.get(car.id) ?? 0, target(car.v)));
      row();
      setSpeed(ringKmh(meanSpeed(s)));
    };
    const fade = (dt: number) => {
      for (const car of s.onRoad()) {
        const h = heat.get(car.id) ?? 0;
        heat.set(car.id, Math.max(target(car.v), h - dt / FADE_S));
      }
    };
    const show = (a: number) => {
      ctx.clearRect(0, 0, cw, size);
      ctx.drawImage(paper, 0, 0, cw, size);
      drawLoop(a);
    };

    // Start with a full chart of history.
    for (let i = Math.floor(size / ROW_PX); i > 0; i--) {
      tick();
      fade(1);
    }
    show(1);
    if (still || !visible) return;
    let acc = 0;
    let last = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const dt = Math.min(now - last, 250);
      last = now;
      const ms = 1000 / PACE[play.current.pace];
      if (!play.current.paused) {
        acc += dt;
        fade(dt / 1000);
      }
      while (acc >= ms) {
        tick();
        acc -= ms;
      }
      show(acc / ms);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [width, size, outer, inner, visible, still, cars, redraw]);

  // Tap either view: the car nearest the tap stamps on the brakes, and gets a ring so you can follow it.
  const brakeAt = (lane: number, cellAt: number) => {
    const s = sim.current;
    if (!s) return;
    let best = -1;
    const dist = (i: number) => Math.min(Math.abs(i - cellAt), RING_CELLS - Math.abs(i - cellAt));
    s.cells[lane].forEach((car, i) => {
      if (car && (best < 0 || dist(i) < dist(best))) best = i;
    });
    if (best < 0) return;
    const car = s.cells[lane][best]!;
    car.v = 0;
    watched.current = car.id;
    setBraked((n) => n + 1);
  };
  const onChart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    brakeAt(0, ((e.clientX - b.left) / b.width) * RING_CELLS);
  };
  const onLoop = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - b.left - size / 2;
    const dy = e.clientY - b.top - size / 2;
    const r = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx) + Math.PI / 2;
    brakeAt(Math.abs(r - outer) <= Math.abs(r - inner) ? 0 : 1, ((((a / (Math.PI * 2)) % 1) + 1) % 1) * RING_CELLS);
  };

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="a two-lane loop of road with no lights, no crashes, nothing in the way. Just cars.">
        slide the cars up past about 40 a lane, then tap a car to make that driver brake. It gets a ring so
        you can follow it, and the jam it starts behind it.
      </Try>
      <div className="flex flex-wrap items-center gap-x-[2ch] gap-y-[6px]">
        <label className="grid min-w-[28ch] flex-1 grid-cols-[auto_1fr] items-center gap-x-[2ch]">
          <span className="tabular-nums">{String(cars).padStart(2, " ")} cars a lane</span>
          <input
            type="range"
            min={6}
            max={72}
            step={6}
            value={cars}
            onChange={(e) => setCars(Number(e.target.value))}
            aria-label="cars in each lane of the ring"
            aria-valuetext={`${cars} cars in each ${ROAD_M} metre lane`}
          />
        </label>
        {!still && (
          <span className="flex gap-x-[2ch]">
            <button onClick={() => setPaused(!paused)} className="underline decoration-faint hover:decoration-ink">
              {paused ? "play" : "pause"}
            </button>
            <button
              onClick={() => setPace(pace === "slow" ? "normal" : "slow")}
              className="underline decoration-faint hover:decoration-ink"
              aria-label={`speed: ${pace}, tap to change`}
            >
              {pace === "slow" ? "slow" : "normal"} speed
            </button>
          </span>
        )}
      </div>
      <div className="grid items-start gap-x-2 gap-y-1 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="grid justify-self-center md:justify-self-start">
          <span className="text-muted">the road from above, both lanes</span>
          <canvas
            ref={loop}
            onClick={onLoop}
            className="cursor-pointer"
            role="img"
            aria-label={`A two-lane circular road with ${cars} cars in each lane and no lights.`}
          />
        </div>
        <div className="grid min-w-0 grid-cols-[3ch_minmax(0,1fr)] gap-x-[1ch]">
          <span className="col-start-2 text-muted">outer lane, unrolled, driving →</span>
          <span className="row-span-2 text-muted [writing-mode:vertical-rl]">time →</span>
          <div ref={box} className="w-full max-w-[720px]">
            <canvas
              ref={chart}
              onClick={onChart}
              className="cursor-pointer"
              role="img"
              aria-label="The outer lane unrolled into a line, one row per second, newest at the bottom: jams show as red streaks drifting backwards."
            />
          </div>
          <span className="col-start-2 max-w-[720px] text-right text-muted">now</span>
        </div>
      </div>
      <p className="tabular-nums">
        {speed === null ? "" : `${Math.round(speed)} km/h on average`}
        <span className="text-muted"> · {Math.round((cars / RING_CELLS) * 100)}% of the road full</span>
      </p>
      <figcaption className="text-muted">
        Each little box is a car. Red means it stopped, and it fades through orange back to ink over a
        second or so once it gets going again; a car creeping along at half speed stays a little warm. The two lanes are separate loops, {ROAD_M} m each, and
        nobody changes lanes. In the unrolled view, each row is one second of the outer lane, newest at the
        bottom, so a red streak drifting left is a jam rolling backwards while the cars in it drive forwards.
        Same car rules as the rest of this post, no lights.
      </figcaption>
    </figure>
  );
}
