"use client";

import { useRef, useState } from "react";
import { n, results } from "@/app/sliding-doors/numbers";
import Choice from "@/components/shared/Choice";
import LineChart from "@/components/shared/LineChart";
import { useWidth } from "@/components/shared/hooks";
import Try from "@/components/shared/Try";

const BALLS = ["soft", "hard"] as const;
type Ball = (typeof BALLS)[number];
const NAMES: Record<Ball, string> = { soft: "a soft ball at your feet", hard: "a hard ball at you" };

/** Your team's chance of winning the rally from each depth, with them already at the kitchen line. */
export default function NoMansLand() {
  const [ball, setBall] = useState<Ball>("soft");
  const { ds, soft, hard } = results.depth;
  const box = useRef<HTMLElement>(null);
  // On a phone there's only room for the two ends of the axis.
  const narrow = useWidth(box) < 520;
  return (
    <figure ref={box} className="my-2 grid gap-y-1">
      <Try look="your chance of winning the rally if you and your partner are standing this far from the net, they’re both at the kitchen line, and it’s your shot.">
        switch between the two balls. Where does standing further forward stop helping?
      </Try>
      <Choice label="the ball you get" options={BALLS} value={ball} onChange={setBall} names={NAMES} />
      <LineChart
        xs={ds}
        series={[
          { key: "soft", label: "soft ball", values: soft },
          { key: "hard", label: "hard ball", values: hard },
        ]}
        focus={ball}
        xTicks={narrow ? [7.5, 22] : [7.5, 12, 17, 22]}
        xFormat={(d) => (d === 7.5 ? "kitchen line" : d === 22 ? "baseline" : `${d} ft`)}
        yFormat={(y) => `${Math.round(y * 100)}%`}
        yMin={0}
        yMax={0.6}
        reference={{ y: 0.5, label: "even" }}
        yLabel="your chance to win the rally"
        label="Win chance by distance from the net, for a soft ball at your feet and a hard ball at you."
      />
      <p className="text-center text-muted">feet from the net →</p>
      <figcaption className="text-muted">
        Each point is {n(results.replays.depth)} replays from that spot. Both of you stand at the same depth and want to come in; they stand at the
        kitchen line. Everything after the first shot is the same sensible 4.0 play as everywhere else.
      </figcaption>
    </figure>
  );
}
