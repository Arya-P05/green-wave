"use client";

import { useState } from "react";
import { average, render } from "@/lib/iphone-photos/meter";
import type { Region } from "@/lib/iphone-photos/meter";
import Choice from "@/components/shared/Choice";
import Try from "@/components/shared/Try";

/** A backlit portrait: how bright each part really is, in stops, and roughly how much of the frame it covers. */
const REGIONS: Region[] = [
  { key: "sky", name: "the sky", stops: 3, area: 0.42 },
  { key: "sun", name: "the sun", stops: 7, area: 0.01 },
  { key: "water", name: "the water", stops: 1.5, area: 0.16 },
  { key: "bridge", name: "the bridge", stops: -1, area: 0.05 },
  { key: "hair", name: "her hair", stops: -3.5, area: 0.08 },
  { key: "face", name: "her face", stops: -1.5, area: 0.06 },
  { key: "coat", name: "her jacket", stops: -2.5, area: 0.22 },
];
const BY = Object.fromEntries(REGIONS.map((r) => [r.key, r])) as Record<string, Region>;
const AUTO = average(REGIONS);

/** The same taps as buttons, for keyboards: where each lands in the drawing. */
const SPOTS = ["auto", "face", "sky", "coat", "water"] as const;
type Spot = (typeof SPOTS)[number];
const SPOT_NAMES: Record<Spot, string> = { auto: "let it guess", face: "her face", sky: "the sky", coat: "her jacket", water: "the water" };
const AT: Record<Exclude<Spot, "auto">, [number, number]> = { face: [200, 165], sky: [320, 50], coat: [150, 270], water: [350, 240] };

/**
 * Tap to set exposure: tap any part of a backlit scene and the camera makes
 * that part middle grey; drag the sun slider to nudge it. Anything brighter
 * than the sensor can hold turns white (red stripes), anything darker black.
 */
export default function Exposure() {
  const [tap, setTap] = useState<{ key: string; x: number; y: number } | null>(null);
  const [nudge, setNudge] = useState(0);
  const metered = tap ? BY[tap.key].stops : AUTO;
  const exposure = metered - nudge;

  const look = (key: string) => {
    const { v, clipped } = render(BY[key].stops, exposure);
    const g = Math.round(20 + v * 232);
    return { fill: `rgb(${g}, ${Math.round(g * 0.985)}, ${Math.round(g * 0.95)})`, clipped };
  };
  const zebra = (key: string) => {
    const { clipped } = look(key);
    return clipped === "white" ? "url(#zebra-white)" : clipped === "black" ? "url(#zebra-black)" : "none";
  };
  const region = (key: string) => ({
    onClick: (e: React.MouseEvent<SVGElement>) => {
      const svg = e.currentTarget.ownerSVGElement!;
      const r = svg.getBoundingClientRect();
      setTap({ key, x: ((e.clientX - r.left) / r.width) * 400, y: ((e.clientY - r.top) / r.height) * 300 });
      e.stopPropagation();
    },
    className: "cursor-pointer",
  });
  const clippedNames = REGIONS.filter((r) => look(r.key).clipped === "white").map((r) => r.name);
  const lostNames = REGIONS.filter((r) => look(r.key).clipped === "black").map((r) => r.name);

  // Paint each region twice: once in its grey, once with stripes if it clipped.
  const paint = (key: string, shape: (fill: string) => React.ReactNode) => (
    <g {...region(key)}>
      {shape(look(key).fill)}
      {shape(zebra(key))}
    </g>
  );

  return (
    <figure className="my-2 grid gap-y-1">
      <Try look="a drawn version of a backlit photo: someone with the sun behind them. Red stripes mean that part is pure white in the photo, with no detail left; grey stripes mean pure black.">
        tap her face, then the sky. Then tap her face and drag the sun slider up and down.
      </Try>
      <Choice
        label="where you tapped"
        options={SPOTS}
        value={(tap?.key ?? "auto") as Spot}
        onChange={(s) => setTap(s === "auto" ? null : { key: s, x: AT[s][0], y: AT[s][1] })}
        names={SPOT_NAMES}
      />
      <svg viewBox="0 0 400 300" className="block w-full max-w-[640px] touch-manipulation select-none" role="group" aria-label="A backlit scene. Tap a part of it to set the exposure there.">
        <defs>
          <pattern id="zebra-white" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-red)" strokeWidth="1.5" strokeOpacity="0.8" />
          </pattern>
          <pattern id="zebra-black" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-muted)" strokeWidth="1.5" />
          </pattern>
          <clipPath id="exposure-clip">
            <rect width="400" height="300" />
          </clipPath>
        </defs>
        <g clipPath="url(#exposure-clip)">
          {paint("sky", (f) => <rect width="400" height="200" fill={f} />)}
          {paint("water", (f) => <rect y="180" width="400" height="120" fill={f} />)}
          {paint("bridge", (f) => (
            <g fill={f}>
              <rect x="52" y="60" width="10" height="135" />
              <rect x="78" y="60" width="10" height="135" />
              <rect x="52" y="80" width="36" height="6" />
              <rect x="52" y="120" width="36" height="6" />
              <rect x="0" y="168" width="400" height="7" />
              <path d="M0 150 Q30 120 57 62 Q130 150 230 168 L230 171 Q130 154 57 68 Q30 126 0 154 Z" />
              <path d="M83 62 Q200 160 400 150 L400 154 Q200 164 83 68 Z" />
            </g>
          ))}
          {paint("sun", (f) => <circle cx="236" cy="86" r="16" fill={f} />)}
          {paint("coat", (f) => <path d="M95 300 Q100 232 168 220 L232 220 Q300 232 305 300 Z" fill={f} />)}
          {paint("hair", (f) => <ellipse cx="200" cy="148" rx="50" ry="62" fill={f} />)}
          {paint("face", (f) => <ellipse cx="200" cy="160" rx="34" ry="44" fill={f} />)}
          {/* Neck, in the face's light. */}
          {paint("face", (f) => <rect x="186" y="198" width="28" height="24" fill={f} />)}
        </g>
        {tap && (
          <g transform={`translate(${tap.x}, ${tap.y})`} pointerEvents="none" stroke="var(--color-amber)" strokeWidth="1.5" fill="none">
            <path d="M-18 -10 V-18 H-10 M10 -18 H18 V-10 M18 10 V18 H10 M-10 18 H-18 V10" />
            <circle cx="26" cy={-nudge * 6} r="4" fill="var(--color-amber)" />
            <line x1="26" x2="26" y1="-18" y2="18" />
          </g>
        )}
      </svg>
      <label className="grid max-w-[56ch] grid-cols-[auto_1fr] items-center gap-x-[2ch]">
        <span>☀ drag {nudge > 0 ? "+" : ""}{nudge.toFixed(1)}</span>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.1}
          value={nudge}
          onChange={(e) => setNudge(Number(e.target.value))}
          aria-label="brighter or darker, in stops"
        />
      </label>
      <p>
        {tap ? (
          <>
            Exposed for <span className="text-ink">{BY[tap.key].name}</span>.{" "}
          </>
        ) : (
          <>Nothing tapped: this toy camera averages the whole frame, and the sky wins. </>
        )}
        {clippedNames.length > 0 && <>Gone to white: {clippedNames.join(", ")}. </>}
        {lostNames.length > 0 && <>Gone to black: {lostNames.join(", ")}.</>}
      </p>
      <figcaption className="max-w-[64ch] text-muted">
        A toy camera whose sensor holds 3 stops above middle grey and 5 below (each stop is double the light). Real iPhones are
        smarter than this one, since they look for faces, but a bright sky behind a face is still where tapping helps most.
      </figcaption>
    </figure>
  );
}
