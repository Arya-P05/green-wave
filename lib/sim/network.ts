import type { Link, Network, Node } from "./model.ts";

export type CorridorSpec = {
  /** Cells between consecutive lights (length = lights - 1). */
  spacing: number[];
  /** Cells of road before the first light and after the last one. */
  approach: number;
  /** Cells of each side-street arm. */
  arm: number;
  /** Cars per second entering the main street at each end. */
  northbound: number;
  southbound: number;
  /** Cars per second entering from each side street, per light. */
  cross: { eastbound: number; westbound: number }[];
};

/** Link indices for the corridor, so callers can find entries and exits. */
export type CorridorIndex = {
  northbound: number[]; // entry ... exit, in driving order
  southbound: number[];
  cross: { eastbound: [number, number]; westbound: [number, number] }[];
};

/** Phase 0 is the main street (both directions), phase 1 the side street. */
export const MAIN = 0;
export const SIDE = 1;

/**
 * A two-way main street with N signalized intersections. Each side street is a
 * one-lane arm in each direction that crosses the main street and leaves.
 * Every car drives straight through: there are no turns.
 */
export function corridor(spec: CorridorSpec): { network: Network; index: CorridorIndex } {
  const n = spec.spacing.length + 1;
  const xs = [spec.approach];
  for (const s of spec.spacing) xs.push(xs[xs.length - 1] + s);
  const end = xs[n - 1] + spec.approach;

  const links: Link[] = [];
  const add = (link: Link) => links.push(link) - 1;

  // Main street, both directions: one link per stretch between lights.
  const chain = (marks: number[], dir: 1 | -1, demand: number) => {
    const ids: number[] = [];
    for (let i = 0; i < marks.length - 1; i++) {
      const node = i < n ? (dir === 1 ? i : n - 1 - i) : -1;
      ids.push(
        add({
          length: Math.abs(marks[i + 1] - marks[i]),
          next: null,
          signal: i < n ? { node, phase: MAIN } : null,
          demand: i === 0 ? demand : 0,
          corridor: { x0: marks[i], dir },
        }),
      );
    }
    for (let i = 0; i < ids.length - 1; i++) links[ids[i]].next = ids[i + 1];
    return ids;
  };
  const northbound = chain([0, ...xs, end], 1, spec.northbound);
  const southbound = chain([end, ...[...xs].reverse(), 0], -1, spec.southbound);

  const cross = spec.cross.map((c, node) => {
    const arm = (demand: number): [number, number] => {
      const out = add({ length: spec.arm, next: null, signal: null, demand: 0, corridor: null });
      const into = add({
        length: spec.arm,
        next: out,
        signal: { node, phase: SIDE },
        demand,
        corridor: null,
      });
      return [into, out];
    };
    return { eastbound: arm(c.eastbound), westbound: arm(c.westbound) };
  });

  const nodes: Node[] = xs.map((x, i) => ({
    x,
    phases: [
      [northbound[i], southbound[n - 1 - i]],
      [cross[i].eastbound[0], cross[i].westbound[0]],
    ],
  }));

  return { network: { links, nodes }, index: { northbound, southbound, cross } };
}
