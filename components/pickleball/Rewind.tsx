"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { n, results } from "@/app/sliding-doors/numbers";
import type { PickedRally } from "@/app/sliding-doors/numbers";
import { sensible } from "@/lib/pickleball/policy";
import { choices, label, play, start } from "@/lib/pickleball/rally";
import type { Action, Kind, Move, Point, State } from "@/lib/pickleball/rally";
import { COURT_L, COURT_W } from "@/lib/pickleball/court";
import { rng } from "@/lib/shared/random";
import Choice from "@/components/shared/Choice";
import { sizeCanvas, token, useReducedMotion, useVisible, useWidth } from "@/components/shared/hooks";
import Try from "@/components/shared/Try";
import { drawBall, drawCourt, drawPlayer, view } from "./court";
import type { Palette } from "./court";
import type { GhostReply, GhostRequest } from "./ghosts.worker";
import { ballAt, clips as makeClips, locate, playersAt } from "./play";

const RALLIES = results.rallies as PickedRally[];
/** Sim seconds per real second. Slow is half that. */
const PACE = { normal: 0.6, slow: 0.3 };
type Pace = keyof typeof PACE;
const FAN_MS = 1500;

const key = (rally: number, shot: number, a: Action) => `${rally}:${shot}:${a.kind}:${a.move}`;
const same = (a: Action | null, b: Action | null) => !!a && !!b && a.kind === b.kind && a.move === b.move;
const mine = (hitter: number) => hitter < 2;
const MOVE_NAMES: Record<Move, string> = { in: "move in", hold: "stay back" };
const did = (s: State, a: Action) =>
  `${label(a.kind, s)}${a.kind === "serve" || mine(s.hitter) === false ? "" : a.move === "in" ? (s.shot === 2 ? ", then came in" : ", then moved in") : ", then stayed back"}`;

/**
 * Rewind: one rally, played out on a court. Pause on any of your shots, pick
 * something else, and the moment is replayed 600 times from there: 200 of
 * those replays fan out on the court, and the odds update.
 */
/** Long outs land past the edge of the drawing; pin them just inside it. */
const EDGE = 2.5;
const inside = (p: Point): Point => ({
  x: Math.max(-EDGE, Math.min(COURT_W + EDGE, p.x)),
  y: Math.max(-EDGE, Math.min(COURT_L + EDGE, p.y)),
});

export default function Rewind() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const meterBar = useRef<HTMLDivElement>(null);
  const meterText = useRef<HTMLSpanElement>(null);
  const marker = useRef<SVGLineElement>(null);
  const width = useWidth(box);
  const visible = useVisible(box);
  const still = useReducedMotion();

  const [which, setWhich] = useState(0);
  const pick = RALLIES[which];
  const rally = useMemo(() => play(start(pick.server), rng(pick.seed), sensible, { record: true }), [pick]);
  const { clips, total } = useMemo(() => makeClips(rally.events), [rally]);

  const [mode, setMode] = useState<"watch" | "find">("watch");
  const [playing, setPlaying] = useState(false);
  const [pace, setPace] = useState<Pace>("normal");
  // The shot you've stopped on (0-based), or null while it plays.
  const [at, setAt] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [ended, setEnded] = useState(false);
  const [choice, setChoice] = useState<Action | null>(null);
  const [replies, setReplies] = useState<Record<string, GhostReply>>({});
  const [guess, setGuess] = useState<number | null>(null);

  const clock = useRef(0);
  const fanFrom = useRef(0);
  const live = useRef({ playing, pace, at, choice, replies, which });
  useEffect(() => {
    live.current = { playing, pace, at, choice, replies, which };
  }, [playing, pace, at, choice, replies, which]);

  // The worker that replays a moment. One per figure, kept for its lifetime.
  const worker = useRef<Worker | null>(null);
  const asked = useRef(new Set<string>());
  useEffect(() => {
    const w = new Worker(new URL("./ghosts.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (e: MessageEvent<GhostReply>) => {
      fanFrom.current = performance.now();
      setReplies((r) => ({ ...r, [e.data.key]: e.data }));
    };
    return () => w.terminate();
  }, []);
  const ask = (shot: number, action: Action) => {
    const k = key(which, shot, action);
    if (asked.current.has(k) || !worker.current) return;
    asked.current.add(k);
    const req: GhostRequest = { seed: pick.seed, server: pick.server, shot: shot + 1, action, key: k };
    worker.current.postMessage(req);
  };

  // Start the first rally once the figure scrolls into view (once).
  const started = useRef(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      // With reduced motion nothing plays by itself: tap a shot to step to it.
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(true);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function stopAt(i: number) {
    clock.current = clips[i].start;
    setPlaying(false);
    setAt(i);
    setShown(i);
    setEnded(false);
    const s = rally.states[i];
    if (mine(s.hitter) && s.shot > 1) {
      const actual = rally.events[i].action;
      setChoice(actual);
      ask(i, actual);
    } else setChoice(null);
  }

  function reset(next = which, autoplay = !still) {
    clock.current = 0;
    setAt(null);
    setShown(0);
    setEnded(false);
    setChoice(null);
    setGuess(null);
    setWhich(next);
    setPlaying(autoplay);
  }

  function choose(a: Action, shot = at) {
    if (shot === null) return;
    setChoice(a);
    ask(shot, a);
  }

  // Drawing. With motion: one loop while on screen. Without: redraw on every change.
  useEffect(() => {
    const el = canvas.current;
    if (!el || !width) return;
    const v = view(width);
    const ctx = sizeCanvas(el, v.width, v.height);
    const c: Palette = {
      ink: token("ink"),
      muted: token("muted"),
      faint: token("faint"),
      canvas: token("canvas"),
      red: token("red"),
      amber: token("amber"),
      green: token("green"),
    };
    const meter = pick.meter;

    const draw = (now: number) => {
      const { at: stop, choice: ch, replies: rs } = live.current;
      const t = clock.current;
      const done = t >= clips[clips.length - 1].start + clips[clips.length - 1].dur;
      const { i, u } = locate(clips, t);
      const clip = clips[i];
      ctx.clearRect(0, 0, v.width, v.height);
      drawCourt(ctx, v, c);

      // The fan of replays from the moment you stopped on.
      const reply = stop !== null && ch ? rs[key(live.current.which, stop, ch)] : undefined;
      if (reply) {
        const p = still ? 1 : Math.min(1, (now - fanFrom.current) / FAN_MS);
        ctx.lineWidth = 1;
        ctx.strokeStyle = c.ink;
        ctx.globalAlpha = 0.07;
        for (const g of reply.ghosts) {
          const pts = g.path.map(inside).map(v.at);
          const len = (pts.length - 1) * p;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let j = 1; j <= Math.ceil(len) && j < pts.length; j++) {
            const f = Math.min(1, len - (j - 1));
            ctx.lineTo(pts[j - 1].x + (pts[j].x - pts[j - 1].x) * f, pts[j - 1].y + (pts[j].y - pts[j - 1].y) * f);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = Math.max(0, (p - 0.7) / 0.3) * 0.65;
        for (const g of reply.ghosts) {
          const end = v.at(inside(g.path[g.path.length - 1]));
          ctx.fillStyle = g.won ? c.green : c.red;
          ctx.beginPath();
          ctx.arc(end.x, end.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      const players = done ? clip.ev.after : playersAt(clip, u);
      players.forEach((pl, j) => drawPlayer(ctx, v, c, pl, mine(j), stop !== null && j === clip.ev.hitter && !done));
      const ball = done ? { p: clip.ev.to, h: clip.ev.fault === "net" ? 1 : 0 } : ballAt(clip, u);
      drawBall(ctx, v, c, ball.p, ball.h);

      // The meter: your chance to win the point, gliding from shot to shot.
      const m = done ? meter[meter.length - 1] : meter[i] + (meter[i + 1] - meter[i]) * u;
      if (meterBar.current) meterBar.current.style.width = `${m * 100}%`;
      if (meterText.current) meterText.current.textContent = `${Math.round(m * 100)}%`;
      if (marker.current) {
        const x = (i + (done ? 1 : u)) / clips.length;
        marker.current.setAttribute("x1", `${x * 100}`);
        marker.current.setAttribute("x2", `${x * 100}`);
      }
      return { i, done };
    };

    if (still) {
      draw(Infinity);
      return;
    }
    if (!visible) {
      draw(Infinity);
      return;
    }
    let last = -1;
    let frame = 0;
    let seen = -1;
    const loop = (now: number) => {
      const dt = last < 0 ? 0 : Math.min(now - last, 100) / 1000;
      last = now;
      const { playing: on, pace: pc } = live.current;
      if (on) clock.current = Math.min(total, clock.current + dt * PACE[pc]);
      const { i, done } = draw(now);
      if (i !== seen) {
        seen = i;
        setShown(i);
      }
      if (on && clock.current >= total) {
        setPlaying(false);
        setEnded(true);
      } else if (on && done) setEnded(true);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [width, visible, still, clips, total, pick, at, choice, replies, which]);

  const v = width ? view(width) : null;
  const s = rally.states[at ?? shown];
  const ev = rally.events[at ?? shown];
  const actual = at !== null ? rally.events[at].action : null;
  const replyMine = at !== null && actual ? replies[key(which, at, actual)] : undefined;
  const replyChoice = at !== null && choice ? replies[key(which, at, choice)] : undefined;
  const options = at !== null && mine(s.hitter) && s.shot > 1 ? choices(s) : [];
  const kinds = [...new Set(options.map((o) => o.kind))];
  const moves = [...new Set(options.map((o) => o.move))];
  const kindNames = Object.fromEntries(kinds.map((k) => [k, label(k, s)])) as Record<Kind, string>;
  const decisions = pick.decisions;
  const worst = decisions.reduce((a, b) => (b.cost > a.cost ? b : a));
  const columns = clips.length;

  let line: React.ReactNode;
  if (ended && at === null) line = <>Point to them: {ev.fault === "net" ? "into the net" : "out"} on shot {ev.n}.</>;
  else line = (
    <>
      shot {ev.n} · {mine(ev.hitter) ? "you" : "them"} · {did(s, ev.action)}
      {ev.fault ? (ev.fault === "net" ? " · into the net" : " · out") : ""}
    </>
  );

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="one rally of doubles, from above. You two are the solid dots; they’re the open ones. The amber dot is the ball, with its shadow on the ground. Under the court is your chance of winning the point, shot by shot.">
        {still ? "tap" : "let it play, then tap"} one of your shots (the solid dots on the line under the court) to stop there. Pick a different
        shot, or stay back instead of moving in, and watch 200 replays of that moment fan out. Green ends are points you
        won; red ones you lost.
      </Try>

      <div className="flex flex-wrap items-center gap-x-[2ch] gap-y-[6px]">
        <Choice
          label="mode"
          options={["watch", "find"] as const}
          value={mode}
          onChange={(m) => {
            setMode(m);
            reset(which);
          }}
          names={{ watch: "rewind", find: "find the moment" }}
        />
        <span className="hidden text-muted sm:inline">·</span>
        <button onClick={() => reset((which + 1) % RALLIES.length)} className="underline decoration-faint hover:decoration-ink">
          rally {which + 1} of {RALLIES.length} →
        </button>
      </div>

      <div ref={box} className="w-full max-w-[760px]">
        <canvas
          ref={canvas}
          role="img"
          aria-label={`A doubles court from above, playing rally ${which + 1}. ${v?.upright ? "You are at the bottom." : "You are on the left."}`}
        />
      </div>

      <div className="grid max-w-[760px] gap-y-[6px]">
        <p className="tabular-nums" aria-live="polite">
          {line}
        </p>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_5ch] items-center gap-x-[1ch]">
          <span className="text-muted">your chance</span>
          <div className="relative h-[6px] bg-faint">
            <div ref={meterBar} className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${pick.meter[0] * 100}%` }} />
            <div className="absolute inset-y-[-3px] left-1/2 w-px bg-canvas" aria-hidden />
          </div>
          <span ref={meterText} className="text-right tabular-nums">
            {Math.round(pick.meter[0] * 100)}%
          </span>
        </div>

        {/* The rally as a line: win chance before each shot, one column per shot. */}
        <div className="grid gap-y-[2px]">
          <svg className="h-[56px] w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1="0" x2="100" y1="50" y2="50" stroke="var(--color-faint)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            <polyline
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              points={pick.meter.map((m, i) => `${(i / columns) * 100},${(1 - m) * 100}`).join(" ")}
            />
            <line ref={marker} x1="0" x2="0" y1="0" y2="100" stroke="var(--color-ink)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {rally.events.map((e, i) => {
              const you = mine(e.hitter) && e.n > 1;
              const selected = at === i;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (mode === "find" && you && guess === null) {
                      setGuess(i);
                      setPlaying(false);
                    }
                    else stopAt(i);
                  }}
                  aria-label={`shot ${e.n}, ${mine(e.hitter) ? "yours" : "theirs"}: ${label(e.action.kind, rally.states[i])}`}
                  aria-pressed={selected}
                  className={`flex flex-col items-start tabular-nums ${you ? "text-ink" : "text-muted"} ${selected ? "underline underline-offset-4" : ""}`}
                >
                  <span aria-hidden>{mine(e.hitter) ? "●" : "○"}</span>
                  <span>{e.n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!still && (
          <div className="flex flex-wrap gap-x-[2ch]">
            <button
              onClick={() => {
                if (playing) setPlaying(false);
                else {
                  if (clock.current >= total - 0.01) clock.current = 0;
                  setAt(null);
                  setEnded(false);
                  setPlaying(true);
                }
              }}
              className="underline decoration-faint hover:decoration-ink"
            >
              {playing ? "pause" : at !== null ? "play on from here" : "play"}
            </button>
            <button
              onClick={() => setPace(pace === "slow" ? "normal" : "slow")}
              className="underline decoration-faint hover:decoration-ink"
              aria-label={`speed: ${pace}, tap to change`}
            >
              {pace} speed
            </button>
            <button onClick={() => reset(which)} className="underline decoration-faint hover:decoration-ink">
              from the start
            </button>
          </div>
        )}

        {mode === "watch" && at !== null && options.length > 0 && choice && (
          <div className="grid gap-y-[6px] border-l border-faint pl-1">
            <p>
              Shot {s.shot}: you hit a {did(s, actual!)}. What if you’d…
            </p>
            <Choice label="shot" options={kinds} value={choice.kind} onChange={(k) => choose({ kind: k, move: moves.includes(choice.move) ? choice.move : moves[0] })} names={kindNames} />
            {moves.length > 1 && (
              <Choice label="then" options={moves} value={choice.move} onChange={(m) => choose({ kind: choice.kind, move: m })} names={MOVE_NAMES} />
            )}
            <p className="tabular-nums text-muted">
              {replyMine ? (
                <>
                  Replaying this moment {n(results.replays.decision)} times: what you did wins{" "}
                  <span className="text-ink">{Math.round(replyMine.win * 100)}%</span>
                  {!same(choice, actual) &&
                    (replyChoice ? (
                      <>
                        ; {did(s, choice)} wins <span className="text-ink">{Math.round(replyChoice.win * 100)}%</span> (
                        {replyChoice.win >= replyMine.win ? "+" : "−"}
                        {Math.abs(Math.round((replyChoice.win - replyMine.win) * 100))})
                      </>
                    ) : (
                      "; replaying the other choice…"
                    ))}
                  .
                </>
              ) : (
                "replaying this moment…"
              )}
            </p>
          </div>
        )}

        {mode === "watch" && at !== null && options.length === 0 && (
          <p className="text-muted">
            {s.shot === 1 ? "The serve: nothing to choose in this model." : "That one’s theirs."} Tap a solid dot to stop on one of
            your shots.
          </p>
        )}

        {mode === "find" && guess === null && (
          <p className="text-muted">
            You lose this point. Somewhere in it, one of your decisions gave away more of your chance than any other. Watch it,
            then tap the solid dot where you think it slipped.
          </p>
        )}
        {mode === "find" && guess !== null && (
          <div className="grid gap-y-[6px] border-l border-faint pl-1">
            <p>
              {rally.events[guess].n === worst.shot
                ? `You found it: shot ${worst.shot}.`
                : `You picked shot ${rally.events[guess].n}. The biggest was shot ${worst.shot}.`}
            </p>
            <ol className="tabular-nums text-muted">
              {decisions.map((d) => (
                <li key={d.shot} className={d.shot === worst.shot ? "text-ink" : undefined}>
                  shot {d.shot} · {did(rally.states[d.shot - 1], rally.events[d.shot - 1].action)} ·{" "}
                  {Math.round(d.cost * 100) === 0
                    ? "about as good as anything"
                    : `gave away ${Math.round(d.cost * 100)} points (${did(rally.states[d.shot - 1], d.best)} was better)`}
                </li>
              ))}
            </ol>
            <button
              onClick={() => {
                setMode("watch");
                stopAt(worst.shot - 1);
                choose(worst.best, worst.shot - 1);
              }}
              className="justify-self-start underline decoration-faint hover:decoration-ink"
            >
              rewind to shot {worst.shot} and try {did(rally.states[worst.shot - 1], worst.best)}
            </button>
          </div>
        )}
      </div>

      <figcaption className="max-w-[760px] text-muted">
        A rally from the simulation, played by two teams of the same sensible 4.0 players. The line under the court is your
        chance to win the point before each shot, worked out by replaying that moment {n(results.replays.meter)} times. Each “what if” is replayed{" "}
        {n(results.replays.decision)} times with the same {n(results.replays.decision)} strokes of luck, so the only thing that changes is your choice. 200 of them are drawn: three
        shots of each, then a dot where it ended.
      </figcaption>
    </figure>
  );
}
