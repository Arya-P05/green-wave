"use client";

import { useEffect, useRef, useState } from "react";
import { meanSpeed, ring, RING_CELLS, ringKmh } from "@/lib/ring";
import type { Sim } from "@/lib/sim/sim";
import { sizeCanvas, token, useReducedMotion, useVisible, useWidth } from "./hooks";
import Try from "./Try";

const SPEED = 8; // ticks per real second
const ROWS = 120; // ticks of history on the chart
const ROW_PX = 2;
const HEIGHT = ROWS * ROW_PX;
const LOOP = HEIGHT; // the loop view is a square as tall as the chart

/**
 * A ring road with no lights at all, twice. On the left, the road itself:
 * cars going round, red when standing still. On the right, the same road
 * unrolled into one line and stacked over time, so jams show up as streaks
 * that drift backwards against the traffic.
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
  const sim = useRef<Sim | null>(null);

  useEffect(() => {
    if (!width || !loop.current || !chart.current) return;
    if (!sim.current || sim.current.onRoad().length !== cars) sim.current = ring(cars);
    const s = sim.current;
    const ink = token("ink");
    const red = token("red");
    const faint = token("faint");

    const lctx = sizeCanvas(loop.current, LOOP, LOOP);
    const c = LOOP / 2;
    const r = c - 10;
    const drawLoop = () => {
      lctx.clearRect(0, 0, LOOP, LOOP);
      lctx.strokeStyle = faint;
      lctx.lineWidth = 9;
      lctx.beginPath();
      lctx.arc(c, c, r, 0, Math.PI * 2);
      lctx.stroke();
      s.cells[0].forEach((car, i) => {
        if (!car) return;
        // Cars drive clockwise, starting from the top.
        const a = (i / RING_CELLS) * Math.PI * 2 - Math.PI / 2;
        lctx.fillStyle = car.v === 0 ? red : ink;
        lctx.beginPath();
        lctx.arc(c + r * Math.cos(a), c + r * Math.sin(a), car.id === 0 ? 4 : 2.5, 0, Math.PI * 2);
        lctx.fill();
      });
    };

    const w = Math.max(0, width);
    const ctx = sizeCanvas(chart.current, w, HEIGHT);
    const paper = document.createElement("canvas");
    const off = sizeCanvas(paper, w, HEIGHT);
    const cell = w / RING_CELLS;
    const dpr = paper.width / Math.max(1, w);
    // Scroll the history up one row and add the road as it is now at the bottom.
    const row = () => {
      off.globalCompositeOperation = "copy";
      off.drawImage(paper, 0, ROW_PX * dpr, paper.width, paper.height - ROW_PX * dpr, 0, 0, w, HEIGHT - ROW_PX);
      off.globalCompositeOperation = "source-over";
      s.cells[0].forEach((car, i) => {
        if (!car) return;
        const dot = car.v === 0 ? 2.5 : 1.5;
        off.fillStyle = car.v === 0 ? red : ink;
        off.fillRect((i + 0.5) * cell - dot / 2, HEIGHT - ROW_PX, dot, ROW_PX);
      });
    };
    const show = () => {
      ctx.clearRect(0, 0, w, HEIGHT);
      ctx.drawImage(paper, 0, 0, w, HEIGHT);
      drawLoop();
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
    const animate = (now: number) => {
      let moved = false;
      while (now - last >= tick) {
        s.step();
        row();
        last += tick;
        moved = true;
      }
      if (moved) show();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [width, visible, still, cars]);

  // Tap either view: the car nearest the tap stamps on the brakes.
  const brakeAt = (cellAt: number) => {
    const s = sim.current;
    if (!s) return;
    let best = -1;
    const dist = (i: number) => Math.min(Math.abs(i - cellAt), RING_CELLS - Math.abs(i - cellAt));
    s.cells[0].forEach((car, i) => {
      if (car && (best < 0 || dist(i) < dist(best))) best = i;
    });
    if (best >= 0) s.cells[0][best]!.v = 0;
  };
  const onChart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (width) brakeAt(((e.clientX - e.currentTarget.getBoundingClientRect().left) / width) * RING_CELLS);
  };
  const onLoop = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const a = Math.atan2(e.clientY - b.top - LOOP / 2, e.clientX - b.left - LOOP / 2) + Math.PI / 2;
    brakeAt((((a / (Math.PI * 2)) % 1) + 1) % 1 * RING_CELLS);
  };

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="a loop of road with no lights, no crashes, nothing in the way. Just cars.">
        slide the cars up past about 40, then tap the road to make one driver brake. Watch a jam appear out
        of nothing.
      </Try>
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
      <div className="grid items-start gap-x-2 gap-y-1 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="grid justify-self-center md:justify-self-start">
          <span className="text-muted">the road, from above</span>
          <canvas
            ref={loop}
            onClick={onLoop}
            className="cursor-pointer"
            role="img"
            aria-label={`A circular road with ${cars} cars and no lights.`}
          />
        </div>
        <div className="grid min-w-0 grid-cols-[3ch_minmax(0,1fr)] gap-x-[1ch]">
          <span className="col-start-2 text-muted">unrolled, driving →</span>
          <span className="row-span-2 text-muted [writing-mode:vertical-rl]">time ↓</span>
          <div ref={box} className="w-full max-w-[720px]">
            <canvas
              ref={chart}
              onClick={onChart}
              className="cursor-pointer"
              role="img"
              aria-label="The same ring road unrolled into a line, one row per second, newest at the bottom: jams show as red streaks drifting backwards."
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
        Ink dots are moving cars, red dots are cars standing still. In the unrolled view, each row is one second of
        the whole loop, newest at the bottom, so a red streak drifting left is a jam rolling backwards while
        the cars in it drive forwards. 900 m of road, the same car rules as the rest of this post, no
        lights.
      </figcaption>
    </figure>
  );
}
