import type { Metadata } from "next";
import Link from "next/link";
import BeTheLight from "@/components/green-wave/cliff/BeTheLight";
import Cliff from "@/components/green-wave/cliff/Cliff";
import Demand from "@/components/green-wave/Demand";
import Nerds from "@/components/shared/Nerds";
import Picture from "@/components/shared/Picture";
import PhantomJam from "@/components/green-wave/PhantomJam";
import { DayResults, MinGreenTable, SideResults } from "@/components/green-wave/results/Results";
import { Meta, order, Section, SignOff } from "@/components/shared/Post";
import Toc from "@/components/shared/Toc";
import { requireReleased } from "../writings";
import type { Entry } from "@/components/shared/Toc";
import TimeSpace from "@/components/green-wave/wave/TimeSpace";
import Tuner from "@/components/green-wave/wave/Tuner";
import { LABELS } from "@/lib/green-wave/sim/scenario";
import type { Kind } from "@/lib/green-wave/sim/scenario";
import { cliffDelay, delay, f1, hourCount, hoursBetter, platoon, platoonRange, s0, side, stops } from "./numbers";

export const metadata: Metadata = {
  title: "green wave",
  description:
    "can traffic lights find the green wave on their own? max-pressure on eight real toronto lights, and a fix.",
};

const CODE = "https://github.com/Arya-P05/green-wave";

const SECTIONS: Entry[] = [
  { id: "question", title: "the back seat" },
  { id: "light", title: "whose turn is it?" },
  { id: "road", title: "fake traffic, real jams" },
  { id: "webster", title: "a recipe from 1958" },
  { id: "cliff", title: "the cliff" },
  { id: "waves", title: "surfing the greens" },
  { id: "spadina", title: "why spadina" },
  { id: "surprise", title: "the surprise" },
  { id: "why", title: "why it keeps catching you" },
  { id: "fix", title: "letting it see you coming" },
  { id: "numbers", title: "the scoreboard" },
  { id: "meaning", title: "what i learned" },
  { id: "next", title: "what’s next" },
  { id: "notes", title: "notes" },
];

const META: [string, React.ReactNode][] = [
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

export default function Home() {
  requireReleased("green-wave");
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
            <Link href="/" aria-label="back to writing" className="arrive text-muted" style={{ ...order(0), textDecoration: "none" }}>
              ←
            </Link>
            <h1 className="arrive mt-1" style={order(1)}>
              green wave
            </h1>
            <p className="arrive text-muted" style={order(2)}>
              can traffic lights find the green wave on their own?
            </p>
          </div>
          {/* <!-- ARYA-TWEAK --> */}
          <p className="arrive" style={order(3)}>
            i grew up around toronto, and spadina was how we got downtown. i remember sitting in the back seat
            counting red lights from the lake up to college, half convinced the city had timed them just to
            catch us.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p className="arrive" style={order(4)}>
            lately i’ve been going down a rabbit hole on how traffic lights actually decide when to change
            (it’s way more interesting than it sounds, i promise), and it turned into me building a fake
            spadina: eight real traffic lights, a few thousand simulated cars, and the city’s actual traffic
            counts. then i gave the lights different brains and counted one thing: how many times you have to
            stop on a drive up the street.
          </p>
          <p className="arrive" style={order(5)}>
            one of those brains is a famous algorithm from research papers that comes with a mathematical proof.
            i went in assuming it would win. it came dead last, and figuring out why is most of this post. along
            the way you get to drive the street, time the lights, and try being a light yourself.
          </p>
        </header>

        <Section id="question" title="the back seat">
          <Picture src="/green-wave/back-seat.png" alt="A line sketch: a small car driving right along a road, a grown-up driving and a kid in the back window, and ahead of them a row of four traffic lights getting smaller into the distance, every one of them red." width={1048} height={395} priority />
          <p>
            what i wanted, back then, was the opposite: a <span className="text-ink">green wave</span>. that’s
            when the lights are timed so that once you catch one green, the next one turns green right as you
            get there, and the next, all the way up the street. you basically get to surf.
          </p>
          <p>
            turns out green waves are real! what surprised me is how they get made: mostly by hand. a traffic
            engineer sits down with a spreadsheet, works out the timings light by light, and that’s the plan
            until someone redoes it. by hand! in this day and age!
          </p>
          <Picture src="/green-wave/morgan-1923.png" alt="A 1923 patent drawing of a traffic signal: a tall post with STOP and GO arms, a bell-shaped cap, and a small crank handle partway down the post, plus three close-up views of the arms." width={900} height={1131} side="right" offset={-4} caption="G. A. Morgan, Traffic Signal, US patent 1,475,024, 1923" note="Running traffic by hand is an old tradition. This is Garrett Morgan’s 1923 patent for a traffic signal: an attendant turned the crank on the post to flip the arms between stop and go. (The very first traffic signal, outside the Houses of Parliament in London in 1868, was worked by a police officer. It exploded a few weeks later.)" />
          <p>
            and then i found out researchers have a light that needs no spreadsheet at all. it’s called{" "}
            <span className="text-ink">max-pressure</span> (varaiya, 2013). each light just looks at the cars
            around it and decides who goes next, and there’s a theorem saying it will keep up with any traffic
            that any timing plan could.
          </p>
          <p>
            so my question was simple: if every light on spadina ran max-pressure, would green waves show up
            all on their own?
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            quick disclaimer: i’m by no means a traffic engineer. i just wanted to experiment and nerd out, so
            take all of this as me learning as i go.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="light" title="whose turn is it?">
          <p>
            ok so, start with one intersection. a traffic light is really just a scheduler: it takes turns. at a
            normal four-way crossing there are two turns, called <span className="text-muted">phases</span>.
            north–south goes, then east–west goes, and repeat.
          </p>
          <p>
            every time it swaps turns, it pays a tax: 3 seconds of amber, then 1 second where every direction is
            red so the last car can clear the box. that’s 4 seconds where nobody moves, no matter how many people
            are waiting. remember those 4 seconds, because they come back later in a big way.
          </p>
          <p>so the only question a light ever answers is “whose turn is it?” and there are three kinds of brain answering it:</p>
          <ul className="grid gap-y-1">
            <li>
              <span className="text-ink">a timer.</span> the same schedule forever: 30 seconds this way, 20 that
              way, repeat. it never looks at the road. most downtown lights are timers.
            </li>
            <li>
              <span className="text-ink">a sensor.</span> a detector just before the stop line, usually a loop of
              wire cut into the road, notices cars. it keeps the green on while cars keep arriving and ends it
              when there’s a gap. (ever rolled up to a red and it changed just for you? that.)
            </li>
            <li>
              <span className="text-ink">max-pressure.</span> count the cars waiting on each side, subtract the
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

        <Section id="road" title="fake traffic, real jams">
          <p>
            to test any of this i needed traffic, so i wrote the simplest fake traffic i could find that still
            behaves like the real thing. it’s called nagel–schreckenberg (1992). picture the road as a row of
            boxes, each one car long (7.5 m). every second, every car follows four rules:
          </p>
          <ol className="grid list-inside list-decimal gap-y-0">
            <li>speed up a little, up to the limit (54 km/h);</li>
            <li>slow down if the car ahead is too close;</li>
            <li>once in a while, slow down for no reason (that’s you, checking your phone);</li>
            <li>move.</li>
          </ol>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            the first time i saw rules this small do something this lifelike was conway’s game of life, in a
            first-year cs class at waterloo. this gave me the exact same feeling.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            rule 3 is the fun one. below is a loop of road with no lights, no crashes, nothing in the way. add
            enough cars and jams appear out of thin air, then slide backwards while every car in them is driving
            forwards. these are called <span className="text-ink">phantom jams</span>, and researchers got
            exactly the same thing with real drivers on a circular track in japan (sugiyama et al., 2008).
          </p>
          <PhantomJam />
          <p>
            <span className="text-muted">why this matters:</span> four rules are enough to get queues,
            stop-and-go, and jams nobody caused. that’s everything a traffic light has to deal with, so it’s
            enough to test them.
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

        <Section id="webster" title="a recipe from 1958">
          <p>
            back to the timer for a sec. one full round of turns (north–south, then east–west) is called a{" "}
            <span className="text-ink">cycle</span>. how long should it be? in 1958, f. v. webster at britain’s
            road research laboratory worked out a recipe that’s still in the textbooks.
          </p>
          <p>
            the idea is a tradeoff. a short cycle swaps turns a lot, so it pays the 4-second tax a lot. a long
            cycle pays it less, but makes everyone sit at red longer. the busier the intersection, the longer the
            best cycle, and as it gets close to full, the best cycle shoots way up. then you split the green by
            how busy each direction is.
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
            time to race the brains on one intersection. the slider is <span className="text-ink">demand</span>,
            which is basically how full the intersection is. at 0.5 it needs half of every minute as green just
            to keep up. at 1 it needs all of it, with zero time left for the amber tax.
          </p>
          <Cliff />
          <p>
            what you should see: waiting stays flat, flat, flat, and then hits a wall. every brain has a cliff,
            the question is just where. the sensor is best almost all the way up. textbook max-pressure goes over
            first: at 0.85 a car waits {s0(cliffDelay("max-pressure", 0.85))} on average, against{" "}
            {s0(cliffDelay("fixed", 0.85))} at the plain timer.
          </p>
          <p>
            why? it swaps turns so often that the 4-second tax eats it alive. (its proof assumes swapping is
            free, which, as we just saw, it very much isn’t.) the line labelled max-pressure+ is my fix, so hold
            that thought.
          </p>
          <p>
            ok, now you try. same junction, turned up close to the cliff. can you beat the algorithms?
          </p>
          <BeTheLight />
          <p>
            if you won, notice how: you watched cars coming from far away and switched before they got there.
            the algorithms can’t see that far. the sensor sees about 2.5 seconds ahead, and max-pressure only
            counts cars that have already stopped. remember that one, because it’s basically the whole story.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            i lost to the sensor more often than i’d like to admit. the thing it knows, and i kept forgetting:
            don’t switch while cars are still coming.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="waves" title="surfing the greens">
          <p>
            one light on its own can only be quick or slow. a whole street of lights can work together. give
            every light the same cycle, then start each one a few seconds after the one before it, timed to how
            long it takes to drive between them. that delay is called an <span className="text-ink">offset</span>.
            get the offsets right, drive at the right speed, and you surf a wave of greens.
          </p>
          <p>
            to see it, i’ll use the picture traffic engineers use, a{" "}
            <span className="text-ink">time-space diagram</span>. it looks scary at first but it’s pretty simple:
          </p>
          <ul className="grid gap-y-1">
            <li>spadina runs up the page, from fort york at the bottom to college at the top;</li>
            <li>time runs to the right;</li>
            <li>
              every line is one car: a line climbing up is a car driving north, a line going down is a car
              driving south, and a flat bit is a car sitting at a red;
            </li>
            <li>the coloured stripes are the lights.</li>
          </ul>
          <Tuner />
          <p>
            here’s the catch: the wave only works at the speed people actually drive, about 50 km/h here. time it
            for 30 or 35 and the northbound lines turn into staircases, and drivers stop at nearly every light.
            and a wave only runs one way. while it carries cars north, the southbound ones keep hitting reds.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            san francisco actually does this on purpose for bikes: the lights on valencia street are timed for
            about 13 mph, so if you ride at that pace you get a run of greens. i didn’t appreciate how fragile
            that is until i built this slider.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="spadina" title="why spadina">
          <p>
            ok, so why spadina specifically? on wednesday 23 april 2025, the city of toronto counted every car
            at eight lights in a row on spadina, fort york up to college, in 15-minute slices from 6 a.m. to 8
            p.m. counts usually happen one intersection at a time, so getting a whole stretch on the same day is
            rare. two kilometres, eight lights, real traffic on every street. basically a gift for this exact
            question.
          </p>
          <p>
            i split each count across its lanes (lane counts from openstreetmap) and feed the simulation one hour
            at a time.
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
            so: same street, same traffic, five brains. this is the moment i’d been building toward the whole
            time. pick a brain, slide through the day, and tap any line to ride along with that car.
          </p>
          <TimeSpace />
          <p>
            the hand-timed green wave draws long, clean diagonals going north. max-pressure draws staircases.
            over the whole day, a drive north stops {f1(stops("max-pressure"))} times under max-pressure, against{" "}
            {f1(stops("fixed"))} under a plain timer that never even looks at the road.
          </p>
          <p>
            so the algorithm with the proof loses to a timer. on the one thing i actually cared about, stops, it
            has the most of any brain here, going north and going south.
          </p>
          <p>
            to be fair, it isn’t bad at everything. add up the waiting of every car, side streets included, and
            it beats the timer ({f1(delay("max-pressure"))}s against {f1(delay("fixed"))}s per car), mostly by
            being kind to the side streets. if you’re crossing spadina, it’s a good light. if you’re driving along
            it, it’s the worst one here.
          </p>
        </Section>

        <Section id="why" title="why it keeps catching you">
          <p>
            i wanted a number for “do cars arrive on green?”, and traffic engineers have one: the{" "}
            <span className="text-ink">platoon ratio</span>, from the highway capacity manual. (a platoon is just
            a bunch of cars travelling together, like the group that leaves a light when it turns green.) you take
            the share of cars that reach a light on green, and divide by the share of the time it’s green.
          </p>
          <ul className="grid gap-y-1">
            <li>1 means the lights ignore each other: you hit greens exactly as often as luck would say.</li>
            <li>above 1 is a wave: you hit greens more often than luck.</li>
            <li>below 1, you hit reds more often than luck.</li>
          </ul>
          <p>
            max-pressure is below 1 in both directions in every hour of the day ({pLo.toFixed(2)} to{" "}
            {pHi.toFixed(2)}). so it isn’t just ignoring the traffic. it’s working against it.
          </p>
          <p>
            here’s the reason, and it’s the same thing you noticed playing the light. max-pressure only counts
            cars that are stopped. a platoon rolling toward it from the last light is invisible. it only sees
            those cars once they’ve braked to a halt, and then their pile is the biggest, so they get the green.
            the light turns green just after you stop. by design!
          </p>
          <Picture src="/green-wave/what-it-sees.png" alt="A line sketch: on the right a red traffic light, three cars stopped in front of it inside a dashed box, and further back three more cars rolling toward it with speed lines, outside the box." width={1048} height={247} note="What max-pressure sees: only the cars in the box. The bunch rolling in from the last light doesn’t exist to it until they’ve stopped too." />
          <p>
            and spadina makes it worse. max-pressure subtracts the cars backed up ahead, and spadina’s lights back
            up into each other, so the main road’s pile partly cancels itself out. side streets drain off the edge
            of the map and never cancel. so on a quiet afternoon, one car stopped on a side street can outweigh
            the whole main road.
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

        <Section id="fix" title="letting it see you coming">
          <p>
            if the problem is that it can’t see you coming, then let it see you coming. two changes, both ideas
            that already exist, and neither tuned for spadina:
          </p>
          <ol className="grid list-inside list-decimal gap-y-1">
            <li>
              <span className="text-ink">count the cars that are coming.</span> count every car on the road toward
              the light, moving or not, instead of only the stopped ones. that’s actually what varaiya’s own model
              counts; many implementations, my first one included, count only the queue. position-weighted
              backpressure (li &amp; jabari, 2019) goes further and weighs where along the road each car is.
            </li>
            <li>
              <span className="text-ink">pay for the swap.</span> keep each green at least 10 seconds, so the
              4-second tax buys real green. the proof treats swapping as free; real deployments add a minimum green
              for exactly this reason.
            </li>
          </ol>
          <p>
            it still only counts cars that are truly stuck ahead (counting moving ones there makes a busy road
            look jammed). i call it max-pressure+. flip the diagram above to it and the staircases start to
            straighten out.
          </p>
          <p>
            over the day, a drive north goes from {f1(stops("max-pressure"))} stops to{" "}
            {f1(stops("max-pressure-plus"))}, and south from {f1(stops("max-pressure", "southbound"))} to{" "}
            {f1(stops("max-pressure-plus", "southbound"))}. the arrive-on-green ratio flips from{" "}
            {platoon("max-pressure").toFixed(2)} to {platoon("max-pressure-plus").toFixed(2)}: working against the
            traffic becomes a weak wave, in every hour of the day. at one intersection, the cliff moves out from
            about 0.8 to about 0.9.
          </p>
          <p>
            is it just the longer minimum green doing the work? nope. longer minimums on the textbook rule make it
            worse (there’s a table for that at the end of the next section). what matters is what it counts.
          </p>
          <p>
            it isn’t free, though. side streets wait longer ({f1(side("max-pressure"))}s →{" "}
            {f1(side("max-pressure-plus"))}s), so the total waiting per car ends up a little worse than the
            textbook rule ({f1(delay("max-pressure"))}s → {f1(delay("max-pressure-plus"))}s); max-pressure+ wins on
            that in only {hoursBetter("max-pressure-plus", "max-pressure")} of {hourCount} hours. it moves the
            waiting off spadina and onto the cross streets. and the sensor still beats both.
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

        <Section id="numbers" title="the scoreboard">
          <p>here’s where every brain ended up, in one table:</p>
          <table className="w-full max-w-[56ch] tabular-nums">
            <caption className="text-left text-muted">
              stops on one drive up spadina, past 8 lights, averaged over the whole day:
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
            and for the curious (hi, fellow nerds), here’s everything else at once. every point is the average of
            8 runs with different random traffic, each an hour long after a 15-minute warm-up.
          </p>
          <p>across the day:</p>
          <DayResults />
          <p>
            what if the side streets got busier? here’s 9 a.m. with every side street’s traffic scaled from a
            quarter to double:
          </p>
          <SideResults />
          <p>
            and textbook max-pressure’s one knob, the minimum green, at 9 a.m. longer greens don’t save it:
          </p>
          <MinGreenTable />
        </Section>

        <Section id="meaning" title="what i learned">
          <p>
            <span className="text-ink">a proof is a promise about a model.</span> max-pressure’s promise, queues
            that don’t grow forever, held up. what its model leaves out, the cost of swapping and cars arriving in
            bunches, is exactly what makes a drive feel good or bad.
          </p>
          <p>
            <span className="text-ink">you get what you measure.</span> max-pressure is good at total waiting and
            bad at stops, because stops aren’t anywhere in its rule.
          </p>
          <p>
            <span className="text-ink">seeing early beats thinking hard.</span> the sensor wins overall (
            {f1(delay("actuated"))}s per car, {f1(stops("actuated"))} stops north) just because its detector sees
            a car about 2.5 seconds before the stop line. max-pressure+ gets most of its gain the same way. so did
            you, if you beat the light.
          </p>
          <p>
            <span className="text-ink">a green wave is a choice.</span> the hand-timed wave is the best drive north
            by far ({f1(stops("green-wave"))} stops) and one of the worst south (
            {f1(stops("green-wave", "southbound"))}). somebody has to pick a direction.
          </p>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            next time i’m home and stuck at spadina and queen, i’ll at least know which way the wave runs.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="next" title="what’s next">
          <p>
            next, i want to let a light learn. give it nothing but the cars around it and a score, let it practise
            on spadina by trial and error, and see if it reinvents max-pressure, the sensor, or something better.
            and put back what i left out: turns, the streetcar, people walking.
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

        <Meta rows={META} />
        <SignOff />
      </article>
    </main>
  );
}
