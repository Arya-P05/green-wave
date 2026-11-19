"use client";

import { useEffect, useRef, useState } from "react";
import { byHand, GAME_DEMAND, rivalScore, RIVALS, ROUND_S, ROUNDS, roundStart } from "@/lib/green-wave/game";
import { LABELS } from "@/lib/green-wave/sim/scenario";
import { useWidth } from "@/components/shared/hooks";
import Try from "@/components/shared/Try";
import { intersection } from "./draw";

const SPEED = 6; // simulated seconds per real second

type Scores = { you: number; rivals: Record<string, number> };
type Stage =
  | { at: "ready" }
  | { at: "playing"; round: number; left: number; switches: number }
  | { at: "between"; round: number }
  | { at: "done" };

const minutes = (carSeconds: number) => (carSeconds / 60).toFixed(1);
const total = (rounds: Scores[], who: string) =>
  rounds.reduce((a, r) => a + (who === "you" ? r.you : r.rivals[who]), 0);

/**
 * You are the light. Tap to give the other street green; the sim makes you
 * pay the same amber and all-red as every controller. Three rounds, each with
 * new traffic, scored against the controllers on exactly the same traffic.
 */
export default function BeTheLight() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = useWidth(box);
  const [stage, setStage] = useState<Stage>({ at: "ready" });
  const [seed, setSeed] = useState<number | null>(null); // this round's traffic; null until you start
  const [scores, setScores] = useState<Scores[]>([]);
  const you = useRef<ReturnType<typeof byHand> | null>(null);

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
    const { sim, index, end } = roundStart(c, seed ?? 1);
    c.want = sim.nodes[0].phase;
    you.current = c;
    const { positions, draw } = intersection(canvas.current, size, sim, index);
    let prev = positions();
    let next = prev;
    draw(next, next, 1);
    if (seed === null) return;

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
      if (sim.t < end) {
        frame = requestAnimationFrame(loop);
        return;
      }
      const rivals = Object.fromEntries(RIVALS.map((k) => [k, rivalScore(k, seed)]));
      setScores((r) => [...r, { you: sim.delay, rivals }]);
      setStage((s) => {
        const round = s.at === "playing" ? s.round : 0;
        return round + 1 < ROUNDS ? { at: "between", round } : { at: "done" };
      });
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [width, seed]);

  const play = (round: number) => {
    // New traffic every game: a random first seed, then the next ones.
    const first = round === 0 ? Math.floor(Math.random() * 1e6) + 1 : seed! + 1;
    if (round === 0) setScores([]);
    setSeed(first);
    setStage({ at: "playing", round, left: ROUND_S, switches: 0 });
  };

  const board = [{ key: "you", name: "you" }, ...RIVALS.map((k) => ({ key: k, name: LABELS[k] }))]
    .map((r) => ({ ...r, score: total(scores, r.key) }))
    .sort((a, b) => a.score - b.score);
  const last = scores[scores.length - 1];
  const button = "cursor-pointer underline decoration-faint underline-offset-4 hover:decoration-green";

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="the same junction from above, but now you’re its brain.">
        tap the junction (or press switch) to give the other street green. Three rounds, new traffic each
        time; lowest total wins.
      </Try>
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
                The junction is busy (demand {GAME_DEMAND}, close to the cliff). Every switch costs you 4
                seconds of amber and all-red, the same as the algorithms.
              </p>
              <p>
                <button onClick={() => play(0)} className={button}>
                  start ({ROUNDS} rounds of {ROUND_S / 60} minutes, about {Math.round(ROUND_S / SPEED)}s each)
                </button>
              </p>
            </>
          )}
          {stage.at === "playing" && (
            <>
              <p className="tabular-nums" aria-live="off">
                round {stage.round + 1} of {ROUNDS} · {stage.left}s left · {stage.switches}{" "}
                {stage.switches === 1 ? "switch" : "switches"}
              </p>
              <p>
                <button onClick={flip} className={button}>
                  switch
                </button>
              </p>
            </>
          )}
          {stage.at === "between" && last && (
            <>
              <p className="tabular-nums" aria-live="polite">
                Round {stage.round + 1}: you lost {minutes(last.you)} minutes; the sensor light lost{" "}
                {minutes(last.rivals.actuated)} on the same traffic.
              </p>
              <p>
                <button onClick={() => play(stage.round + 1)} className={button}>
                  next round ({stage.round + 2} of {ROUNDS})
                </button>
              </p>
            </>
          )}
          {stage.at === "done" && (
            <>
              <table className="w-full max-w-[40ch] tabular-nums" aria-live="polite">
                <thead className="text-muted">
                  <tr>
                    <th className="text-left font-normal">light</th>
                    <th className="text-right font-normal">minutes lost, {ROUNDS} rounds</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((r) => (
                    <tr key={r.key} className={r.key === "you" ? "text-ink" : "text-muted"}>
                      <td>{r.name}</td>
                      <td className="text-right">{minutes(r.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <button onClick={() => play(0)} className={button}>
                  play again (new traffic)
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <figcaption className="text-muted">
        Minutes lost: all the time every car spent going slower than it would on an empty road, added up.
        Each round the algorithms replay exactly the traffic you got. You have one advantage they don’t: you
        can see cars coming from far away.
      </figcaption>
    </figure>
  );
}
