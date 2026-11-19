import Cliff from "@/components/cliff/Cliff";
import Toc from "@/components/Toc";
import type { Entry } from "@/components/Toc";
import Todo from "@/components/Todo";
import TimeSpace from "@/components/wave/TimeSpace";

const SECTIONS: Entry[] = [
  { id: "question", title: "the question" },
  { id: "background", title: "how lights decide" },
  { id: "cliff", title: "the cliff" },
  { id: "model", title: "the model" },
  { id: "spadina", title: "spadina" },
  { id: "wave", title: "the green wave" },
  { id: "results", title: "results" },
  { id: "takeaways", title: "takeaways" },
  { id: "next", title: "next" },
  { id: "notes", title: "notes" },
];

const META: [string, string][] = [
  ["timeline", "TODO: weeks, month 2026"],
  ["tools", "TypeScript, Next.js, a cellular automaton, no libraries"],
  ["data", "City of Toronto traffic counts, Spadina Ave, 23 Apr 2025"],
  ["code", "TODO: github.com/Arya-P05/green-wave"],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-4 scroll-mt-4">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <div className="grid gap-x-4 px-1 py-4 md:grid-cols-[18ch_minmax(0,1fr)] md:px-4">
      <nav aria-label="contents" className="hidden md:block">
        <div className="sticky top-4">
          <Toc entries={SECTIONS} />
        </div>
      </nav>

      <article className="max-w-[96ch]">
        <header>
          <h1>green wave</h1>
          <p className="text-muted">project, 2026</p>
          <dl className="mt-2 grid grid-cols-[10ch_minmax(0,1fr)]">
            {META.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <Todo>overview: two or three sentences. can traffic lights that only look at their own queues produce a green wave on their own? the headline number goes here.</Todo>
        </header>

        <nav aria-label="contents" className="mt-2 md:hidden">
          <Toc entries={SECTIONS} />
        </nav>

        <Section id="question" title="the question">
          <Todo>the hook: hitting green after green down a street, and who makes that happen today (an engineer with a spreadsheet of offsets).</Todo>
          <Todo>the claim max-pressure makes, and why nobody tunes it for waves.</Todo>
        </Section>

        <Section id="background" title="how lights decide">
          <Todo>fixed-time: the same cycle forever. webster 1958: C = (1.5L + 5) / (1 - Y), greens split by demand.</Todo>
          <Todo>actuated: a detector before the stop line; hold the green while cars keep coming, end it on a gap.</Todo>
          <Todo>max-pressure (varaiya 2013): queue in minus queue out, serve the biggest difference. proven to keep any feasible demand stable, in a model with no amber.</Todo>
        </Section>

        <Section id="cliff" title="the cliff">
          <Todo>one intersection first. drag demand up and watch delay stay flat, then leave the page.</Todo>
          <Cliff />
          <Todo>what the curves say: where each controller hits the wall, and why max-pressure hits it first with a short minimum green.</Todo>
        </Section>

        <Section id="model" title="the model">
          <Todo>the road as 7.5 m cells, 1 s ticks, four rules per car per tick (nagel-schreckenberg 1992). why this is enough to get queues, platoons and shockwaves.</Todo>
          <Todo>what the model leaves out: turns, lanes, pedestrians, the streetcar, right turns on red.</Todo>
        </Section>

        <Section id="spadina" title="spadina">
          <Todo>why spadina: eight consecutive signals counted on the same day. the counts, the per-lane assumption.</Todo>
        </Section>

        <Section id="wave" title="the green wave">
          <Todo>how to read a time-space diagram: time runs right, the street runs up, every car is a line. a green wave is a band of parallel lines slipping through the greens.</Todo>
          <TimeSpace />
          <Todo>what each controller draws.</Todo>
        </Section>

        <Section id="results" title="results">
          <Todo>across the day.</Todo>
          <Todo>as the side streets get busier.</Todo>
          <Todo>max-pressure&apos;s one knob, the minimum green.</Todo>
        </Section>

        <Section id="takeaways" title="takeaways">
          <Todo>does max-pressure form waves? where it wins, where it loses.</Todo>
        </Section>

        <Section id="next" title="next">
          <Todo>what did the light learn? train a controller by trial and error and see if it reinvents max-pressure.</Todo>
        </Section>

        <Section id="notes" title="notes">
          <Todo>methods: seeds, warm-up, what band score and platoon ratio mean, links to the code.</Todo>
          <p className="text-muted">
            Traffic counts: City of Toronto,{" "}
            <a href="https://open.toronto.ca/dataset/traffic-volumes-at-intersections-for-all-modes/">
              Traffic Volumes at Intersections for All Modes
            </a>
            . Contains information licensed under the{" "}
            <a href="https://open.toronto.ca/open-data-licence/">Open Government Licence – Toronto</a>.
          </p>
        </Section>
      </article>
    </div>
  );
}
