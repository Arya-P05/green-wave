"use client";

import { useEffect, useRef, useState } from "react";
import { meanSpeed, ring, RING_CELLS, ringKmh } from "@/lib/ring";
import type { Sim } from "@/lib/sim/sim";
import { sizeCanvas, token, useReducedMotion, useVisible, useWidth } from "./hooks";

const SPEED = 8; // ticks per real second
const ROWS = 120; // ticks of history on screen
const ROW_PX = 2;
const HEIGHT = ROWS * ROW_PX;

/**
 * A ring road with no lights at all. Space runs right (and wraps), time runs
 * down; each car is a dot, red when it's standing still. Jams appear from
 * nothing and roll backwards against the traffic.
 */
export default function PhantomJam() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const visible = useVisible(box);
  const still = useReducedMotion();
  const [cars, setCars] = useState(36);
  const [speed, setSpeed] = useState<number | null>(null);
  const sim = useRef<Sim | null>(null);

  useEffect(() => {
    if (!width || !canvas.current) return;
    if (!sim.current || sim.current.onRoad().length !== cars) sim.current = ring(cars);
    const s = sim.current;
    const ctx = sizeCanvas(canvas.current, width, HEIGHT);
    const paper = document.createElement("canvas");
    const off = sizeCanvas(paper, width, HEIGHT);
    const ink = token("ink");
    const red = token("red");
    const cell = width / RING_CELLS;
    const dpr = paper.width / width;

    // Scroll the history up one row and draw the road as it is now.
    const row = () => {
      off.globalCompositeOperation = "copy";
      off.drawImage(paper, 0, ROW_PX * dpr, paper.width, paper.height - ROW_PX * dpr, 0, 0, width, HEIGHT - ROW_PX);
      off.globalCompositeOperation = "source-over";
      s.cells[0].forEach((car, i) => {
        if (!car) return;
        off.fillStyle = car.v === 0 ? red : ink;
        const w = car.v === 0 ? 2.5 : 1.5;
        off.fillRect((i + 0.5) * cell - w / 2, HEIGHT - ROW_PX, w, ROW_PX);
      });
    };
    const show = () => {
      ctx.clearRect(0, 0, width, HEIGHT);
      ctx.drawImage(paper, 0, 0, width, HEIGHT);
      setSpeed(ringKmh(meanSpeed(s)));
    };

    if (still || !visible) {
      for (let i = 0; i < ROWS; i++) {
        s.step();
        row();
      }
      show();
      return;
    }
    const tick = 1000 / SPEED;
    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      let moved = false;
      while (now - last >= tick) {
        s.step();
        row();
        last += tick;
        moved = true;
      }
      if (moved) show();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [width, visible, still, cars]);

  // Tap the road: the car nearest the tap stamps on the brakes.
  const brake = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = sim.current;
    if (!s || !width) return;
    const at = ((e.clientX - e.currentTarget.getBoundingClientRect().left) / width) * RING_CELLS;
    let best = -1;
    s.cells[0].forEach((car, i) => {
      if (car && (best < 0 || Math.abs(i - at) < Math.abs(best - at))) best = i;
    });
    if (best >= 0) s.cells[0][best]!.v = 0;
  };

  const density = cars / RING_CELLS;
  return (
    <figure className="my-2 grid gap-y-1">
      <label className="grid max-w-[56ch] grid-cols-[auto_1fr] items-center gap-x-[2ch]">
        <span className="tabular-nums">{String(cars).padStart(2, " ")} cars</span>
        <input
          type="range"
          min={6}
          max={72}
          step={6}
          value={cars}
          onChange={(e) => setCars(Number(e.target.value))}
          aria-label="cars on the ring"
          aria-valuetext={`${cars} cars on 900 metres`}
        />
      </label>
      <div ref={box} className="w-full max-w-[720px]">
        <canvas
          ref={canvas}
          onClick={brake}
          className="cursor-pointer"
          role="img"
          aria-label={`A ring road with ${cars} cars and no lights, drawn over time: jams form and roll backwards.`}
        />
      </div>
      <p className="tabular-nums">
        {speed === null ? "" : `${Math.round(speed)} km/h on average`}
        <span className="text-muted">
          {" "}
          · {Math.round(density * 100)}% of the road full · tap the road to make one driver brake
        </span>
      </p>
      <figcaption className="text-muted">
        900 m of ring road, same car rules as everywhere else in this post, no lights. Space runs right
        (wrapping round), time runs down; red is a car standing still.
      </figcaption>
    </figure>
  );
}
