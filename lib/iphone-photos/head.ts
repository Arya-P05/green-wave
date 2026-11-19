/**
 * A plain clay head, drawn by ray marching a signed distance field: for every
 * point in space, a function says how far it is from the nearest surface.
 * The camera looks straight at the face (no perspective), so the geometry is
 * worked out once and only the lighting is redone when the light moves.
 *
 * Coordinates: x to the viewer's right, y up, z toward the camera. The head
 * is about 2 units tall.
 */

type V = [number, number, number];

const len = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

/** Distance to an ellipsoid (a close bound, which is all ray marching needs). */
function ellipsoid(x: number, y: number, z: number, rx: number, ry: number, rz: number) {
  const k0 = len(x / rx, y / ry, z / rz);
  const k1 = len(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return (k0 * (k0 - 1)) / k1;
}

/** Union that melts two shapes together over a distance k. */
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}

/** Carve b out of a, softly. */
function ssub(a: number, b: number, k: number) {
  return -smin(-a, b, k);
}

/** The head: skull, jaw, cheeks, brow, nose, eye sockets and eyes, lips, ears, neck, shoulders. */
export function sdf(x: number, y: number, z: number): number {
  const ax = Math.abs(x); // the face is symmetric
  let d = ellipsoid(x, y - 0.06, z, 0.75, 0.84, 0.84);
  d = smin(d, ellipsoid(x, y + 0.42, z - 0.1, 0.52, 0.46, 0.62), 0.22);
  d = smin(d, ellipsoid(ax - 0.34, y + 0.14, z - 0.52, 0.22, 0.2, 0.2), 0.16);
  d = smin(d, ellipsoid(x, y - 0.2, z - 0.66, 0.46, 0.07, 0.1), 0.12);
  d = ssub(d, ellipsoid(ax - 0.26, y - 0.08, z - 0.78, 0.13, 0.07, 0.1), 0.08);
  d = smin(d, len(ax - 0.26, y - 0.08, z - 0.63) - 0.08, 0.03);
  d = smin(d, ellipsoid(x, y + 0.12, z - 0.78, 0.09, 0.19, 0.13), 0.08);
  d = smin(d, len(x, y + 0.26, z - 0.86) - 0.075, 0.06);
  d = smin(d, ellipsoid(x, y + 0.48, z - 0.74, 0.17, 0.05, 0.07), 0.06);
  d = smin(d, ellipsoid(ax - 0.73, y - 0.02, z - 0.02, 0.07, 0.19, 0.12), 0.06);
  const neck = Math.max(Math.hypot(x, z) - 0.38, Math.abs(y + 1.1) - 0.5);
  d = smin(d, neck, 0.15);
  d = smin(d, ellipsoid(x, y + 1.6, z, 1.35, 0.38, 0.5), 0.2);
  return d;
}

/** The part of the world the picture shows. */
export const VIEW = { x0: -1.25, x1: 1.25, y0: -1.55, y1: 1.15 };

export type Geometry = {
  w: number;
  h: number;
  /** Per pixel: hit point (xyz) and surface normal (xyz); NaN where the ray missed. */
  pos: Float32Array;
  nrm: Float32Array;
};

/** March a ray from in front of the face, straight back, for every pixel. */
export function geometry(w: number, h: number): Geometry {
  const pos = new Float32Array(w * h * 3).fill(NaN);
  const nrm = new Float32Array(w * h * 3).fill(NaN);
  const e = 0.002;
  for (let j = 0; j < h; j++) {
    const y = VIEW.y1 - ((j + 0.5) / h) * (VIEW.y1 - VIEW.y0);
    for (let i = 0; i < w; i++) {
      const x = VIEW.x0 + ((i + 0.5) / w) * (VIEW.x1 - VIEW.x0);
      let z = 2;
      let hit = false;
      for (let s = 0; s < 80 && z > -1.5; s++) {
        const d = sdf(x, y, z);
        if (d < 0.001) {
          hit = true;
          break;
        }
        z -= d;
      }
      if (!hit) continue;
      const k = (j * w + i) * 3;
      pos[k] = x;
      pos[k + 1] = y;
      pos[k + 2] = z;
      // Normal from the field's slope (tetrahedron of four samples).
      const a = sdf(x + e, y - e, z - e);
      const b = sdf(x - e, y - e, z + e);
      const c = sdf(x - e, y + e, z - e);
      const f = sdf(x + e, y + e, z + e);
      const nx = a - b - c + f;
      const ny = -a - b + c + f;
      const nz = -a + b - c + f;
      const l = len(nx, ny, nz);
      nrm[k] = nx / l;
      nrm[k + 1] = ny / l;
      nrm[k + 2] = nz / l;
    }
  }
  return { w, h, pos, nrm };
}

export type Light = {
  /** Around the head, seen from above: 0 = from the camera, 90 = from the viewer's right, 180 = from behind. */
  azimuth: number;
  /** Up or down: 0 = level with the face, 90 = straight overhead, negative = from below. */
  elevation: number;
  /** 0 = a tiny, hard source like the midday sun; 1 = a big, soft one like a window or a cloudy sky. */
  size: number;
};

/** Unit vector pointing from the face toward the light. */
export function direction({ azimuth, elevation }: Light): V {
  const a = (azimuth * Math.PI) / 180;
  const e = (elevation * Math.PI) / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
}

/**
 * How bright each pixel is, 0–1, plus the background. A big light wraps
 * around the curve of the face and casts shadows with soft edges; a small one
 * stops dead at the edge of its shadow.
 */
export function shade(g: Geometry, light: Light, out: Float32Array): number {
  const [lx, ly, lz] = direction(light);
  const wrap = light.size * 0.6;
  // Smaller k = softer shadow edges (the penumbra trick for distance fields).
  const k = 28 - light.size * 25;
  const ambient = 0.06 + 0.06 * light.size;
  // From behind, light skims the edges of the face (the rim you see in backlit photos).
  const behind = Math.max(0, -lz);
  const n = g.w * g.h;
  for (let p = 0; p < n; p++) {
    const q = p * 3;
    const x = g.pos[q];
    if (Number.isNaN(x)) {
      out[p] = -1;
      continue;
    }
    const nx = g.nrm[q];
    const ny = g.nrm[q + 1];
    const nz = g.nrm[q + 2];
    const dot = nx * lx + ny * ly + nz * lz;
    const dif = Math.max(0, (dot + wrap) / (1 + wrap));
    let sh = 1;
    if (dif > 0) {
      const ox = x + nx * 0.01;
      const oy = g.pos[q + 1] + ny * 0.01;
      const oz = g.pos[q + 2] + nz * 0.01;
      let t = 0.02;
      for (let s = 0; s < 36 && t < 3; s++) {
        const d = sdf(ox + lx * t, oy + ly * t, oz + lz * t);
        if (d < 0.0005) {
          sh = 0;
          break;
        }
        sh = Math.min(sh, (k * d) / t);
        t += Math.max(d, 0.02);
      }
      sh = Math.max(0, Math.min(1, sh));
      sh = sh * sh * (3 - 2 * sh);
    }
    // Some light always bounces in from the sky above and the ground below.
    const fill = ambient + 0.07 * (0.5 + 0.5 * ny);
    const rim = behind * Math.pow(1 - Math.max(0, nz), 4) * 0.7;
    out[p] = Math.min(1, fill + 0.95 * dif * sh + rim);
  }
  // The backdrop: behind a backlit face you're looking toward the light, so it's bright.
  const toward = Math.max(0, -lz);
  return Math.min(1, 0.6 + 0.4 * toward);
}
