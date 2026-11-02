/**
 * The building blocks for code-built 3D furniture models.
 *
 * Models are written in INCHES in a local frame: x = width (right as you face
 * the front), y = up from the piece's mount point, z = depth with the FRONT
 * toward +z, origin at the center of the footprint. A model is a list of parts.
 */
import type { FurnitureDef } from '../../engine/types';

/** What a part is made of. Decides roughness / shine, not color. */
export type Mat = 'wood' | 'fabric' | 'leather' | 'metal' | 'chrome' | 'plastic' | 'gloss' | 'screen' | 'glass' | 'glow' | 'ceramic' | 'stone' | 'paper' | 'plant' | 'rubber';

export interface Part {
  /**
   * box: plain box. rbox: rounded box (`r` = corner radius). cyl: cylinder or
   * cone (`taper` = top radius / bottom radius). sph: sphere / ellipsoid.
   * torus: ring lying flat (`tube` = tube thickness as a fraction of size).
   */
  k: 'box' | 'rbox' | 'cyl' | 'sph' | 'torus';
  /** Center x / z, and BOTTOM y (spheres and tori: center y), inches. */
  x: number;
  y: number;
  z: number;
  /** Size in inches (cylinders/spheres/tori: diameter x, height, diameter z). */
  sx: number;
  sy: number;
  sz: number;
  c: string;
  m?: Mat;
  r?: number;
  taper?: number;
  tube?: number;
  /** Rotation in radians [x, y, z] about the part's own center. */
  rot?: [number, number, number];
  /** The part a chosen color applies to (e.g. a bed's duvet). Without any, the biggest fabric (or wood) color is used. */
  main?: boolean;
}

export type ModelFn = (def: FurnitureDef, w: number, d: number, h: number) => Part[] | null;

// ---------------------------------------------------------------------------
// Palette (neutral; the lighting pass will make these sing)

export const C = {
  wood: '#9a7352',
  woodDark: '#5e4431',
  woodLight: '#c9a982',
  oak: '#b48a5e',
  walnut: '#6b4a33',
  fabric: '#7c838d',
  fabricDark: '#4f555e',
  fabricWarm: '#9a8f82',
  linen: '#ebe6dc',
  duvet: '#dfe3e8',
  pillow: '#f6f3ee',
  white: '#eeede9',
  offwhite: '#e4e1da',
  stone: '#d8d4cc',
  metal: '#a3a8ae',
  steel: '#c9cdd2',
  chrome: '#d9dde2',
  black: '#1f2023',
  charcoal: '#2c2e33',
  graphite: '#3a3d43',
  screen: '#0b0d12',
  felt: '#2e6a46',
  green: '#4f7d46',
  greenDark: '#3a6235',
  pot: '#b4694b',
  red: '#a83c3c',
  brass: '#c8a64a',
};

/** A stable "random" pick from a list, so books and art keep their colors. */
export function pick<T>(list: T[], seed: string, n = 0): T {
  let h = n * 97 + 7;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}
export const ART = ['#c45a4a', '#3f6e8c', '#d9a441', '#5a8f6b', '#8a5aa3', '#e07b39', '#2f4858'];
export const BOOKS = ['#7a3b3b', '#3b5a7a', '#a88b4a', '#4a6b4a', '#5b4a7a', '#8c8c8c', '#b5653d', '#2f2f35', '#d9cfb8'];

type Extra = Partial<Omit<Part, 'k' | 'x' | 'y' | 'z' | 'sx' | 'sy' | 'sz' | 'c'>>;

export const box = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: string, e: Extra = {}): Part => ({ k: 'box', x, y, z, sx, sy, sz, c, ...e });
/** Rounded box; `r` defaults to a soft 1". */
export const rbox = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: string, e: Extra = {}): Part => ({ k: 'rbox', x, y, z, sx, sy, sz, c, r: 1, ...e });
export const cyl = (x: number, y: number, z: number, dx: number, sy: number, dz: number, c: string, e: Extra = {}): Part => ({ k: 'cyl', x, y, z, sx: dx, sy, sz: dz, c, ...e });
export const sph = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: string, e: Extra = {}): Part => ({ k: 'sph', x, y, z, sx, sy, sz, c, ...e });
export const torus = (x: number, y: number, z: number, dx: number, sy: number, dz: number, c: string, e: Extra = {}): Part => ({ k: 'torus', x, y, z, sx: dx, sy, sz: dz, c, tube: 0.25, ...e });

/** Four legs inside a w x d footprint (centered at cx, cz). */
export function legs(w: number, d: number, h: number, t = 1.6, c = C.woodDark, inset = 1.5, cx = 0, cz = 0, e: Extra = {}): Part[] {
  const xs = [-w / 2 + inset + t / 2, w / 2 - inset - t / 2];
  const zs = [-d / 2 + inset + t / 2, d / 2 - inset - t / 2];
  return xs.flatMap((x) => zs.map((z) => box(cx + x, 0, cz + z, t, h, t, c, { m: 'wood', ...e })));
}

/** Round tapered legs, splayed slightly (mid-century style). */
export function roundLegs(w: number, d: number, h: number, dia = 1.6, c = C.walnut, inset = 2.5, cx = 0, cz = 0): Part[] {
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  return xs.flatMap((x) => zs.map((z) => cyl(cx + x, 0, cz + z, dia * 0.7, h, dia * 0.7, c, { m: 'wood', taper: 1.4 })));
}

/** A five-star rolling base (office chairs), with casters. */
export function starBase(reach: number, y = 1, c = C.black): Part[] {
  const out: Part[] = [cyl(0, y + 1, 0, 3.5, 2.5, 3.5, c, { m: 'plastic' })];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const len = reach / 2;
    out.push(rbox(Math.cos(a) * (len / 2), y + 1, Math.sin(a) * (len / 2), len, 1.5, 2, c, { m: 'plastic', r: 0.6, rot: [0, -a, 0] }));
    out.push(sph(Math.cos(a) * (len - 0.5), y, Math.sin(a) * (len - 0.5), 2, 2, 2, C.charcoal, { m: 'rubber' }));
  }
  return out;
}

/** Books standing on a shelf between x0 and x1 at height y, depth d. */
export function bookRow(x0: number, x1: number, y: number, z: number, d: number, maxH: number, seed: string, fill = 0.75): Part[] {
  const out: Part[] = [];
  let x = x0;
  let i = 0;
  const end = x0 + (x1 - x0) * fill;
  while (x < end - 0.6) {
    const t = 0.7 + ((i * 37) % 10) / 10; // thickness 0.7"-1.6"
    const hh = Math.min(maxH, maxH * (0.72 + (((i * 53) % 10) / 10) * 0.28));
    out.push(box(x + t / 2, y, z, t - 0.06, hh, d * (0.78 + ((i * 17) % 4) * 0.05), pick(BOOKS, seed, i), { m: 'paper' }));
    x += t;
    i++;
  }
  return out;
}
