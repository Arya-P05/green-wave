import type { CSSProperties } from "react";
import BeTheLight from "@/components/cliff/BeTheLight";
import Cliff from "@/components/cliff/Cliff";
import Demand from "@/components/Demand";
import Nerds from "@/components/Nerds";
import PhantomJam from "@/components/PhantomJam";
import { DayResults, MinGreenTable, SideResults } from "@/components/results/Results";
import Signature from "@/components/Signature";
import Toc from "@/components/Toc";
import type { Entry } from "@/components/Toc";
import TimeSpace from "@/components/wave/TimeSpace";
import Tuner from "@/components/wave/Tuner";
import { LABELS } from "@/lib/sim/scenario";
import type { Kind } from "@/lib/sim/scenario";
import { cliffDelay, delay, f1, hourCount, hoursBetter, platoon, platoonRange, s0, side, stops } from "./numbers";

/** Where "Arya Patel" in the header points. TODO(arya): her site's URL once this lives there. */
const SITE = "https://github.com/Arya-P05";
const CODE = "https://github.com/Arya-P05/green-wave";

const SECTIONS: Entry[] = [
  { id: "question", title: "the question" },
  { id: "light", title: "how a light works" },
  { id: "road", title: "the road" },
  { id: "webster", title: "webster’s recipe" },
  { id: "cliff", title: "the cliff" },
  { id: "waves", title: "green waves" },
  { id: "spadina", title: "spadina" },
  { id: "surprise", title: "the surprise" },
  { id: "why", title: "why" },
  { id: "fix", title: "the fix" },
  { id: "numbers", title: "the numbers" },
  { id: "meaning", title: "what it means" },
  { id: "next", title: "next" },
  { id: "notes", title: "notes" },
];

const META: [string, React.ReactNode][] = [
  ["when", "November 2026"],
  ["tools", "TypeScript, Next.js, a cellular automaton, no libraries"],
  ["data", "City of Toronto traffic counts, Spadina Ave, 23 Apr 2025; lanes from OpenStreetMap"],
  ["code", <a key="code" href={CODE}>github.com/Arya-P05/green-wave</a>],
];

/** The headline: stops on a drive up Spadina, day average, fewest last. */
const LEDGER: [Kind, string][] = [
  ["max-pressure", "max-pressure, the textbook rule"],
  ["fixed", "a plain timer"],
  ["max-pressure-plus", "max-pressure+, my fix"],
  ["actuated", "a sensor light"],
  ["green-wave", "a hand-tuned green wave"],
];

const order = (i: number) => ({ "--i": i }) as CSSProperties;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-4 grid scroll-mt-4 gap-y-1">
      <h2 id={`${id}-title`} className="text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [pLo, pHi] = platoonRange("max-pressure");
  return (
    <main className="grid gap-x-4 px-1 py-4 sm:px-4 md:grid-cols-[18ch_minmax(0,1fr)]">
      <nav aria-label="contents" className="hidden md:block">
        <div className="sticky top-4">
          <Toc entries={SECTIONS} />
        </div>
      </nav>

      <article className="max-w-[96ch]">
        <header className="grid gap-y-1">
          <div>
            <a href={SITE} className="arrive" style={order(0)}>
              Arya Patel
            </a>
            <h1 className="arrive mt-1" style={order(1)}>
              green wave
            </h1>
            <p className="arrive text-muted" style={order(2)}>
              Can traffic lights find the green wave on their own?
            </p>
          </div>
          <dl className="arrive grid grid-cols-[8ch_minmax(0,1fr)]" style={order(3)}>
            {META.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="arrive" style={order(4)}>
            Max-pressure is the traffic-light rule with a proof: using nothing but the cars at each light, it
            provably keeps up with any traffic that any timing plan could. I put it on eight real lights on
            Toronto’s Spadina Avenue, with the City’s own counts, to see if it would find the green wave by
            itself. It found the opposite.
          </p>
          <table className="arrive w-full max-w-[56ch] tabular-nums" style={order(5)}>
            <caption className="text-left text-muted">
              Stops on a drive up Spadina, 8 lights, Fort York to College, averaged over the day:
            </caption>
            <tbody>
              {LEDGER.map(([k, label]) => (
                <tr key={k} className={k === "max-pressure" ? "text-ink" : undefined}>
                  <td>{label}</td>
                  <td className="text-right">{f1(stops(k))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="arrive" style={order(6)}>
            <span className="text-muted">In normal words:</span> the clever, proven light made you stop at
            almost every light, more often than a dumb timer. It only sees cars once they’ve stopped, so it
            turns green just after you brake. Teaching it to count the cars that are still coming cut a third
            of those stops. And the humble sensor light that cities already use still beat it.
          </p>
        </header>

        <nav aria-label="contents" className="mt-2 md:hidden">
          <Toc entries={SECTIONS} />
        </nav>

        <Section id="question" title="the question">
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            I grew up around Toronto, and Spadina was how we got downtown. I remember sitting in the back seat
            counting red lights from the lake up to College, pretty sure the city was doing it on purpose.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            The thing I wanted is called a green wave: lights timed so that once you catch one green, you keep
            catching greens, light after light. Green waves are real, and somebody makes them, usually a
            traffic engineer with a spreadsheet of <em className="not-italic text-muted">offsets</em>: how
            many seconds after one light turns green the next one should.
          </p>
          <p>
            Researchers have a light that needs none of that. Max-pressure (Varaiya, 2013) looks only at the
            queues around each light, and comes with a theorem: if any timing plan could keep up with the
            traffic, max-pressure keeps up too, without being told what the traffic is. So, my question: if
            every light on Spadina ran max-pressure, would green waves show up on their own?
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            I’m a software engineer in San Francisco, not a traffic engineer, so this is me learning in
            public. Everything below runs in your browser, built from scratch, and every number comes from a
            simulation you can poke.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="light" title="how a light works">
          <p>
            A traffic light is a scheduler. A normal four-way intersection has two{" "}
            <span className="text-muted">phases</span>: north–south gets green, then east–west. Every switch
            pays a tax: 3 seconds of amber and 1 of all-red, so the last car can clear the box. That’s 4
            seconds of nobody moving, however many people are waiting.
          </p>
          <p>There are three kinds of brain you can give it:</p>
          <ul className="grid gap-y-1">
            <li>
              <span className="text-ink">A timer</span> <span className="text-muted">(fixed-time)</span>. The
              same schedule forever: 30 seconds this way, 20 that way, repeat.
            </li>
            <li>
              <span className="text-ink">A sensor light</span> <span className="text-muted">(actuated)</span>.
              A detector just before the stop line, usually a wire loop cut into the road, keeps the green on
              while cars keep coming and ends it when there’s a gap.
            </li>
            <li>
              <span className="text-ink">Max-pressure</span>. Count the cars waiting on each approach, subtract
              the cars already backed up where they’d go, and give green to the direction with the biggest
              difference.
            </li>
          </ul>
          <Nerds title="max-pressure">
            <p>
              Each phase k serves some links. Its pressure is P_k = Σ (q_l − q_next(l)) over those links, where
              q is the number of stopped cars. Every second, once the current green has lasted its minimum (6 s
              here), switch to the phase with the largest P_k; ties keep the current green. A road that leaves
              the map never backs up, so it counts as empty.
            </p>
            <p>
              Varaiya’s theorem: in a store-and-forward network model, for any demand inside the capacity
              region, max-pressure keeps every queue bounded, without knowing the demand. In that model,
              switching phases is instant and free.
            </p>
          </Nerds>
        </Section>

        <Section id="road" title="the road">
          <p>
            To test any of this I needed traffic, so I built the simplest model that still gets jams:
            Nagel–Schreckenberg (1992). The road is a row of 7.5 m boxes. Every second, every car does four
            things: speed up a notch (to at most 54 km/h), slow down if the car ahead is too close, now and
            then dawdle for no reason, and move.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            The first time I saw rules this small do something this lifelike was Conway’s Game of Life, in a
            first-year CS class at Waterloo. This gave me the same feeling.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            Here’s the dawdle rule on a ring road with no lights at all. Add cars. Past about a third full,
            jams appear out of nothing and roll backwards, against the traffic. Researchers got the same thing
            with real drivers on a circular track in Japan (Sugiyama et al., 2008).
          </p>
          <PhantomJam />
          <Nerds title="the car rules">
            <p>
              Each tick, in parallel: v ← min(v + 1, v_max); v ← min(v, gap); with probability p = 0.1, v ←
              max(v − 1, 0); x ← x + v. Ticks are 1 s, v_max = 2 cells/s (54 km/h), and an open-road car
              averages 1.9 cells/s (51 km/h).
            </p>
            <p>
              At a light, the gap ends at the stop line on amber or red. A standing queue drains at 0.47 cars/s,
              about 1,690 cars an hour per lane, which is the{" "}
              <span className="text-ink">saturation flow</span>: measured from the model, and in the textbook
              range. A stop counts when a car halts after having reached full speed, so creeping forward in a
              queue isn’t a new stop.
            </p>
            <p>
              Left out on purpose: turns, more than one lane (demand is divided per lane), pedestrians, the
              streetcar, right turns on red.
            </p>
          </Nerds>
        </Section>

        <Section id="webster" title="webster’s recipe">
          <p>
            How long should a timer’s cycle be? In 1958 F. V. Webster, at Britain’s Road Research Laboratory,
            worked out a formula that’s still in the textbooks.
          </p>
          <p>
            <span className="text-muted">In normal words:</span> the busier the intersection, the longer the
            cycle, and the cycle shoots up as the intersection nears full. Short cycles waste more of each
            minute on amber; long ones make everyone sit longer at red. Then split the green by how busy each
            direction is.
          </p>
          <Nerds title="the formula">
            <p>
              C = (1.5 L + 5) / (1 − Y). L is the time lost to clearance per cycle (2 phases × 4 s = 8 s). Y is
              how full the intersection is: for each phase, its busiest approach’s flow divided by the
              saturation flow, summed. The usable green C − L is split in proportion to each phase’s share of Y.
              I clamp C to 30–120 s, as real controllers do.
            </p>
          </Nerds>
        </Section>

        <Section id="cliff" title="the cliff">
          <p>
            Before a whole street, one intersection. Drag the demand (Webster’s Y) up and watch.
          </p>
          <Cliff />
          <p>
            <span className="text-muted">In normal words:</span> delay is flat, flat, flat, then a wall. Every
            controller has a cliff; what matters is where. The sensor light is best almost all the way up.
            Textbook max-pressure goes over first: at Y = 0.85 a car waits {s0(cliffDelay("max-pressure", 0.85))}{" "}
            on average, against {s0(cliffDelay("fixed", 0.85))} at the plain timer. With only a 6-second
            minimum green it switches constantly, and every switch pays the 4-second tax. Its proof assumes
            switching is free. (The fourth line, max-pressure+, is my fix. More on it later.)
          </p>
          <p>Now you try. Same junction, busy but not full. Can you beat the algorithms?</p>
          <BeTheLight />
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            I lost to the sensor light more often than I’d like to admit. The thing it knows, and I kept
            forgetting: don’t switch while cars are still coming.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="waves" title="green waves">
          <p>
            One light can only be quick or slow. A row of lights can be <em className="not-italic">coordinated</em>.
            Give every light the same cycle, then shift each one’s start, its{" "}
            <span className="text-muted">offset</span>, so it turns green just as cars from the last light
            arrive. Drive at the right speed and you surf a wave of greens.
          </p>
          <p>
            Here’s Spadina, every light on the same timer. Each line is one car: time runs right, the street
            runs up from the lake. Ink lines go north, grey ones south; a flat stretch is a car stopped at a
            red. Slide the speed the wave is timed for.
          </p>
          <Tuner />
          <p>
            <span className="text-muted">In normal words:</span> the wave only works at the speed people
            actually drive, about 50 km/h here. Time it for 30 or 35 and northbound drivers stop at nearly
            every light. And a wave runs one way: while it carries cars north, the southbound ones hit the
            reds.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            San Francisco does this on purpose for bikes: the lights on Valencia Street are timed for about 13
            mph, so if you ride at that pace you get a run of greens. I didn’t appreciate how fragile that is
            until I built this slider.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="spadina" title="spadina">
          <p>
            Why Spadina: on Wednesday 23 April 2025, the City of Toronto counted cars at eight lights in a
            row on Spadina on the same day, Fort York Blvd up to College St, in 15-minute slices from 6 a.m.
            to 8 p.m. Most counts are one intersection at a time. This is two kilometres, eight lights, and
            real demand on every street.
          </p>
          <p>
            I divide each count over its lanes (lane counts from OpenStreetMap) and run the simulation one
            hour at a time.
          </p>
          <Demand />
          <Nerds title="the data">
            <p>
              Each hour is the average of its four 15-minute counts. Spadina has two general lanes each way
              beside the streetcar tracks. Side-street lanes are counted per approach at the stop line, from
              the OpenStreetMap road nearest each light: Richmond, for one, is one-way westbound with three
              lanes; Adelaide is one-way eastbound with three. Every car goes straight. Wellington St, between
              Front and King, wasn’t counted that day, so it isn’t in the model.
            </p>
          </Nerds>
        </Section>

        <Section id="surprise" title="the surprise">
          <p>
            Five controllers, the same Spadina, the same traffic. Pick one, slide through the day, and tap a
            line to ride along with that car.
          </p>
          <TimeSpace />
          <p>
            The hand-tuned wave draws long, clean diagonals going north. Max-pressure draws staircases. Over
            the whole day, a drive north stops {f1(stops("max-pressure"))} times under max-pressure, against{" "}
            {f1(stops("fixed"))} under a plain timer that doesn’t look at traffic at all.
          </p>
          <p>
            It isn’t bad at everything. On its own terms, total delay over every car, side streets included,
            it beats the timer ({f1(delay("max-pressure"))}s against {f1(delay("fixed"))}s per car), mostly by
            being kind to the side streets. If you’re crossing Spadina it’s a good light. If you’re driving
            along it, it’s the worst one here.
          </p>
        </Section>

        <Section id="why" title="why">
          <p>
            There’s a number for “do cars arrive on green?”: the{" "}
            <span className="text-ink">platoon ratio</span>, from the Highway Capacity Manual. Take the share
            of cars that reach a light on green, and divide by the share of time it’s green. 1 means the lights
            ignore each other: you arrive on green exactly as often as luck would have it. Above 1 is a wave.
            Below 1, you arrive on red more often than luck.
          </p>
          <p>
            Max-pressure is below 1 in both directions in every hour of the day ({pLo.toFixed(2)} to{" "}
            {pHi.toFixed(2)}). It isn’t ignoring the traffic. It’s anti-coordinated.
          </p>
          <p>
            <span className="text-muted">In normal words:</span> max-pressure only counts cars that are
            stopped. A bunch of cars rolling toward a green from the last light is invisible to it. It sees
            them once they’ve braked to a halt, and then their queue is the biggest, and it gives them green.
            Every time. The light turns green just after you stop, by construction.
          </p>
          <p>
            Spadina adds a second problem. Max-pressure subtracts the queue ahead, and Spadina’s lights back
            up into each other, so the main road’s pressure partly cancels itself out. Side streets drain off
            the map and never cancel. When the side streets are quiet, one car stopped on a side street can
            outweigh Spadina.
          </p>
          <Nerds title="platoon ratio">
            <p>
              R_p = P · C / g, where P is the share of arrivals on green and g / C the green share. I measure it
              at lights 2 to 8, using each car’s arrival time projected at free speed from the previous light,
              so a car’s own queue can’t hide when it would have arrived.
            </p>
            <p className="tabular-nums">
              Day averages, north / south:{" "}
              {(["fixed", "green-wave", "actuated", "max-pressure"] as Kind[])
                .map((k) => `${LABELS[k]} ${platoon(k).toFixed(2)} / ${platoon(k, "southbound").toFixed(2)}`)
                .join(", ")}
              .
            </p>
          </Nerds>
        </Section>

        <Section id="fix" title="the fix">
          <p>Two changes, both known ideas, neither specific to Spadina:</p>
          <ol className="grid list-inside list-decimal gap-y-1">
            <li>
              <span className="text-ink">Count the cars that are coming.</span> Upstream, count every car on
              the road toward the light, moving or not. That’s what Varaiya’s own model counts (cars on a
              road); many implementations, my first one included, count only the queue. Position-weighted
              backpressure (Li &amp; Jabari, 2019) goes further and weighs where along the road each car is.
            </li>
            <li>
              <span className="text-ink">Pay for the switch.</span> Hold each green at least 10 seconds, so the
              4-second tax buys real green. The proof treats switching as free; real deployments add a minimum
              green for exactly this reason.
            </li>
          </ol>
          <p>
            Downstream it still counts only cars that are actually stuck; counting moving cars there too makes
            a busy road ahead look backed up. I call it max-pressure+. Switch the diagram above to it.
          </p>
          <p>
            Over the day, a drive north goes from {f1(stops("max-pressure"))} stops to{" "}
            {f1(stops("max-pressure-plus"))}, and south from {f1(stops("max-pressure", "southbound"))} to{" "}
            {f1(stops("max-pressure-plus", "southbound"))}. The platoon ratio flips from{" "}
            {platoon("max-pressure").toFixed(2)} to {platoon("max-pressure-plus").toFixed(2)}: anti-waves
            become weak waves, in every hour. At one intersection, the cliff moves out from Y ≈ 0.8 to about
            0.9.
          </p>
          <p>
            Is it just the longer minimum green? No. Longer minimums on the textbook rule make it worse (the
            table at the end of the next section). What matters is what it counts.
          </p>
          <p>
            It isn’t free. Side streets wait longer ({f1(side("max-pressure"))}s → {f1(side("max-pressure-plus"))}
            s), so total delay per car ends up a little worse than the textbook rule ({f1(delay("max-pressure"))}
            s → {f1(delay("max-pressure-plus"))}s); max-pressure+ wins on that in only{" "}
            {hoursBetter("max-pressure-plus", "max-pressure")} of {hourCount} hours. It moves waiting off
            Spadina and onto the cross streets.
          </p>
          <Nerds title="max-pressure+">
            <p>
              P_k = Σ (n_l − q_next(l)), where n counts every car on link l and q counts stopped cars. Minimum
              green 10 s. Everything else as before.
            </p>
            <p>
              Tried and dropped in early, smaller tests: no downstream term at all (fewer stops, but then it
              isn’t max-pressure any more), and cyclic max-pressure (Le et al., 2015), which had more delay than
              the textbook rule.
            </p>
          </Nerds>
        </Section>

        <Section id="numbers" title="the numbers">
          <p>
            Every point is the mean of 8 seeded runs, each an hour long after a 15-minute warm-up. Pick a
            measure; tap a controller to pick out its line.
          </p>
          <p>Across the day:</p>
          <DayResults />
          <p>As the side streets get busier (9 a.m., every side street’s count scaled from a quarter to double):</p>
          <SideResults />
          <p>Textbook max-pressure’s one knob, the minimum green, at 9 a.m.:</p>
          <MinGreenTable />
        </Section>

        <Section id="meaning" title="what it means">
          <p>
            <span className="text-ink">A proof is a promise about a model.</span> Max-pressure’s promise,
            queues that don’t grow forever, held up. What its model leaves out, the cost of switching and
            cars arriving in bunches, is exactly what makes a drive feel good or bad.
          </p>
          <p>
            <span className="text-ink">You get what you measure.</span> Max-pressure is good at total delay
            and bad at stops, because stops aren’t anywhere in its rule.
          </p>
          <p>
            <span className="text-ink">Seeing early beats thinking hard.</span> The sensor light wins overall
            ({f1(delay("actuated"))}s per car, {f1(stops("actuated"))} stops north) because its detector sees a
            car about 2.5 seconds before the stop line. Max-pressure+ gets most of its gain the same way: by
            counting cars before they stop.
          </p>
          <p>
            <span className="text-ink">A green wave is a choice.</span> The hand-tuned wave is the best drive
            north by far ({f1(stops("green-wave"))} stops) and one of the worst south (
            {f1(stops("green-wave", "southbound"))}). Somebody has to pick a direction.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            Next time I’m home and stuck at Spadina and Queen, I’ll at least know which way the wave runs.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="next" title="next">
          <p>
            Train one. Give a light nothing but the cars around it and a score, let it learn by trial and
            error on Spadina, and see if it reinvents max-pressure, the sensor light, or something better. And
            put back what I left out: turns, the streetcar, people walking.
          </p>
        </Section>

        <Section id="notes" title="notes">
          <p className="text-muted">
            Method: Nagel–Schreckenberg cells (7.5 m, 1 s, 54 km/h, p = 0.1), 3 s amber and 1 s all-red at
            every change, one lane per direction, no turns. Fixed-time uses Webster’s cycle for the busiest
            light at every light; the green wave adds offsets for northbound at free speed; the sensor light
            holds 6–40 s and ends on a gap at a 37.5 m detector. Results are means over 8 seeds, 15 minutes of
            warm-up and 60 measured; the figures you can play with are single seeded runs. Code and data:{" "}
            <a href={CODE}>github.com/Arya-P05/green-wave</a>.
          </p>
          <p className="text-muted">
            Traffic counts: City of Toronto,{" "}
            <a href="https://open.toronto.ca/dataset/traffic-volumes-at-intersections-for-all-modes/">
              Traffic Volumes at Intersections for All Modes
            </a>
            . Contains information licensed under the{" "}
            <a href="https://open.toronto.ca/open-data-licence/">Open Government Licence – Toronto</a>. Lane
            counts: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ODbL.
          </p>
          <ol className="grid gap-y-1 text-muted">
            <li>Webster, F. V. (1958). Traffic Signal Settings. Road Research Technical Paper 39.</li>
            <li>
              Nagel, K. &amp; Schreckenberg, M. (1992). A cellular automaton model for freeway traffic. Journal
              de Physique I, 2, 2221–2229.
            </li>
            <li>
              Varaiya, P. (2013). Max pressure control of a network of signalized intersections. Transportation
              Research Part C, 36, 177–195.
            </li>
            <li>
              Sugiyama, Y. et al. (2008). Traffic jams without bottlenecks. New Journal of Physics, 10, 033001.
            </li>
            <li>
              Le, T. et al. (2015). Decentralized signal control for urban road networks. Transportation
              Research Part C, 58, 431–450.
            </li>
            <li>
              Li, L. &amp; Jabari, S. E. (2019). Position weighted backpressure intersection control for urban
              networks. Transportation Research Part B, 128, 435–461.
            </li>
            <li>Transportation Research Board. Highway Capacity Manual: platoon ratio.</li>
          </ol>
        </Section>

        <footer className="mt-4 flex items-end gap-[2ch]">
          <Signature />
          <p className="text-muted italic">remember life</p>
        </footer>
      </article>
    </main>
  );
}
