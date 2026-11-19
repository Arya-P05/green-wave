"use client";

import { useEffect, useRef } from "react";
import { sizeCanvas, token, useReducedMotion, useWidth } from "../hooks";
import { lights, spadina } from "./run";
import type { Car, Run } from "./run";

const PX_PER_S = 1.5;
const HEIGHT = 432; // 18 lines
const LEFT = 96; // street names
const BOTTOM = 36;
const DRAW_MS = 1100;
/** How close a tap must land to a car's line to pick it, in px. */
const REACH = 12;

// Spadina runs up the plot, a few cells past the first and last lights.
const lo = lights[0] - 12;
const hi = lights[lights.length - 1] + 12;
const h = HEIGHT - BOTTOM;
const y = (x: number) => ((hi - x) / (hi - lo)) * h;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Every sample of a path that falls in the window, as plot pixels. */
function points(path: number[], t0: number, t1: number, px: (t: number) => number): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k < path.length; k += 2) {
    if (path[k] < t0 || path[k] > t1 || path[k + 1] < lo || path[k + 1] > hi) continue;
    out.push([px(path[k]), y(path[k + 1])]);
  }
  return out;
}

/**
 * The time-space diagram: time runs right, Spadina runs up from Fort York to
 * College. Each car is one fine line, northbound in ink, southbound in grey.
 * The bar at each street is that light's colour for Spadina at that moment.
 * A green wave is a band of parallel diagonal lines slipping through the greens.
 * Tap a line to follow that one car.
 */
export default function Diagram({
  run,
  label,
  picked = null,
  onPick,
}: {
  run: Run;
  label: string;
  picked?: Car | null;
  onPick?: (car: Car | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const still = useReducedMotion();

  const plot = Math.max(0, width - LEFT);
  const seconds = Math.min(600, Math.floor(plot / PX_PER_S));
  const t1 = run.end;
  const t0 = t1 - seconds;
  const px = (t: number) => (t - t0) * (plot / seconds);

  useEffect(() => {
    if (!plot || !canvas.current) return;
    const ctx = sizeCanvas(canvas.current, plot, h);
    const paper = document.createElement("canvas");
    const off = sizeCanvas(paper, plot, h);
    const px = (t: number) => (t - t0) * (plot / seconds);
    const color = { ink: token("ink"), muted: token("muted"), green: token("green"), amber: token("amber"), red: token("red") };

    // Lights first, so the cars' lines cross over them.
    run.aspects.forEach((aspects, i) => {
      for (let t = t0; t < t1; t++) {
        off.fillStyle = color[aspects[t]];
        off.fillRect(px(t), y(lights[i]) - 1, plot / seconds + 0.5, 2);
      }
    });

    off.lineWidth = 0.75;
    off.lineJoin = "round";
    for (const dir of [-1, 1]) {
      off.strokeStyle = dir === 1 ? color.ink : color.muted;
      off.globalAlpha = dir === 1 ? 0.55 : 0.45;
      off.beginPath();
      for (const car of run.cars) {
        const p = car.path;
        if (car.dir !== dir || p[p.length - 2] < t0 || p[0] > t1) continue;
        let started = false;
        for (let k = 0; k < p.length; k += 2) {
          if (p[k] < t0 || p[k] > t1 || p[k + 1] < lo || p[k + 1] > hi) {
            started = false;
            continue;
          }
          if (started) off.lineTo(px(p[k]), y(p[k + 1]));
          else off.moveTo(px(p[k]), y(p[k + 1]));
          started = true;
        }
      }
      off.stroke();
    }
    off.globalAlpha = 1;

    const show = (share: number) => {
      ctx.clearRect(0, 0, plot, h);
      const w = Math.max(1, Math.round(plot * share));
      ctx.drawImage(paper, 0, 0, paper.width * share, paper.height, 0, 0, w, h);
    };
    if (still) {
      show(1);
      return;
    }
    // Draw like a plotter: left to right, once, each time the run changes.
    let frame = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / DRAW_MS);
      show(easeOut(t));
      if (t < 1) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [run, plot, seconds, t0, t1, still]);

  // The picked car, drawn bold on its own layer so the plot doesn't redraw.
  useEffect(() => {
    if (!plot || !overlay.current) return;
    const ctx = sizeCanvas(overlay.current, plot, h);
    if (!picked) return;
    const px = (t: number) => (t - t0) * (plot / seconds);
    ctx.strokeStyle = token("ink");
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    points(picked.path, t0, t1, px).forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
    ctx.stroke();
  }, [picked, plot, seconds, t0, t1]);

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPick) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    let best: Car | null = null;
    let near = REACH;
    for (const car of run.cars) {
      if (!car.trip) continue;
      for (const [a, b] of points(car.path, t0, t1, px)) {
        const d = Math.hypot(a - cx, b - cy);
        if (d < near) {
          near = d;
          best = car;
        }
      }
    }
    onPick(best);
  };

  return (
    <div>
      <div className="flex justify-between text-muted" style={{ paddingLeft: LEFT }}>
        <span>↑ north</span>
        <span>time →</span>
      </div>
      <div ref={box} className="relative w-full" style={{ height: HEIGHT }}>
        {spadina.lights.map((l, i) => (
          <span key={l.short} className="absolute left-0 text-muted" style={{ top: y(lights[i]) - 12 }}>
            {l.short}
          </span>
        ))}
        <canvas ref={canvas} className="absolute top-0" style={{ left: LEFT }} role="img" aria-label={label} />
        <canvas
          ref={overlay}
          className={`absolute top-0 ${onPick ? "cursor-crosshair" : "pointer-events-none"}`}
          style={{ left: LEFT }}
          onClick={pick}
          aria-hidden
        />
        {plot > 0 &&
          Array.from({ length: Math.floor(seconds / 120) + 1 }, (_, i) => (
            <span key={i} className="absolute text-muted" style={{ left: LEFT + i * 120 * (plot / seconds), top: h + 6 }}>
              {i * 2}
              {i === 0 ? " min" : ""}
            </span>
          ))}
      </div>
    </div>
  );
}
