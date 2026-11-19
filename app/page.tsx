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

/** The scoreboard in "the numbers": stops on a drive up Spadina, day average, fewest last. */
const LEDGER: [Kind, string][] = [
  ["max-pressure", "max-pressure, the research algorithm"],
  ["fixed", "a plain timer"],
  ["max-pressure-plus", "max-pressure+, my fix"],
  ["actuated", "a sensor"],
  ["green-wave", "a hand-timed green wave"],
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
          <p className="arrive" style={order(3)}>
            Lately I’ve been going down a rabbit hole on how traffic lights decide when to change (it’s way
            more interesting than it sounds). Somewhere along the way I ended up building a simulated version
            of Spadina Avenue in Toronto: eight real traffic lights, a few thousand simulated cars, and the
            City’s actual traffic counts. Then I gave the lights different brains (a plain timer, a sensor, and
            a famous algorithm from research papers that comes with a mathematical proof) and counted one
            thing: how many times you have to stop on a drive up the street.
          </p>
          <p className="arrive" style={order(4)}>
            I went in assuming the algorithm from the papers would win. It didn’t, and working out why is most
            of this post. Along the way you can drive the street, time the lights, and try being a light
            yourself.
          </p>
        </header>

        <nav aria-label="contents" className="mt-2 md:hidden">
          <Toc entries={SECTIONS} />
        </nav>

        <Section id="question" title="the question">
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            I grew up around Toronto, and Spadina was how we got downtown. I remember sitting in the back seat
            counting red lights from the lake up to College, half convinced the city had timed them to catch us.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            What I wanted was the opposite: a <span className="text-ink">green wave</span>. That’s when the
            lights are timed so that once you catch one green, the next one turns green just as you get there,
            and the next, all the way up the street. Turns out, when I looked into it during my rabbit hole, green waves are actually
            real. What surprised me is how they get made: mostly by hand. A traffic engineer sits down with a
            spreadsheet, works out the timings light by light, and that’s the plan until someone redoes it.
            By hand! In this day and age! There had to be a better way.
          </p>
          <p>
            Then I found out researchers have a light that needs no spreadsheet. It’s called{" "}
            <span className="text-ink">max-pressure</span> (Varaiya, 2013). Each light just looks at the cars
            around it and decides who goes next, and there’s a theorem saying it will keep up with any traffic
            that any timing plan could. So my question was simple: if every light on Spadina ran max-pressure,
            would green waves appear all by themselves?
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            I’m by no means a traffic engineer. I just wanted to experiment and nerd out, so take all of this
            as me learning as I go.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="light" title="how a light works">
          <p>
            Start with one intersection. A traffic light is really a scheduler: it takes turns. At a normal
            four-way crossing there are two turns, called <span className="text-muted">phases</span>:
            north–south goes, then east–west goes, and repeat.
          </p>
          <p>
            Every time it swaps turns, it pays a tax: 3 seconds of amber, then 1 second where every direction
            is red so the last car can clear the box. That’s 4 seconds where nobody moves, however many people
            are waiting. Keep those 4 seconds in mind, because they end up mattering a lot later on.
          </p>
          <p>The only question a light ever answers is “whose turn is it?” There are three kinds of brain:</p>
          <ul className="grid gap-y-1">
            <li>
              <span className="text-ink">A timer.</span> The same schedule forever: 30 seconds this way, 20
              that way, repeat. It never looks at the road. Most downtown lights are timers.
            </li>
            <li>
              <span className="text-ink">A sensor.</span> A detector just before the stop line, usually a loop
              of wire cut into the road, notices cars. It keeps the green on while cars keep arriving and ends
              it when there’s a gap. (Ever rolled up to a red, and it changed for you? That.)
            </li>
            <li>
              <span className="text-ink">Max-pressure.</span> Count the cars waiting on each side, subtract the
              cars already backed up where they’re headed, and give the green to whoever has the biggest pile.
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
            To test any of this I needed traffic, so I wrote the simplest fake traffic I could find that still
            behaves like the real thing. It’s called Nagel–Schreckenberg (1992). The road is a row of boxes,
            each one car long (7.5 m). Every second, every car follows four rules:
          </p>
          <ol className="grid list-inside list-decimal gap-y-0">
            <li>speed up a little, up to the limit (54 km/h);</li>
            <li>slow down if the car ahead is too close;</li>
            <li>once in a while, slow down for no reason (that’s you, checking your phone);</li>
            <li>move.</li>
          </ol>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            The first time I saw rules this small do something this lifelike was Conway’s Game of Life, in a
            first-year CS class at Waterloo. This gave me the same feeling.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            Here’s why rule 3 matters. Below is a loop of road with no lights, no crashes, nothing in the way.
            Add enough cars and jams appear out of thin air, then slide backwards while every car in them is
            driving forwards. These are called <span className="text-ink">phantom jams</span>, and researchers
            got exactly the same thing with real drivers on a circular track in Japan (Sugiyama et al., 2008).
          </p>
          <PhantomJam />
          <p>
            <span className="text-muted">Why this matters:</span> four rules are enough to get queues, stop-and-go
            and jams nobody caused. That’s all a traffic light has to deal with, so it’s enough to test them.
          </p>
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
            Back to the timer. One full round of turns (north–south, then east–west) is called a{" "}
            <span className="text-ink">cycle</span>. How long should it be? In 1958 F. V. Webster, at Britain’s
            Road Research Laboratory, worked out a recipe that’s still in the textbooks.
          </p>
          <p>
            The idea: a short cycle swaps turns often, so it pays the 4-second tax a lot. A long cycle pays it
            less, but makes everyone sit at red longer. The busier the intersection, the longer the best cycle,
            and as it gets close to full, the best cycle shoots up. Then you split the green by how busy each
            direction is.
          </p>
          <Nerds title="Webster’s formula">
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
            Time to race the brains on one intersection. The slider is <span className="text-ink">demand</span>:
            how full the intersection is. At 0.5 it needs half of every minute as green just to keep up; at 1
            it needs all of it, with no time left for the amber tax.
          </p>
          <Cliff />
          <p>
            What you should see: waiting stays flat, flat, flat, and then hits a wall. Every brain has a cliff;
            the question is where. The sensor is best almost all the way up. Textbook max-pressure goes over
            first: at 0.85 a car waits {s0(cliffDelay("max-pressure", 0.85))} on average, against{" "}
            {s0(cliffDelay("fixed", 0.85))} at the plain timer. It swaps turns so often that the 4-second tax
            eats it alive. (Its proof assumes swapping is free.) The line labelled max-pressure+ is my fix;
            hold that thought.
          </p>
          <p>
            Now you try. Same junction, turned up close to the cliff. Can you beat the algorithms?
          </p>
          <BeTheLight />
          <p>
            If you won, notice how: you watched cars coming from far away and switched before they arrived.
            The algorithms can’t see that far. The sensor sees about 2.5 seconds ahead; max-pressure only
            counts cars that have already stopped. Remember that. It’s the whole story.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            I lost to the sensor more often than I’d like to admit. The thing it knows, and I kept forgetting:
            don’t switch while cars are still coming.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="waves" title="green waves">
          <p>
            One light can only be quick or slow. A whole street of lights can work together. Give every light
            the same cycle, then start each one a few seconds after the one before it, timed to how long it
            takes to drive between them. That delay is called an <span className="text-ink">offset</span>.
            Get the offsets right, drive at the right speed, and you surf a wave of greens.
          </p>
          <p>
            To see it, I’ll use the picture traffic engineers use, a{" "}
            <span className="text-ink">time-space diagram</span>. Spadina runs up the page, from Fort York at
            the bottom to College at the top. Time runs to the right. Every line is one car: a line climbing up
            is a car driving north, a line going down is a car driving south, and a flat bit is a car sitting
            at a red. The coloured stripes are the lights.
          </p>
          <Tuner />
          <p>
            Here’s the catch: the wave only works at the speed people actually drive, about 50 km/h here. Time
            it for 30 or 35 and the northbound lines turn into staircases; drivers stop at nearly every light.
            And a wave only runs one way: while it carries cars north, the southbound ones keep hitting reds.
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
            Why Spadina? On Wednesday 23 April 2025, the City of Toronto counted every car at eight lights in a
            row on Spadina, Fort York up to College, in 15-minute slices from 6 a.m. to 8 p.m. Counts usually
            happen one intersection at a time, so getting a whole stretch on the same day is rare. Two
            kilometres, eight lights, real traffic on every street.
          </p>
          <p>
            I split each count across its lanes (lane counts from OpenStreetMap) and feed the simulation one
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
            So: same street, same traffic, five brains. This is the moment I’d been building toward. Pick a
            brain, slide through the day, and tap any line to ride along with that car.
          </p>
          <TimeSpace />
          <p>
            The hand-timed green wave draws long, clean diagonals going north. Max-pressure draws staircases.
            Over the whole day, a drive north stops {f1(stops("max-pressure"))} times under max-pressure, against{" "}
            {f1(stops("fixed"))} under a plain timer that never even looks at the road.
          </p>
          <p>
            To be fair, it isn’t bad at everything. Add up the waiting of every car, side streets included,
            and it beats the timer ({f1(delay("max-pressure"))}s against {f1(delay("fixed"))}s per car), mostly
            by being kind to the side streets. If you’re crossing Spadina it’s a good light. If you’re driving
            along it, it’s the worst one here.
          </p>
        </Section>

        <Section id="why" title="why">
          <p>
            I wanted a number for “do cars arrive on green?”, and traffic engineers have one, the{" "}
            <span className="text-ink">platoon ratio</span> from the Highway Capacity Manual. (A platoon is a
            bunch of cars travelling together, like the group that leaves a light when it turns green.) Take
            the share of cars that reach a light on green, and divide by the share of the time it’s green.
          </p>
          <ul className="grid gap-y-1">
            <li>1 means the lights ignore each other: you hit greens exactly as often as luck would say.</li>
            <li>Above 1 is a wave: you hit greens more often than luck.</li>
            <li>Below 1, you hit reds more often than luck.</li>
          </ul>
          <p>
            Max-pressure is below 1 in both directions in every hour of the day ({pLo.toFixed(2)} to{" "}
            {pHi.toFixed(2)}). It isn’t ignoring the traffic. It’s working against it.
          </p>
          <p>
            Here’s the reason, and it’s the same thing you noticed playing the light. Max-pressure only counts
            cars that are stopped. A platoon rolling toward it from the last light is invisible. It only sees
            those cars once they’ve braked to a halt; then their pile is the biggest, so they get the green.
            The light turns green just after you stop, by design.
          </p>
          <p>
            Spadina makes it worse. Max-pressure subtracts the cars backed up ahead, and Spadina’s lights back
            up into each other, so the main road’s pile partly cancels itself out. Side streets drain off the
            edge of the map and never cancel. On a quiet afternoon, one car stopped on a side street can
            outweigh the whole main road.
          </p>
          <Nerds title="the platoon ratio">
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
          <p>
            If the problem is that it can’t see you coming, let it see you coming. Two changes, both ideas that
            already exist, neither tuned for Spadina:
          </p>
          <ol className="grid list-inside list-decimal gap-y-1">
            <li>
              <span className="text-ink">Count the cars that are coming.</span> Count every car on the road
              toward the light, moving or not, instead of only the stopped ones. That’s actually what Varaiya’s
              own model counts; many implementations, my first one included, count only the queue.
              Position-weighted backpressure (Li &amp; Jabari, 2019) goes further and weighs where along the
              road each car is.
            </li>
            <li>
              <span className="text-ink">Pay for the swap.</span> Keep each green at least 10 seconds, so the
              4-second tax buys real green. The proof treats swapping as free; real deployments add a minimum
              green for exactly this reason.
            </li>
          </ol>
          <p>
            It still only counts cars that are truly stuck ahead (counting moving ones there makes a busy road
            look jammed). I call it max-pressure+. Flip the diagram above to it and the staircases start to
            straighten out.
          </p>
          <p>
            Over the day, a drive north goes from {f1(stops("max-pressure"))} stops to{" "}
            {f1(stops("max-pressure-plus"))}, and south from {f1(stops("max-pressure", "southbound"))} to{" "}
            {f1(stops("max-pressure-plus", "southbound"))}. The arrive-on-green ratio flips from{" "}
            {platoon("max-pressure").toFixed(2)} to {platoon("max-pressure-plus").toFixed(2)}: working against
            the traffic becomes a weak wave, in every hour of the day. At one intersection, the cliff moves out
            from about 0.8 to about 0.9.
          </p>
          <p>
            Is it just the longer minimum green? No. Longer minimums on the textbook rule make it worse (the
            table at the end of the next section). What matters is what it counts.
          </p>
          <p>
            It isn’t free, though. Side streets wait longer ({f1(side("max-pressure"))}s →{" "}
            {f1(side("max-pressure-plus"))}s), so the total waiting per car ends up a little worse than the
            textbook rule ({f1(delay("max-pressure"))}s → {f1(delay("max-pressure-plus"))}s); max-pressure+ wins
            on that in only {hoursBetter("max-pressure-plus", "max-pressure")} of {hourCount} hours. It moves
            the waiting off Spadina and onto the cross streets. And the sensor still beats both.
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
          <p>Here’s where every brain ended up, in one table:</p>
          <table className="w-full max-w-[56ch] tabular-nums">
            <caption className="text-left text-muted">
              Stops on one drive up Spadina, past 8 lights, averaged over the whole day:
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
          <p>
            And for the curious, everything else at once. Every point is the average of 8 runs with different random
            traffic, each an hour long after a 15-minute warm-up.
          </p>
          <p>Across the day:</p>
          <DayResults />
          <p>
            What if the side streets got busier? Here’s 9 a.m. with every side street’s traffic scaled from a
            quarter to double:
          </p>
          <SideResults />
          <p>
            And textbook max-pressure’s one knob, the minimum green, at 9 a.m. Longer greens don’t save it:
          </p>
          <MinGreenTable />
        </Section>

        <Section id="meaning" title="what it means">
          <p>
            <span className="text-ink">A proof is a promise about a model.</span> Max-pressure’s promise,
            queues that don’t grow forever, held up. What its model leaves out, the cost of swapping and cars
            arriving in bunches, is exactly what makes a drive feel good or bad.
          </p>
          <p>
            <span className="text-ink">You get what you measure.</span> Max-pressure is good at total waiting
            and bad at stops, because stops aren’t anywhere in its rule.
          </p>
          <p>
            <span className="text-ink">Seeing early beats thinking hard.</span> The sensor wins overall (
            {f1(delay("actuated"))}s per car, {f1(stops("actuated"))} stops north) just because its detector
            sees a car about 2.5 seconds before the stop line. Max-pressure+ gets most of its gain the same
            way. So did you, if you beat the light.
          </p>
          <p>
            <span className="text-ink">A green wave is a choice.</span> The hand-timed wave is the best drive
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
            Let a light learn. Give it nothing but the cars around it and a score, let it practise on Spadina
            by trial and error, and see if it reinvents max-pressure, the sensor, or something better. And put
            back what I left out: turns, the streetcar, people walking.
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

        <dl className="mt-4 grid grid-cols-[8ch_minmax(0,1fr)] text-muted">
          {META.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <footer className="mt-2 flex items-end gap-[2ch]">
          <Signature />
          <p className="text-muted italic">remember life</p>
        </footer>
      </article>
    </main>
  );
}
