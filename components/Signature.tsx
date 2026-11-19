"use client";

import { useEffect, useRef, useState } from "react";

// Arya's signature, copied from arya-site: traced from the old site's Lottie into
// plain SVG strokes. Timings are the original's, at double speed.
const STROKES = [
  { d: "M137.58 58.26C99.36 62.01 39.16 87.63 16.69 109.66C36.02 104.51 97.2 46.68 116.28 33.96C99.98 49.08 76.9 76.6 73.98 89.76C82.28 89.76 97.78 75.26 107.28 72.56C102.06 76.14 101.95 80.31 102.98 82.46C105.46 82.52 108.86 79.98 112.88 76.46C114.39 86.6 123.08 81.08 128.98 72.86C122.68 85.66 115.06 96.56 106.98 98.06C108.68 89.76 141.61 75.44 146.16 71.81C145.66 71.67 139.6 73.9 134.27 78.96C132.19 83.61 137.58 82.46 137.58 82.46C137.58 82.46 144.12 80.85 146.16 76.46C145.06 81.94 146.96 82.65 149 83.57", width: 3.4, start: 500, duration: 800 },
  { d: "M228.85 22.76C228.85 22.76 193.35 109.46 193.35 109.46", width: 3.4, start: 1350, duration: 50 },
  { d: "M205.45 43.86C223.71 36.87 263.05 32.38 284.05 34.46C279.19 39.21 208.25 68.96 180.95 78.96", width: 3.4, start: 1500, duration: 200 },
  { d: "M163.5 96.32C163.5 96.32 162.33 97 162.33 97", width: 4, start: 1800, duration: 50 },
];

export default function Signature() {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setDrawn(true);
      observer.disconnect();
    });
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      role="img"
      aria-label="Arya P."
      viewBox="10 15 285 105"
      className="signature w-[160px] shrink-0"
      data-drawn={drawn}
    >
      {STROKES.map(({ d, width, start, duration }) => (
        <path
          key={start}
          d={d}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animationDelay: `${start - STROKES[0].start}ms`, animationDuration: `${duration}ms` }}
        />
      ))}
    </svg>
  );
}
