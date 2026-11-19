/**
 * Why close photos change faces: a pinhole camera shrinks everything by its
 * distance, so the parts of a face nearer the lens come out bigger than the
 * parts further back. This is the geometry from Ward et al. (2018), "The
 * Selfie Effect": the face as flat layers at different depths, each scaled by
 * one over its distance from the camera.
 *
 * Units are millimetres. Distance is measured from the camera to the tip of
 * the nose, and depths are measured backwards from there.
 */

/** Depth of the layer the picture is scaled to keep the same size: the cheekbones' width (bizygomatic breadth). */
export const CHEEK = 90;

/** How big a layer `z` mm behind the nose looks, next to the cheekbones, from `d` mm away. 1 = true to life. */
export function scaleAt(d: number, z: number): number {
  return (d + CHEEK) / (d + z);
}

/** How much wider the nose looks next to the cheekbones than from very far away (1.3 = 30% wider). */
export function noseGain(d: number): number {
  return scaleAt(d, 0);
}

/** How tall a slice of the world fills a portrait-orientation frame: head and shoulders. */
export const FRAME_H = 500;

/** A 35 mm-equivalent lens covers 36 mm of "sensor" along a portrait frame's long side. */
const SENSOR_LONG = 36;

/** How far back a lens of this 35 mm-equivalent focal length puts you to fit head and shoulders. */
export function distanceFor(focal: number): number {
  return (focal * FRAME_H) / SENSOR_LONG;
}

/** The lens that fits head and shoulders from this far back (inverse of distanceFor). */
export function focalFor(d: number): number {
  return (d * SENSOR_LONG) / FRAME_H;
}

/** iPhone 17's three back cameras as Apple lists them (35 mm equivalents). */
export const LENSES = [
  { key: "0.5x", focal: 13 },
  { key: "1x", focal: 26 },
  { key: "2x", focal: 52 },
] as const;

/** Ward et al.'s two distances: a selfie at arm's length (12 in) and a normal portrait (5 ft). */
export const SELFIE = 304.8;
export const PORTRAIT = 1524;

export type P3 = { x: number; y: number; z: number };

/** Where a point lands in the picture, in mm at the cheekbone layer's scale. */
export function project(p: P3, d: number): { x: number; y: number } {
  const s = scaleAt(d, p.z);
  return { x: p.x * s, y: p.y * s };
}
