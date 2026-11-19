import { ALL_RED_S, AMBER_S, FREE_SPEED, P_SLOW, VMAX } from "./model.ts";
import type { Aspect, Network } from "./model.ts";
import { rng } from "./random.ts";

export type Vehicle = {
  id: number;
  v: number;
  born: number; // tick it arrived at the network edge
  origin: number; // entry link
  stops: number;
  /** Has the car been at full speed since its last stop? Creeping forward in a queue is not a new stop. */
  moving: boolean;
  /** Corridor positions per tick, when recording: [t, x, t, x, ...]. */
  path: number[] | null;
};

export type Trip = {
  origin: number;
  exit: number;
  born: number;
  done: number;
  stops: number;
  path: number[] | null;
};

type Stage = "green" | "amber" | "allred";

export type NodeState = {
  phase: number; // the phase that has (or last had) green
  stage: Stage;
  since: number; // tick the current stage began
  target: number; // the phase that gets green after clearance
};

/**
 * A controller decides, every tick, which phase each intersection should be
 * showing. Asking for a different phase starts the clearance (amber, all-red);
 * the sim owns that part so every controller pays the same switching cost.
 */
export type Controller = {
  name: string;
  choose(sim: Sim, node: number, t: number): number;
};

export type SimOptions = {
  seed: number;
  /** Ticks before measuring starts, so the road fills to a steady state. */
  warmup?: number;
  /** Keep every main-street car's trajectory and every signal's aspect. */
  record?: boolean;
};

export class Sim {
  readonly net: Network;
  /** Swappable mid-run, so a figure can change controller without losing its queues. */
  controller: Controller;
  t = 0;
  cells: (Vehicle | null)[][];
  /** Cars waiting to get onto each entry link (outside the network). */
  waiting: Vehicle[][];
  nodes: NodeState[];
  trips: Trip[] = [];
  /** Vehicle-seconds lost against driving at free speed, after warmup. */
  delay = 0;
  /** Cars that arrived after warmup. */
  arrivals = 0;
  /** Main-phase aspect per node per tick, when recording. */
  aspects: Aspect[][] | null;

  private random: () => number;
  private nextId = 0;
  private warmup: number;
  private record: boolean;

  constructor(net: Network, controller: Controller, options: SimOptions) {
    this.net = net;
    this.controller = controller;
    this.random = rng(options.seed);
    this.warmup = options.warmup ?? 0;
    this.record = options.record ?? false;
    this.cells = net.links.map((l) => new Array(l.length).fill(null));
    this.waiting = net.links.map(() => []);
    this.nodes = net.nodes.map(() => ({ phase: 0, stage: "green", since: 0, target: 0 }));
    this.aspects = this.record ? net.nodes.map(() => []) : null;
  }

  /** What a car at the end of this link sees. */
  aspect(link: number): Aspect {
    const signal = this.net.links[link].signal;
    if (!signal) return "green";
    const node = this.nodes[signal.node];
    if (node.phase !== signal.phase) return "red";
    return node.stage === "green" ? "green" : node.stage === "amber" ? "amber" : "red";
  }

  /** Seconds the current phase has been green (0 during clearance). */
  greenFor(node: number): number {
    const s = this.nodes[node];
    return s.stage === "green" ? this.t - s.since : 0;
  }

  /** Cars on a link, plus any queued outside it waiting to enter. */
  count(link: number): number {
    let n = this.waiting[link].length;
    for (const c of this.cells[link]) if (c) n++;
    return n;
  }

  /** Cars standing still on a link, plus any queued outside it waiting to enter. */
  queue(link: number): number {
    let n = this.waiting[link].length;
    for (const c of this.cells[link]) if (c && c.v === 0) n++;
    return n;
  }

  /** Every car currently on the road, in no particular order. */
  onRoad(): Vehicle[] {
    return this.cells.flatMap((row) => row.filter((c): c is Vehicle => c !== null));
  }

  /** Is any car within the last `cells` cells before the stop line? */
  detects(link: number, cells: number): boolean {
    const row = this.cells[link];
    for (let i = Math.max(0, row.length - cells); i < row.length; i++) if (row[i]) return true;
    return false;
  }

  step(): void {
    this.signals();
    this.drive();
    this.arrive();
    this.t++;
  }

  run(ticks: number): this {
    for (let i = 0; i < ticks; i++) this.step();
    return this;
  }

  private signals(): void {
    this.nodes.forEach((s, node) => {
      const elapsed = this.t - s.since;
      if (s.stage === "green") {
        const want = this.controller.choose(this, node, this.t);
        if (want !== s.phase) Object.assign(s, { stage: "amber", since: this.t, target: want });
      } else if (s.stage === "amber" && elapsed >= AMBER_S) {
        Object.assign(s, { stage: "allred", since: this.t });
      } else if (s.stage === "allred" && elapsed >= ALL_RED_S) {
        Object.assign(s, { stage: "green", since: this.t, phase: s.target });
      }
    });
    if (this.aspects) {
      this.net.nodes.forEach((n, i) => this.aspects![i].push(this.aspect(n.phases[0][0])));
    }
  }

  /** One Nagel-Schreckenberg update: accelerate, brake to the gap, dawdle, move. */
  private drive(): void {
    const { links } = this.net;
    const measuring = this.t >= this.warmup;

    // Gaps are read from positions at the start of the tick (parallel update).
    const speeds = this.cells.map((row, l) => {
      const out = new Array<number>(row.length).fill(0);
      let ahead = this.room(l);
      for (let p = row.length - 1; p >= 0; p--) {
        const car = row[p];
        if (!car) {
          ahead++;
          continue;
        }
        let v = Math.min(car.v + 1, VMAX, ahead);
        if (v > 0 && this.random() < P_SLOW) v--;
        out[p] = v;
        ahead = 0;
      }
      return out;
    });

    const next = links.map((l) => new Array<Vehicle | null>(l.length).fill(null));
    this.cells.forEach((row, l) => {
      row.forEach((car, p) => {
        if (!car) return;
        const v = speeds[l][p];
        if (v === 0 && car.moving) car.stops++;
        if (v === 0) car.moving = false;
        if (v === VMAX) car.moving = true;
        car.v = v;
        if (measuring) this.delay += 1 - v / FREE_SPEED;

        let link = l;
        let pos = p + v;
        if (pos >= links[l].length) {
          pos -= links[l].length;
          const to = links[l].next;
          if (to === null) {
            this.finish(car, l);
            return;
          }
          link = to;
        }
        next[link][pos] = car;
        this.trace(car, link, pos);
      });
    });
    this.cells = next;
    if (measuring) for (const q of this.waiting) this.delay += q.length;
  }

  /** Empty cells a car at the very end of `link` could still drive into this tick. */
  private room(link: number): number {
    const l = this.net.links[link];
    if (this.aspect(link) !== "green") return 0;
    if (l.next === null) return VMAX;
    const row = this.cells[l.next];
    const first = row.findIndex((c) => c !== null);
    return first === -1 ? row.length : first;
  }

  private arrive(): void {
    const measuring = this.t >= this.warmup;
    this.net.links.forEach((l, link) => {
      if (l.demand > 0 && this.random() < l.demand) {
        this.waiting[link].push({
          id: this.nextId++,
          v: VMAX,
          born: this.t,
          origin: link,
          stops: 0,
          moving: true,
          path: this.record && l.corridor ? [] : null,
        });
        if (measuring) this.arrivals++;
      }
      const q = this.waiting[link];
      if (q.length > 0 && this.cells[link][0] === null) {
        const car = q.shift()!;
        this.cells[link][0] = car;
        this.trace(car, link, 0);
      }
    });
  }

  private trace(car: Vehicle, link: number, pos: number): void {
    const c = this.net.links[link].corridor;
    if (car.path && c) car.path.push(this.t, c.x0 + c.dir * pos);
  }

  private finish(car: Vehicle, exit: number): void {
    this.trips.push({
      origin: car.origin,
      exit,
      born: car.born,
      done: this.t,
      stops: car.stops,
      path: car.path,
    });
  }
}
