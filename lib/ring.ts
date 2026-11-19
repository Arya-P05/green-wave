import { CELL_M } from "./sim/model.ts";
import { Sim } from "./sim/sim.ts";

/** A ring road: one link that leads back into itself, no lights, no way in or out. */
export const RING_CELLS = 120; // 900 m around

export const ringKmh = (cellsPerS: number) => cellsPerS * CELL_M * 3.6;

/** The ring with `cars` cars spaced evenly, all standing still. */
export function ring(cars: number, seed = 1): Sim {
  const sim = new Sim(
    { links: [{ length: RING_CELLS, next: 0, signal: null, demand: 0, corridor: null }], nodes: [] },
    { name: "none", choose: () => 0 },
    { seed },
  );
  for (let i = 0; i < cars; i++) {
    const cell = Math.floor((i * RING_CELLS) / cars);
    sim.cells[0][cell] = { id: i, v: 0, born: 0, origin: 0, stops: 0, moving: false, path: null };
  }
  return sim;
}

/** Average speed of the cars on the ring right now, cells per second. */
export function meanSpeed(sim: Sim): number {
  const cars = sim.onRoad();
  return cars.length ? cars.reduce((a, c) => a + c.v, 0) / cars.length : 0;
}
