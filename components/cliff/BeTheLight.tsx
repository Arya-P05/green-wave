"use client";

import { useEffect, useRef, useState } from "react";
import { byHand, GAME_DEMAND, GAME_S, gameStart, rivalScore, RIVALS } from "@/lib/game";
import { LABELS } from "@/lib/sim/scenario";
import { useWidth } from "../hooks";
import { intersection } from "./draw";

const SPEED = 4; // simulated seconds per real second, as in the figure above

type Stage = { at: "ready" } | { at: "playing"; left: number; switches: number } | { at: "done"; you: number; switches: number };

const minutes = (carSeconds: number) => (carSeconds / 60).toFixed(1);

/**
 * You are the light. Tap to give the other street green; the sim pays the
 * amber and all-red for you. Two simulated minutes, then your total delay
 * against the controllers' on the same traffic.
 */
export default function BeTheLight() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const [stage, setStage] = useState<Stage>({ at: "ready" });
  const [game, setGame] = useState(0); // bumps to start a new game
  const you = useRef<ReturnType<typeof byHand> | null>(null);
  const [rivals, setRivals] = useState<Record<string, number> | null>(null);

  const playing = stage.at === "playing";
  const flip = () => {
    const c = you.current;
    if (!c || !playing) return;
    c.want = 1 - c.want;
    setStage((s) => (s.at === "playing" ? { ...s, switches: s.switches + 1 } : s));
  };

  useEffect(() => {
    if (!width || !canvas.current) return;
    const size = Math.min(width, 336);
    const c = byHand();
    const { sim, index, end } = gameStart(c);
    c.want = sim.nodes[0].phase;
    you.current = c;
    const { positions, draw } = intersection(canvas.current, size, sim, index);
    let prev = positions();
    let next = prev;
    draw(next, next, 1);
    if (!game) return;

    const tick = 1000 / SPEED;
    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      while (now - last >= tick && sim.t < end) {
        sim.step();
        prev = next;
        next = positions();
        last += tick;
        setStage((s) => (s.at === "playing" ? { ...s, left: end - sim.t } : s));
      }
      draw(prev, next, Math.min(1, (now - last) / tick));
      if (sim.t < end) frame = requestAnimationFrame(loop);
      else setStage((s) => ({ at: "done", you: sim.delay, switches: s.at === "playing" ? s.switches : 0 }));
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [width, game]);

  const start = () => {
    if (!rivals) setRivals(Object.fromEntries(RIVALS.map((k) => [k, rivalScore(k)])));
    setStage({ at: "playing", left: GAME_S, switches: 0 });
    setGame((g) => g + 1);
  };

  const board =
    stage.at === "done" && rivals
      ? [{ name: "you", score: stage.you }, ...RIVALS.map((k) => ({ name: LABELS[k], score: rivals[k] }))].sort(
          (a, b) => a.score - b.score,
        )
      : null;

  return (
    <figure className="my-2 grid gap-y-1">
      <div className="grid items-start gap-x-2 gap-y-1 md:grid-cols-[minmax(0,336px)_minmax(0,1fr)]">
        <div ref={box} className="w-full">
          <canvas
            ref={canvas}
            onClick={flip}
            className={playing ? "cursor-pointer" : undefined}
            role="img"
            aria-label="A four-way intersection you control: tap to switch which street has green"
          />
        </div>
        <div className="grid content-start gap-y-1">
          {stage.at === "ready" && (
            <>
              <p>
                You&apos;re the light. Same junction, demand {GAME_DEMAND}. Tap the junction (or the button) to
                give the other street green. Every switch costs 4 seconds of amber and all-red.
              </p>
              <p>
                <button onClick={start} className="cursor-pointer underline decoration-faint underline-offset-4 hover:decoration-green">
                  start ({GAME_S / 60} minutes, about {GAME_S / SPEED} seconds)
                </button>
              </p>
            </>
          )}
          {stage.at === "playing" && (
            <>
              <p className="tabular-nums" aria-live="off">
                {stage.left}s left · {stage.switches} {stage.switches === 1 ? "switch" : "switches"}
              </p>
              <p>
                <button
                  onClick={flip}
                  className="cursor-pointer underline decoration-faint underline-offset-4 hover:decoration-green"
                >
                  switch
                </button>
              </p>
            </>
          )}
          {board && (
            <>
              <table className="w-full max-w-[40ch] tabular-nums" aria-live="polite">
                <thead className="text-muted">
                  <tr>
                    <th className="text-left font-normal">light</th>
                    <th className="text-right font-normal">minutes lost</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((r) => (
                    <tr key={r.name} className={r.name === "you" ? "text-ink" : "text-muted"}>
                      <td>{r.name}</td>
                      <td className="text-right">{minutes(r.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <button onClick={start} className="cursor-pointer underline decoration-faint underline-offset-4 hover:decoration-green">
                  again
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <figcaption className="text-muted">
        Minutes lost: every car&apos;s time behind an open-road drive, added up over the {GAME_S / 60} minutes.
        Everyone plays the same seeded traffic, starting from the same queues. One short run, so the
        controllers&apos; order can shuffle; the hour-long averages are in the cliff above.
      </figcaption>
    </figure>
  );
}
