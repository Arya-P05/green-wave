import { COURT_L, COURT_W, KITCHEN, NET_Y } from "@/lib/pickleball/court";
import type { Point } from "@/lib/pickleball/rally";

/**
 * The court on a canvas. Wide screens get it sideways (your side on the
 * left); narrow ones get it upright (your side at the bottom), so the
 * players never shrink to specks.
 */
export type View = {
  width: number;
  height: number;
  scale: number;
  upright: boolean;
  /** Court feet to canvas pixels. */
  at: (p: Point) => { x: number; y: number };
  /** Which way "up in the air" is on screen. */
  lift: (feet: number) => { x: number; y: number };
};

const MARGIN = 3;

export function view(width: number, maxHeight = 560): View {
  const upright = width < 520;
  if (upright) {
    const scale = Math.min(width / (COURT_W + 2 * MARGIN), maxHeight / (COURT_L + 2 * MARGIN));
    const w = (COURT_W + 2 * MARGIN) * scale;
    const ox = (width - w) / 2;
    return {
      width,
      height: Math.round((COURT_L + 2 * MARGIN) * scale),
      scale,
      upright,
      at: (p) => ({ x: ox + (p.x + MARGIN) * scale, y: (COURT_L - p.y + MARGIN) * scale }),
      lift: (f) => ({ x: 0, y: -f * scale * 0.45 }),
    };
  }
  const scale = width / (COURT_L + 2 * MARGIN);
  return {
    width,
    height: Math.round((COURT_W + 2 * MARGIN) * scale),
    scale,
    upright,
    at: (p) => ({ x: (p.y + MARGIN) * scale, y: (COURT_W - p.x + MARGIN) * scale }),
    lift: (f) => ({ x: 0, y: -f * scale * 0.45 }),
  };
}

export type Palette = { ink: string; muted: string; faint: string; canvas: string; red: string; amber: string; green: string };

/** Lines only, in the page's faint grey, with the net in ink. */
export function drawCourt(ctx: CanvasRenderingContext2D, v: View, c: Palette) {
  const line = (a: Point, b: Point) => {
    const p = v.at(a);
    const q = v.at(b);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  };
  // The kitchen, very lightly shaded so it reads as a place.
  ctx.fillStyle = c.faint;
  ctx.globalAlpha = 0.28;
  const k0 = v.at({ x: 0, y: NET_Y - KITCHEN });
  const k1 = v.at({ x: COURT_W, y: NET_Y + KITCHEN });
  ctx.fillRect(Math.min(k0.x, k1.x), Math.min(k0.y, k1.y), Math.abs(k1.x - k0.x), Math.abs(k1.y - k0.y));
  ctx.globalAlpha = 1;

  ctx.strokeStyle = c.faint;
  ctx.lineWidth = 1.5;
  const o = v.at({ x: 0, y: 0 });
  const e = v.at({ x: COURT_W, y: COURT_L });
  ctx.strokeRect(Math.min(o.x, e.x), Math.min(o.y, e.y), Math.abs(e.x - o.x), Math.abs(e.y - o.y));
  ctx.lineWidth = 1;
  line({ x: 0, y: NET_Y - KITCHEN }, { x: COURT_W, y: NET_Y - KITCHEN });
  line({ x: 0, y: NET_Y + KITCHEN }, { x: COURT_W, y: NET_Y + KITCHEN });
  line({ x: COURT_W / 2, y: 0 }, { x: COURT_W / 2, y: NET_Y - KITCHEN });
  line({ x: COURT_W / 2, y: NET_Y + KITCHEN }, { x: COURT_W / 2, y: COURT_L });
  // The net runs a little past the sidelines.
  ctx.strokeStyle = c.muted;
  ctx.lineWidth = 2;
  line({ x: -0.8, y: NET_Y }, { x: COURT_W + 0.8, y: NET_Y });
}

/** A player: you two are solid ink; they're open circles. */
export function drawPlayer(ctx: CanvasRenderingContext2D, v: View, c: Palette, p: Point, mine: boolean, ring = false) {
  const s = v.at(p);
  const r = Math.max(5, v.scale * 0.55);
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  if (mine) {
    ctx.fillStyle = c.ink;
    ctx.fill();
  } else {
    ctx.fillStyle = c.canvas;
    ctx.fill();
    ctx.strokeStyle = c.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (ring) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = c.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** The ball: an amber dot above a soft shadow on the ground, so you can see how high it is. */
export function drawBall(ctx: CanvasRenderingContext2D, v: View, c: Palette, p: Point, height: number) {
  const g = v.at(p);
  const r = Math.max(3, v.scale * 0.28);
  ctx.fillStyle = c.ink;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const l = v.lift(height);
  ctx.fillStyle = c.amber;
  ctx.beginPath();
  ctx.arc(g.x + l.x, g.y + l.y, r, 0, Math.PI * 2);
  ctx.fill();
}
