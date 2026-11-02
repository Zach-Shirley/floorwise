/**
 * Bedroom models: beds, bunks and lofts, crib, nightstands, dressers,
 * wardrobes, mirrors, the clothing rack and the hamper. Return parts for the
 * pieces this file handles, or null to fall through. See ./kit.ts.
 */
import type { FurnitureDef } from '../../engine/types';
import { C, box, cyl, rbox, roundLegs, torus, type ModelFn, type Part } from './kit';

const HEADBOARD = '#8d8478';
const SHEET = '#f3f1ec';
const HANDLE = '#b9bcc0';

/** A horizontal rod along x (centered at x, y, z). */
const rodX = (x: number, y: number, z: number, len: number, dia: number, c: string, m: Part['m'] = 'metal'): Part =>
  cyl(x, y - len / 2, z, dia, len, dia, c, { m, rot: [0, 0, Math.PI / 2] });
/** A horizontal rod along z (centered at x, y, z). */
const rodZ = (x: number, y: number, z: number, len: number, dia: number, c: string, m: Part['m'] = 'wood'): Part =>
  cyl(x, y - len / 2, z, dia, len, dia, c, { m, rot: [Math.PI / 2, 0, 0] });

/** Mattress + duvet + pillows on a sleeping surface at height y0, inside w x d starting `back` inches from the rear. */
function bedding(w: number, d: number, y0: number, top: number, back: number, seed: string, opts: { duvet?: boolean; pillows?: number } = {}): Part[] {
  const out: Part[] = [];
  const mw = w - 2,
    md = d - back - 1,
    mz = -d / 2 + back + md / 2;
  out.push(rbox(0, y0, mz, mw, top - y0, md, C.linen, { m: 'fabric', r: Math.min(3, (top - y0) / 2.2) }));
  const pillowZ = -d / 2 + back + 9;
  if (opts.duvet !== false) {
    // duvet: drapes over the sides and foot, turned down near the pillows
    const dz0 = -d / 2 + back + Math.min(24, md * 0.3);
    const dz1 = d / 2 - 0.3;
    const drop = Math.min(top - y0 - 2, 9);
    out.push(rbox(0, top - drop, (dz0 + dz1) / 2, Math.min(w, mw + 1.4), drop + 1.6, dz1 - dz0, C.duvet, { m: 'fabric', r: 2.2, main: true }));
    out.push(rbox(0, top + 0.2, dz0 + 4, mw + 0.6, 2.4, 9, SHEET, { m: 'fabric', r: 1.1 })); // turned-down fold
    out.push(rbox(0, top - drop + 1, dz1 - 9, Math.min(w, mw + 1.6), drop + 1.2, 12, '#c7ccd3', { m: 'fabric', r: 2 })); // throw at the foot
  }
  const n = opts.pillows ?? (w > 66 ? 3 : w > 48 ? 2 : 1);
  const pw = n === 3 ? (mw - 4) / 2 - 1 : (mw - 6) / n - 1;
  const xs = n === 3 ? [-pw / 2 - 1, pw / 2 + 1] : Array.from({ length: n }, (_, i) => -mw / 2 + 3 + pw / 2 + i * (pw + 1));
  for (const x of xs) {
    out.push(rbox(x, top - 0.8, pillowZ, pw - 1.5, 7.5, 17, C.pillow, { m: 'fabric', r: 2.6, rot: [-0.18, 0, 0] }));
    out.push(rbox(x, top + 1.2, pillowZ + 1, pw - 6, 4.5, 11, C.pillow, { m: 'fabric', r: 2.2, rot: [-0.18, 0, 0] })); // plump middle
  }
  if (n >= 2) out.push(rbox(0, top + 0.4, pillowZ + 8, Math.min(20, mw * 0.3), 9, 4, seed.includes('king') ? '#7a8a78' : '#a8826a', { m: 'fabric', r: 2, rot: [-0.25, 0, 0] }));
  return out;
}

function bed(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'daybed') {
    const out: Part[] = [
      ...roundLegs(w, d, 4, 2, C.walnut, 3),
      rbox(0, 4, 0, w, 7, d, C.wood, { m: 'wood', r: 0.8 }),
      // the back runs along the long left side, low arms at both ends; open on the right
      rbox(-w / 2 + 1.5, 11, 0, 3, h - 11, d, C.woodLight, { m: 'wood', r: 1 }),
      rbox(0, 11, -d / 2 + 1.5, w, h - 17, 3, C.woodLight, { m: 'wood', r: 1 }),
      rbox(0, 11, d / 2 - 1.5, w, h - 17, 3, C.woodLight, { m: 'wood', r: 1 }),
      rbox(1.5, 11, 0, w - 4, 8, d - 7, C.linen, { m: 'fabric', r: 2.5 }),
      rbox(1.5, 18.5, 0, w - 3.6, 1.4, d - 8, '#b8bfc8', { m: 'fabric', r: 0.6 }),
    ];
    for (let i = 0; i < 3; i++) out.push(rbox(-w / 2 + 7, 19, -d / 2 + 16 + i * ((d - 32) / 2), 6, 14, 20, i === 1 ? '#a8826a' : C.pillow, { m: 'fabric', r: 2.5, rot: [0, 0, -0.3] }));
    return out;
  }
  const out: Part[] = [];
  // legs + platform frame
  out.push(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cyl((sx * (w - 6)) / 2, 0, (sz * (d - 6)) / 2, 2.4, 4, 2.4, C.walnut, { m: 'wood', taper: 0.75 }))));
  out.push(rbox(0, 4, 1.5, w, 8, d - 3, C.wood, { m: 'wood', r: 0.8 }));
  out.push(box(0, 11.6, 1.5, w - 2.4, 0.6, d - 5, C.woodDark, { m: 'wood' }));
  // upholstered headboard with channel tufting
  const hbTop = h + 20;
  out.push(rbox(0, 2, -d / 2 + 1.75, w, hbTop - 2, 3.5, HEADBOARD, { m: 'fabric', r: 1.6 }));
  const ch = Math.max(3, Math.round(w / 12));
  for (let i = 0; i < ch; i++) {
    const cw = (w - 3) / ch;
    out.push(rbox(-w / 2 + 1.5 + cw / 2 + i * cw, 13, -d / 2 + 3.4, cw - 0.7, hbTop - 15, 1.2, HEADBOARD, { m: 'fabric', r: 0.55 }));
  }
  out.push(...bedding(w, d, 12, h, 4, def.id));
  return out;
}

function bunkOrLoft(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const out: Part[] = [];
  const post = 3;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(rbox((sx * (w - post)) / 2, 0, (sz * (d - post)) / 2, post, h, post, C.woodLight, { m: 'wood', r: 0.5 }));
  const levels = def.symbol === 'bunk' ? [8, 44] : [def.clearUnder ?? 56];
  for (const y of levels) {
    out.push(rbox(0, y, 0, w - 1, 4, d - 1, C.woodLight, { m: 'wood', r: 0.6 })); // side rails / slat deck
    out.push(...bedding(w - 2, d - 6, y + 4, y + 11, 0, def.id, { pillows: w > 48 ? 2 : 1 }).map((p) => ({ ...p, z: p.z })));
    // head and foot panels
    for (const sz of [-1, 1]) out.push(rbox(0, y + 4, (sz * (d - post)) / 2, w - post * 2, 10, 1.5, C.woodLight, { m: 'wood', r: 0.5 }));
  }
  // guard rails on the top level, with a gap for the ladder near the foot
  const top = levels[levels.length - 1];
  const ladderZ = d / 2 - 14;
  for (const sx of [-1, 1]) {
    const x = (sx * (w - 1.5)) / 2;
    if (sx === 1) {
      out.push(rodZ(x, top + 15, -d / 2 + post + (d - post * 2 - 22) / 2, d - post * 2 - 22, 1.5, C.woodLight));
    } else out.push(rodZ(x, top + 15, 0, d - post * 2, 1.5, C.woodLight));
    out.push(rodZ(x, top + 9, sx === 1 ? -d / 2 + post + (d - post * 2 - 22) / 2 : 0, sx === 1 ? d - post * 2 - 22 : d - post * 2, 1.2, C.woodLight));
  }
  // ladder on the right side
  const lx = w / 2 + 0.5;
  for (const dz of [-8, 8]) out.push(rbox(lx - 1, 0, ladderZ + dz, 1.6, top + 6, 1.6, C.woodLight, { m: 'wood', r: 0.4 }));
  for (let y = 11; y < top + 2; y += 11) out.push(rodZ(lx - 1, y, ladderZ, 16, 1.2, C.wood));
  return out;
}

function crib(w: number, d: number, h: number): Part[] {
  const out: Part[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(rbox((sx * (w - 2)) / 2, 0, (sz * (d - 2)) / 2, 2, h, 2, C.white, { m: 'wood', r: 0.4 }));
  out.push(rbox(0, 10, 0, w - 2, 2, d - 2, C.white, { m: 'wood', r: 0.3 }));
  out.push(rbox(0, 12, 0, w - 3, 5, d - 3, C.linen, { m: 'fabric', r: 1.8 }));
  // top rails
  for (const sx of [-1, 1]) out.push(rbox((sx * (w - 2)) / 2, h - 2, 0, 1.8, 1.6, d - 2, C.white, { m: 'wood', r: 0.6 }));
  for (const sz of [-1, 1]) out.push(rbox(0, h - 2, (sz * (d - 2)) / 2, w - 2, 1.6, 1.8, C.white, { m: 'wood', r: 0.6 }));
  // slats
  const sh = h - 2 - 12;
  for (let z = -d / 2 + 4; z <= d / 2 - 4; z += 2.6) for (const sx of [-1, 1]) out.push(cyl((sx * (w - 2)) / 2, 12, z, 1, sh, 1, C.white, { m: 'wood' }));
  for (let x = -w / 2 + 4; x <= w / 2 - 4; x += 2.6) for (const sz of [-1, 1]) out.push(cyl(x, 12, (sz * (d - 2)) / 2, 1, sh, 1, C.white, { m: 'wood' }));
  return out;
}

/** Drawer fronts in a grid on the front face (z = front), with bar pulls. */
function drawers(x0: number, x1: number, y0: number, y1: number, front: number, rows: number, cols: number, face: string): Part[] {
  const out: Part[] = [];
  const gap = 0.35;
  const cw = (x1 - x0) / cols,
    rh = (y1 - y0) / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cx = x0 + cw * (c + 0.5),
        y = y0 + rh * r + gap / 2;
      out.push(rbox(cx, y, front - 0.4, cw - gap, rh - gap, 0.9, face, { m: 'wood', r: 0.25 }));
      const pull = Math.min(7, cw * 0.35);
      out.push(rbox(cx, y + rh / 2 - 0.5, front + 0.3, pull, 0.7, 0.7, HANDLE, { m: 'metal', r: 0.3 }));
    }
  return out;
}

function nightstand(w: number, d: number, h: number): Part[] {
  const legH = 6;
  const top = 1.2;
  const out: Part[] = [...roundLegs(w - 1, d - 1, legH + 0.5, 1.8, C.walnut, 2.2)];
  out.push(rbox(0, legH, -0.4, w - 1.2, h - legH - top, d - 1.6, C.wood, { m: 'wood', r: 0.5 }));
  out.push(rbox(0, h - top, 0, w, top, d, C.walnut, { m: 'wood', r: 0.45 }));
  const rows = h - legH - top > 14 ? 2 : 1;
  out.push(...drawers(-w / 2 + 1.4, w / 2 - 1.4, legH + 1, h - top - 0.8, d / 2 - 0.6, rows, 1, C.oak));
  return out;
}

function dresser(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const midCentury = def.id === 'dresser-low' || def.id === 'sideboard';
  const base = midCentury ? 6 : 3;
  const top = 1.2;
  const body = midCentury ? C.wood : C.oak;
  const out: Part[] = [];
  if (midCentury) out.push(...roundLegs(w - 2, d - 2, base + 0.5, 2, C.walnut, 3));
  else out.push(box(0, 0, -0.8, w - 3, base, d - 3, C.woodDark, { m: 'wood' }));
  out.push(rbox(0, base, -0.4, w - 1, h - base - top, d - 1.4, body, { m: 'wood', r: 0.5 }));
  out.push(rbox(0, h - top, 0, w, top, d, C.walnut, { m: 'wood', r: 0.45 }));
  const rows = Math.max(2, Math.round((h - base - top) / 9));
  const cols = w >= 48 && h <= 40 ? 2 : 1;
  out.push(...drawers(-w / 2 + 1.3, w / 2 - 1.3, base + 0.8, h - top - 0.6, d / 2 - 0.6, rows, cols, midCentury ? C.oak : C.woodLight));
  return out;
}

function cabinetDoors(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const wall = def.mount === 'wall';
  const plinth = wall ? 0 : 3;
  const crown = wall ? 0 : 2;
  const color = def.id === 'murphy-queen' ? C.offwhite : def.id === 'cabinet-storage' || def.id === 'wall-cabinet' ? C.white : C.woodLight;
  const trim = def.id === 'murphy-queen' || color === C.white ? C.offwhite : C.wood;
  const out: Part[] = [];
  if (plinth) out.push(box(0, 0, -0.8, w - 2.4, plinth, d - 2.4, C.woodDark, { m: 'wood' }));
  const caseTop = def.id === 'hutch' ? 34 : h - crown;
  out.push(rbox(0, plinth, -0.5, w - 1.2, caseTop - plinth, d - 1.6, color, { m: 'wood', r: 0.5 }));
  if (def.id === 'hutch') {
    // open upper case: back, sides, shallower depth
    out.push(box(0, 35, -d / 2 + 0.75, w - 1.2, h - crown - 35, 1.5, color, { m: 'wood' }));
    for (const sx of [-1, 1]) out.push(box((sx * (w - 2)) / 2, 35, -d / 2 + 6, 1.6, h - crown - 35, 12, color, { m: 'wood' }));
  }
  if (crown) out.push(rbox(0, h - crown, 0, w, crown, d, trim, { m: 'wood', r: 0.5 }));
  const front = d / 2 - 0.9;
  if (def.id === 'murphy-queen') {
    // one big face with a reveal, a horizontal pull near the top
    out.push(rbox(0, plinth + 1, front, w - 4, h - plinth - crown - 2, 0.9, C.white, { m: 'wood', r: 0.3 }));
    out.push(rbox(0, h - crown - 14, front + 0.8, w * 0.5, 1, 1, HANDLE, { m: 'metal', r: 0.4 }));
    out.push(rbox(0, plinth + 6, front + 0.5, w - 10, 0.4, 0.4, C.offwhite, { m: 'wood' }));
    return out;
  }
  const hutch = def.id === 'hutch';
  const lowerTop = hutch ? 34 : h - crown - 0.6;
  const n = w > 30 ? 2 : 1;
  const dw = (w - 2.6) / n;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 1.3 + dw / 2 + i * dw;
    out.push(rbox(x, plinth + 0.6, front, dw - 0.4, lowerTop - plinth - 1, 0.9, color, { m: 'wood', r: 0.3 }));
    out.push(rbox(x, plinth + 2.2, front + 0.3, dw - 4.5, lowerTop - plinth - 4.2, 0.6, color, { m: 'wood', r: 0.6 })); // raised panel
    const hx = n === 1 ? x + dw / 2 - 2.2 : i === 0 ? x + dw / 2 - 2 : x - dw / 2 + 2;
    const hy = wall ? plinth + 3 : Math.min(lowerTop - 6, plinth + (lowerTop - plinth) * 0.55);
    out.push(rbox(hx, hy, front + 0.9, 0.8, Math.min(9, (lowerTop - plinth) * 0.2), 0.8, HANDLE, { m: 'metal', r: 0.35 }));
  }
  if (hutch) {
    out.push(rbox(0, 34, 0, w, 1.2, d, C.walnut, { m: 'wood', r: 0.4 }));
    for (let i = 0; i < 2; i++) {
      const x = -w / 2 + 1.3 + ((w - 2.6) / 2) * (i + 0.5);
      const gz = -d / 2 + 12.3;
      out.push(box(x, 36, gz, (w - 2.6) / 2 - 1.6, h - crown - 38, 0.3, '#cfdde4', { m: 'glass' }));
      for (const y of [35.4, h - crown - 1.6]) out.push(rbox(x, y, gz, (w - 2.6) / 2 - 0.4, 1.2, 0.9, color, { m: 'wood', r: 0.3 }));
      for (const sx of [-1, 1]) out.push(box(x + (sx * ((w - 2.6) / 2 - 1.2)) / 2, 36, gz, 1, h - crown - 38, 0.9, color, { m: 'wood' }));
    }
    for (const y of [48, 60]) out.push(box(0, y, -d / 2 + 6, w - 3, 0.7, 9, C.wood, { m: 'wood' }));
    for (const y of [36, 48.7, 60.7]) for (const x of [-w / 4, 0, w / 4]) out.push(cyl(x, y, -d / 2 + 3, 9, 0.6, 9, C.white, { m: 'ceramic', rot: [Math.PI / 2 - 0.15, 0, 0] }));
  }
  return out;
}

function mirror(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.mount === 'wall' || def.id !== 'mirror-floor') {
    return [rbox(0, 0, 0, w, h, Math.max(1, d * 0.6), C.walnut, { m: 'wood', r: 0.4 }), box(0, 1.6, Math.max(1, d * 0.6) / 2 + 0.05, w - 3.2, h - 3.2, 0.1, '#cddbe3', { m: 'gloss' })];
  }
  // a floor mirror leaning back against the wall
  const lean = -0.06;
  return [
    rbox(0, 0, 0.6, w, h, 1.2, C.walnut, { m: 'wood', r: 0.4, rot: [lean, 0, 0] }),
    box(0, 1.6, 1.3, w - 3.2, h - 3.2, 0.1, '#cddbe3', { m: 'gloss', rot: [lean, 0, 0] }),
  ];
}

function clothesRack(w: number, d: number, h: number): Part[] {
  const out: Part[] = [];
  for (const sx of [-1, 1]) {
    const x = (sx * (w - 2)) / 2;
    out.push(cyl(x, 2, 0, 1.2, h - 2, 1.2, C.steel, { m: 'metal' }));
    out.push(rbox(x, 0, 0, 2, 2, d, C.charcoal, { m: 'metal', r: 0.6 }));
  }
  out.push(rodX(0, h - 1, 0, w - 2, 1.2, C.steel));
  out.push(rbox(0, 8, 0, w - 3, 0.8, d - 4, C.oak, { m: 'wood', r: 0.3 }));
  const colors = ['#3d4b63', '#c9c2b4', '#7a3b3b', '#2c2e33', '#8a9a8a', '#d9cfb8', '#5b4a7a'];
  const n = Math.max(3, Math.floor((w - 8) / 6));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 5 + (i * (w - 10)) / Math.max(1, n - 1);
    const len = 26 + ((i * 7) % 4) * 6;
    out.push(rbox(x, h - 3 - len, 0, 1.6, len, Math.min(d - 2, 17), colors[i % colors.length], { m: 'fabric', r: 0.7 }));
    out.push(box(x, h - 2.6, 0, 0.3, 1, Math.min(d - 4, 14), C.charcoal, { m: 'plastic' }));
  }
  for (const x of [-w / 4, w / 6]) out.push(rbox(x, 8.8, 0, 4, 3, 10, C.charcoal, { m: 'leather', r: 1.2 }));
  return out;
}

function hamper(w: number, d: number, h: number): Part[] {
  return [
    cyl(0, 0, 0, w * 0.9, h - 1.5, d * 0.9, '#c4a87e', { m: 'fabric', taper: 1.12 }),
    cyl(0, h - 1.5, 0, w, 1.5, d, '#b39466', { m: 'fabric' }),
    // woven bands
    ...[0.25, 0.5, 0.75].map((f) => torus(0, (h - 1.5) * f, 0, w * (0.9 + 0.1 * f) + 0.4, 0.8, d * (0.9 + 0.1 * f) + 0.4, '#a88a5e', { m: 'fabric', tube: 0.06 })),
    rbox(0, h, 0, 5, 1.2, 2, '#8a7050', { m: 'fabric', r: 0.5 }),
  ];
}

export const bedroomParts: ModelFn = (def, w, d, h) => {
  switch (def.symbol) {
    case 'bed':
      return bed(def, w, d, h);
    case 'bunk':
    case 'loft-bed':
      return bunkOrLoft(def, w, d, h);
    case 'crib':
      return crib(w, d, h);
    case 'nightstand':
      return nightstand(w, d, h);
    case 'dresser':
      if (def.id === 'file-cabinet' || def.id === 'lateral-file' || def.id === 'pedestal') return null;
      return dresser(def, w, d, h);
    case 'wardrobe':
      return cabinetDoors(def, w, d, h);
    case 'mirror':
      return mirror(def, w, d, h);
    case 'rack':
      return def.id === 'clothes-rack' ? clothesRack(w, d, h) : null;
    default:
      return def.id === 'hamper' ? hamper(w, d, h) : null;
  }
};
