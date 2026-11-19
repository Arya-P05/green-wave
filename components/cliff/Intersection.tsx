"use client";

import { useEffect, useRef } from "react";
import { CLIFF_APPROACH, cliff, cliffSpec } from "@/lib/cliff";
import type { Aspect } from "@/lib/sim/model";
import { controllerFor } from "@/lib/sim/scenario";
import type { Kind } from "@/lib/sim/scenario";
import { Sim } from "@/lib/sim/sim";
import { sizeCanvas, token, useReducedMotion, useVisible, useWidth } from "../hooks";

/** Simulated seconds per real second. Fast enough to see queues form, slow enough to follow one car. */
const SPEED = 4;
/** Cells of each approach that are in view. */
const VIEW = 26;

type Point = { x: number; y: number };

/**
 * One intersection, drawn from above: four single-lane approaches, a car is a
 * short ink dash, and the only colour is the signal at each stop line.
 */
export default function Intersection({ demand, kind }: { demand: number; kind: Kind }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const visible = useVisible(box);
  const still = useReducedMotion();
  // One sim for the life of the figure; demand and controller change it in place.
  const model = useRef<{ sim: Sim; index: ReturnType<typeof cliff>["index"] } | null>(null);

  useEffect(() => {
    if (!model.current) {
      const { network, index } = cliff(demand);
      const sim = new Sim(network, controllerFor(kind, cliffSpec(demand), network), { seed: 1 });
      model.current = { sim: sim.run(300), index };
    }
    const { sim: s, index } = model.current;
    const spec = cliffSpec(demand);
    const links = s.net.links;
    links[index.northbound[0]].demand = spec.northbound;
    links[index.southbound[0]].demand = spec.southbound;
    links[index.cross[0].eastbound[0]].demand = spec.cross[0].eastbound;
    links[index.cross[0].westbound[0]].demand = spec.cross[0].westbound;
    s.controller = controllerFor(kind, spec, s.net);
  }, [demand, kind]);

  useEffect(() => {
    if (!width || !canvas.current) return;
    const size = Math.min(width, 336);
    const ctx = sizeCanvas(canvas.current, size, size);
    const { sim: s, index } = model.current!;
    const colors = {
      ink: token("ink"),
      faint: token("faint"),
      muted: token("muted"),
      green: token("green"),
      amber: token("amber"),
      red: token("red"),
    } satisfies Record<string, string>;

    const c = size / 2;
    const lane = 7; // px from the centre line to a lane's centre
    const half = 2 * lane; // half the width of the junction box
    const cell = (c - half) / VIEW;

    // Each link runs along a direction with its lane offset to the driver's right.
    type Geo = { dir: Point; side: Point; into: boolean };
    const geo = new Map<number, Geo>();
    const arm = (ids: number[], dir: Point) => {
      const side = { x: -dir.y, y: dir.x };
      geo.set(ids[0], { dir, side, into: true });
      geo.set(ids[ids.length - 1], { dir, side, into: false });
    };
    arm(index.northbound, { x: 0, y: -1 });
    arm(index.southbound, { x: 0, y: 1 });
    arm(index.cross[0].eastbound, { x: 1, y: 0 });
    arm(index.cross[0].westbound, { x: -1, y: 0 });

    // Distance past the stop line, in cells: negative on the way in.
    const at = (link: number, pos: number): Point | null => {
      const g = geo.get(link)!;
      const d = g.into ? pos - CLIFF_APPROACH + 0.5 : pos + 0.5;
      if (Math.abs(d) > VIEW) return null;
      const along = d * cell + (d < 0 ? -half : half);
      return { x: c + g.dir.x * along + g.side.x * lane, y: c + g.dir.y * along + g.side.y * lane };
    };

    const positions = () => {
      const out = new Map<number, Point & { dir: Point }>();
      s.cells.forEach((row, link) =>
        row.forEach((car, pos) => {
          const p = car && at(link, pos);
          if (car && p) out.set(car.id, { ...p, dir: geo.get(link)!.dir });
        }),
      );
      return out;
    };

    const draw = (from: ReturnType<typeof positions>, to: ReturnType<typeof positions>, a: number) => {
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = colors.faint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const k of [-1, 1]) {
        ctx.moveTo(c + k * half, 0);
        ctx.lineTo(c + k * half, c - half);
        ctx.moveTo(c + k * half, c + half);
        ctx.lineTo(c + k * half, size);
        ctx.moveTo(0, c + k * half);
        ctx.lineTo(c - half, c + k * half);
        ctx.moveTo(c + half, c + k * half);
        ctx.lineTo(size, c + k * half);
      }
      ctx.stroke();

      ctx.fillStyle = colors.ink;
      for (const [id, p] of to) {
        const q = from.get(id) ?? p;
        const x = q.x + (p.x - q.x) * a;
        const y = q.y + (p.y - q.y) * a;
        const len = cell * 0.7;
        const w = 2.5;
        if (p.dir.x === 0) ctx.fillRect(x - w / 2, y - len / 2, w, len);
        else ctx.fillRect(x - len / 2, y - w / 2, len, w);
      }

      // The signal for each approach, at its stop line.
      for (const [link, g] of geo) {
        if (!g.into) continue;
        const aspect: Aspect = s.aspect(link);
        const x = c - g.dir.x * (half + 4) + g.side.x * lane * 2.3;
        const y = c - g.dir.y * (half + 4) + g.side.y * lane * 2.3;
        ctx.fillStyle = colors[aspect];
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let prev = positions();
    let next = prev;
    if (still || !visible) {
      // No animation: show where the queues settle at this demand.
      if (still) {
        s.run(600);
        next = positions();
      }
      draw(next, next, 1);
      return;
    }

    const tick = 1000 / SPEED;
    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      while (now - last >= tick) {
        s.step();
        prev = next;
        next = positions();
        last += tick;
      }
      draw(prev, next, (now - last) / tick);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [width, visible, still, demand, kind]);

  return (
    <div ref={box} className="w-full">
      <canvas
        ref={canvas}
        role="img"
        aria-label="A four-way intersection seen from above, with cars queueing at each signal"
      />
    </div>
  );
}
