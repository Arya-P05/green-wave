"use client";

import data from "@/data/spadina.json";
import { hours } from "@/lib/spadina";
import type { SpadinaData } from "@/lib/spadina";
import LineChart from "./LineChart";

const spadina = data as SpadinaData;
const day = hours(spadina);
const xs = day.map((h) => Number(h.start.slice(0, 2)));
const perHour = (v: number) => v * 3600;

/** What the City counted: cars per hour per lane on Spadina, and on the busiest side street. */
export default function Demand() {
  const side = (h: (typeof day)[number]) => Math.max(...h.cross.map((c) => Math.max(c.eastbound, c.westbound)));
  return (
    <figure className="my-2 grid gap-y-1">
      <LineChart
        xs={xs}
        xTicks={[6, 9, 12, 15, 19]}
        xFormat={(h) => `${h}:00`}
        yFormat={(v) => `${Math.round(v)}`}
        series={[
          { key: "nb", label: "northbound", values: day.map((h) => perHour(h.northbound)) },
          { key: "sb", label: "southbound", values: day.map((h) => perHour(h.southbound)) },
          { key: "side", label: "busiest side", values: day.map((h) => perHour(side(h))) },
        ]}
        focus="nb"
        label="Cars per hour per lane on Spadina through the day"
      />
      <figcaption className="text-muted">
        Cars per hour per lane, {spadina.source.date}, from the City of Toronto&apos;s counts at{" "}
        {spadina.lights.length} Spadina intersections. {spadina.source.attribution}
      </figcaption>
    </figure>
  );
}
