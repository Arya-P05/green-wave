"use client";

import { useEffect, useRef } from "react";
import { cliff, cliffSpec } from "@/lib/cliff";
import { controllerFor } from "@/lib/sim/scenario";
import type { Kind } from "@/lib/sim/scenario";
import { Sim } from "@/lib/sim/sim";
import { useReducedMotion, useVisible, useWidth } from "../hooks";
import { intersection } from "./draw";

/** Simulated seconds per real second. Fast enough to see queues form, slow enough to follow one car. */
const SPEED = 4;

/** One intersection, live: drag demand or change controller and the same queues carry on. */
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
    const { sim: s, index } = model.current!;
    const { positions, draw } = intersection(canvas.current, size, s, index);

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
