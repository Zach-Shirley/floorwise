/**
 * Living room, decor, wall and lighting models. Return parts for the pieces
 * this file handles, or null to fall through to the next category (and
 * finally ./legacy.ts). See ./kit.ts for the frame and helpers.
 */
import type { FurnitureDef } from '../../engine/types';
import { ART, BOOKS, C, bookRow, box, cyl, legs, pick, rbox, roundLegs, sph, torus, type ModelFn, type Part } from './kit';

const UPH = '#8a8f96'; // default upholstery
const UPH_D = '#6d727a';

// ---------------------------------------------------------------------------
// Seating

/**
 * One upholstered seating block over a footprint rect (x0, z0 = back-left corner).
 * `back` edges get a backrest; `arms` sides get armrests.
 */
function seatBlock(
  x0: number,
  z0: number,
  w: number,
  d: number,
  h: number,
  o: { back?: ('back' | 'left' | 'right')[]; arms?: ('left' | 'right')[]; seats?: number; c?: string; legsH?: number; seatH?: number; armH?: number },
): Part[] {
  const c = o.c ?? UPH;
  const lh = o.legsH ?? 4;
  const seatTop = o.seatH ?? 18;
  const armH = o.armH ?? Math.min(h - 6, 25);
  const back = o.back ?? ['back'];
  const arms = o.arms ?? [];
  const bt = Math.min(8, d * 0.24); // back thickness
  const at = Math.min(6, w * 0.13); // arm thickness
  const cx = x0 + w / 2,
    cz = z0 + d / 2;
  const out: Part[] = [];
  // plinth frame
  out.push(rbox(cx, lh, cz, w, seatTop - lh - 5, d, c, { m: 'fabric', r: 1.5 }));
  // little legs
  for (const [lx, lz] of [
    [x0 + 2.5, z0 + 2.5],
    [x0 + w - 2.5, z0 + 2.5],
    [x0 + 2.5, z0 + d - 2.5],
    [x0 + w - 2.5, z0 + d - 2.5],
  ])
    out.push(cyl(lx, 0, lz, 1.6, lh, 1.6, C.walnut, { m: 'wood', taper: 1.3 }));
  // inner cushion area
  const ix0 = x0 + (arms.includes('left') ? at : 0) + (back.includes('left') ? bt : 0);
  const ix1 = x0 + w - (arms.includes('right') ? at : 0) - (back.includes('right') ? bt : 0);
  const iz0 = z0 + (back.includes('back') ? bt : 0);
  const iw = ix1 - ix0,
    id = z0 + d - iz0;
  const n = Math.max(1, o.seats ?? Math.max(1, Math.round(iw / 26)));
  const sw = iw / n;
  for (let i = 0; i < n; i++)
    out.push(rbox(ix0 + sw * i + sw / 2, seatTop - 5, iz0 + id / 2 + 0.3, sw - 0.6, 5.5, id - 0.6, c, { m: 'fabric', r: 2.2 }));
  // backrest frame + back cushions
  const backTop = h;
  for (const e of back) {
    if (e === 'back') {
      out.push(rbox(cx, seatTop - 5, z0 + bt / 2 - 1, w, backTop - seatTop + 5, bt * 0.55, c, { m: 'fabric', r: 1.8 }));
      for (let i = 0; i < n; i++)
        out.push(rbox(ix0 + sw * i + sw / 2, seatTop + 0.5, z0 + bt * 0.62, sw - 0.8, backTop - seatTop - 2.5, bt * 0.8, c, { m: 'fabric', r: 2.5, rot: [-0.12, 0, 0] }));
    } else {
      const x = e === 'left' ? x0 + bt / 2 : x0 + w - bt / 2;
      out.push(rbox(x, seatTop - 5, cz, bt, backTop - seatTop + 5, d, c, { m: 'fabric', r: 1.8 }));
    }
  }
  for (const a of arms) {
    const x = a === 'left' ? x0 + at / 2 : x0 + w - at / 2;
    const z1 = back.includes('back') ? z0 + bt * 0.3 : z0;
    out.push(rbox(x, lh, (z1 + z0 + d) / 2, at, armH - lh, z0 + d - z1, c, { m: 'fabric', r: 2.2 }));
  }
  return out;
}

function throwPillows(x0: number, x1: number, z: number, y: number, c1: string, c2: string): Part[] {
  return [
    rbox(x0 + 8, y, z, 15, 15, 5, c1, { m: 'fabric', r: 2.4, rot: [-0.25, 0.25, 0] }),
    rbox(x1 - 8, y, z, 15, 15, 5, c2, { m: 'fabric', r: 2.4, rot: [-0.25, -0.25, 0] }),
  ];
}

function sofa(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'outdoor-sofa') {
    const out: Part[] = [];
    // slatted teak frame
    out.push(...legs(w, d, 14, 2.5, C.oak, 0.5, 0, 0, { m: 'wood' }));
    for (let i = 0; i < 6; i++) out.push(box(0, 12, -d / 2 + 2 + i * ((d - 4) / 6) + (d - 4) / 12, w - 1, 1, (d - 4) / 6 - 0.8, C.oak, { m: 'wood' }));
    out.push(box(-w / 2 + 1.5, 0, 0, 3, 24, d, C.oak, { m: 'wood' }), box(w / 2 - 1.5, 0, 0, 3, 24, d, C.oak, { m: 'wood' }));
    out.push(box(0, 13, -d / 2 + 1.5, w, h - 13, 3, C.oak, { m: 'wood' }));
    const n = 3,
      sw = (w - 6) / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 3 + sw * i + sw / 2;
      out.push(rbox(x, 13, 2, sw - 0.6, 5, d - 5, C.offwhite, { m: 'fabric', r: 2 }));
      out.push(rbox(x, 18, -d / 2 + 6, sw - 0.8, h - 19, 5, C.offwhite, { m: 'fabric', r: 2.2, rot: [-0.15, 0, 0] }));
    }
    return out;
  }
  if (def.id === 'futon') {
    const out: Part[] = [];
    out.push(...legs(w, d, 9, 2, C.woodDark, 1));
    out.push(box(0, 8, 0, w, 1.5, d, C.woodDark, { m: 'wood' }));
    out.push(rbox(0, 9.5, 3, w - 2, 6, d - 7, UPH_D, { m: 'fabric', r: 2.8 }));
    out.push(rbox(0, 12, -d / 2 + 4, w - 2, h - 12, 6, UPH_D, { m: 'fabric', r: 2.8, rot: [-0.25, 0, 0] }));
    out.push(box(-w / 2 + 1, 8, 0, 2, 16, d, C.woodDark, { m: 'wood' }), box(w / 2 - 1, 8, 0, 2, 16, d, C.woodDark, { m: 'wood' }));
    return out;
  }
  const seats = def.symbol === 'loveseat' ? 2 : w > 90 ? 4 : w > 66 ? 3 : 2;
  const c = def.id === 'sofa-apartment' ? '#8d9a8a' : def.id === 'loveseat' ? '#a08d7a' : UPH;
  return [
    ...seatBlock(-w / 2, -d / 2, w, d, h, { arms: ['left', 'right'], seats, c }),
    ...throwPillows(-w / 2 + 6, w / 2 - 6, -d / 2 + 11, 17, '#c7b79a', '#5f7d8c'),
  ];
}

function sectional(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const parts = def.parts ?? [[0, 0, w, d]];
  const [a, ...rest] = parts;
  const chaiseLeft = rest[0]?.[0] === 0;
  const out: Part[] = [];
  // main run: back along the back edge, arm on the end away from the chaise
  out.push(...seatBlock(a[0] - w / 2, a[1] - d / 2, a[2], a[3], h, { back: ['back'], arms: [chaiseLeft ? 'right' : 'left'], seats: 3 }));
  // chaise: continues forward, arm on its outer side, no back
  for (const p of rest)
    out.push(...seatBlock(p[0] - w / 2, p[1] - d / 2, p[2], p[3], h, { back: [], arms: [p[0] === 0 ? 'left' : 'right'], seats: 1, armH: 22 }));
  out.push(...throwPillows(a[0] - w / 2 + 8, a[0] + a[2] - w / 2 - 8, a[1] - d / 2 + 11, 17, '#c7b79a', '#5f7d8c'));
  return out;
}

function armchair(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  switch (def.id) {
    case 'chaise':
      return [
        ...seatBlock(-w / 2, -d / 2, w, d, 20, { back: [], arms: [], seats: 1, seatH: 17 }),
        rbox(0, 14, -d / 2 + 10, w - 2, h - 14, 16, UPH, { m: 'fabric', r: 3, rot: [-0.55, 0, 0] }),
      ];
    case 'lounger': {
      // outdoor lounge: slatted frame, reclined back pad
      const out: Part[] = [...legs(w, d, 9, 2, C.oak, 0.5, 0, 0, { m: 'wood' })];
      out.push(box(0, 8, 6, w, 2, d - 14, C.oak, { m: 'wood' }));
      out.push(rbox(0, 10, 7, w - 2, 3, d - 16, C.offwhite, { m: 'fabric', r: 1.4 }));
      out.push(rbox(0, 9, -d / 2 + 11, w - 2, 3, 24, C.offwhite, { m: 'fabric', r: 1.4, rot: [0.75, 0, 0] }));
      return out;
    }
    case 'rocking-chair': {
      const out: Part[] = [];
      for (const s of [-1, 1]) {
        // curved rockers approximated with tilted runners
        out.push(rbox((s * (w - 3)) / 2, 0, -d / 4, 2, 2, d / 2 + 2, C.woodDark, { m: 'wood', r: 0.9, rot: [-0.12, 0, 0] }));
        out.push(rbox((s * (w - 3)) / 2, 0, d / 4, 2, 2, d / 2 + 2, C.woodDark, { m: 'wood', r: 0.9, rot: [0.12, 0, 0] }));
        out.push(cyl((s * (w - 3)) / 2, 1.5, d / 4, 1.4, 14, 1.4, C.woodDark, { m: 'wood' }));
        out.push(cyl((s * (w - 3)) / 2, 1.5, -d / 4, 1.4, h - 2, 1.4, C.woodDark, { m: 'wood' }));
        out.push(rbox((s * (w - 3)) / 2, 24, 0, 2, 1.5, d * 0.7, C.woodDark, { m: 'wood', r: 0.6 }));
      }
      out.push(box(0, 15, 0, w - 4, 1.5, d * 0.6, C.woodDark, { m: 'wood' }));
      out.push(rbox(0, 16.5, 1, w - 6, 3, d * 0.55, UPH, { m: 'fabric', r: 1.4 }));
      for (let i = 0; i < 5; i++) out.push(box(-w / 2 + 5 + i * ((w - 10) / 4), 19, -d / 4 + 0.5, 1.4, h - 22, 0.8, C.woodDark, { m: 'wood', rot: [-0.15, 0, 0] }));
      out.push(rbox(0, h - 3.5, -d / 4 - 1, w - 4, 3, 1.5, C.woodDark, { m: 'wood', r: 0.6 }));
      return out;
    }
    case 'swivel-chair': {
      const out: Part[] = [cyl(0, 0, 0, 18, 1, 18, C.chrome, { m: 'chrome' }), cyl(0, 1, 0, 3, 9, 3, C.chrome, { m: 'chrome' })];
      out.push(cyl(0, 10, 0, w - 2, 7, d - 2, '#a08d7a', { m: 'fabric' }));
      out.push(rbox(0, 16, 1.5, w - 8, 4, d - 10, '#a08d7a', { m: 'fabric', r: 1.8 }));
      // wrap-around back as 3 tilted pads
      for (const a of [-0.9, 0, 0.9]) {
        const r = (w - 6) / 2;
        out.push(rbox(Math.sin(a) * r, 15, -Math.cos(a) * r * 0.85, 12, h - 15, 4, '#a08d7a', { m: 'fabric', r: 1.8, rot: [0, -a, 0] }));
      }
      return out;
    }
    default: {
      const c = def.id === 'recliner' ? '#6e5848' : def.id === 'accent-chair' ? '#b0866a' : UPH;
      const m = def.id === 'recliner' ? 'leather' : 'fabric';
      const out = seatBlock(-w / 2, -d / 2, w, d, h, { arms: ['left', 'right'], seats: 1, c, armH: def.id === 'accent-chair' ? 22 : 25 }).map((p) =>
        p.m === 'fabric' ? { ...p, m: m as Part['m'] } : p,
      );
      if (def.id === 'recliner') out.push(rbox(0, 9, d / 2 - 1.5, w - 12, 9, 3, c, { m: 'leather', r: 1.2 }));
      return out;
    }
  }
}

function beanbag(w: number, d: number, h: number): Part[] {
  return [
    sph(0, h * 0.32, 0.5, w, h * 0.66, d, '#5d6a78', { m: 'fabric' }),
    sph(0, h * 0.62, -d * 0.2, w * 0.82, h * 0.6, d * 0.5, '#5d6a78', { m: 'fabric' }),
    sph(0, h * 0.5, d * 0.08, w * 0.6, h * 0.25, d * 0.45, '#546170', { m: 'fabric' }),
  ];
}

function ottoman(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'trunk')
    return [
      rbox(0, 0, 0, w, h - 3, d, C.walnut, { m: 'wood', r: 0.6 }),
      rbox(0, h - 3.2, 0, w + 0.2, 3.2, d + 0.2, C.woodDark, { m: 'wood', r: 0.8 }),
      box(-w / 3, 0.5, 0, 1.6, h - 1, d + 0.3, C.brass, { m: 'metal' }),
      box(w / 3, 0.5, 0, 1.6, h - 1, d + 0.3, C.brass, { m: 'metal' }),
      box(0, h - 6, d / 2 + 0.1, 2.5, 3, 0.4, C.brass, { m: 'metal' }),
    ];
  if (def.round)
    return [cyl(0, 0, 0, w, h, d, '#b9a68c', { m: 'fabric' }), torus(0, h - 1.4, 0, w - 1, 2.8, d - 1, '#ad9a80', { m: 'fabric', tube: 0.14 }), torus(0, 1.4, 0, w - 1, 2.8, d - 1, '#ad9a80', { m: 'fabric', tube: 0.14 })];
  return [rbox(0, 4, 0, w, h - 4, d, UPH, { m: 'fabric', r: 2.4 }), ...roundLegs(w, d, 4, 1.6, C.walnut, 2.5)];
}

// ---------------------------------------------------------------------------
// Tables

function lowTable(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const id = def.id;
  if (def.round) {
    if (id === 'coffee-round')
      return [
        cyl(0, h - 1.5, 0, w, 1.5, d, C.oak, { m: 'wood' }),
        cyl(0, 3, 0, w * 0.82, 1, d * 0.82, C.oak, { m: 'wood' }),
        ...[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          return cyl(Math.cos(a) * w * 0.36, 0, Math.sin(a) * d * 0.36, 1.6, h - 1.5, 1.6, C.walnut, { m: 'wood', taper: 1.3 });
        }),
      ];
    return [cyl(0, h - 1, 0, w, 1, d, C.walnut, { m: 'wood' }), cyl(0, 0, 0, 1.4, h - 1, 1.4, C.black, { m: 'metal' }), cyl(0, 0, 0, w * 0.6, 0.6, d * 0.6, C.black, { m: 'metal' })];
  }
  if (id === 'bar-cart') {
    const out: Part[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(cyl((sx * (w - 2)) / 2, 2, (sz * (d - 2)) / 2, 0.8, h - 2, 0.8, C.brass, { m: 'metal' }));
    for (const y of [8, h - 1]) out.push(box(0, y, 0, w - 1, 0.6, d - 1, '#cfd8dc', { m: 'glass' }), box(0, y - 0.4, 0, w, 0.4, d, C.brass, { m: 'metal' }));
    out.push(cyl(-w / 2 + 2, 0, d / 2 - 2, 3, 3, 3, C.black, { m: 'rubber', rot: [0, 0, Math.PI / 2] }));
    for (let i = 0; i < 4; i++) out.push(cyl(-w / 2 + 6 + i * 5, h - 0.4, 0, 3, 9 + (i % 2) * 2, 3, pick(['#3f6e4a', '#7a3b3b', '#d9cfb8', '#2f2f35'], id, i), { m: 'glass' }));
    return out;
  }
  if (def.tucks || id === 'bench-bed' || id === 'shoe-bench') {
    // benches: padded top on legs (entry bench gets a lower shelf)
    const out: Part[] = [rbox(0, h - 4, 0, w, 4, d, id === 'dining-bench' ? C.oak : UPH, { m: id === 'dining-bench' ? 'wood' : 'fabric', r: id === 'dining-bench' ? 0.5 : 1.5 })];
    out.push(...roundLegs(w, d, h - 4, 1.6, C.walnut, 2));
    if (id === 'shoe-bench') out.push(box(0, 4, 0, w - 4, 1, d - 3, C.oak, { m: 'wood' }));
    return out;
  }
  if (id === 'console-table')
    return [rbox(0, h - 1.5, 0, w, 1.5, d, C.oak, { m: 'wood', r: 0.3 }), box(0, 6, 0, w - 4, 1, d - 3, C.oak, { m: 'wood' }), ...legs(w, d, h - 1.5, 1.4, C.black, 1, 0, 0, { m: 'metal' })];
  if (id === 'coffee-table')
    return [
      rbox(0, h - 2, 0, w, 2, d, C.oak, { m: 'wood', r: 0.4 }),
      box(0, 4, 0, w - 4, 1, d - 4, C.oak, { m: 'wood' }),
      ...roundLegs(w, d, h - 2, 1.8, C.walnut, 2.5),
      // a couple of objects on top
      box(-w / 4, h, 0, 9, 1.5, 7, '#3b5a7a', { m: 'paper' }),
      cyl(w / 4, h, 0, 5, 4, 5, C.offwhite, { m: 'ceramic' }),
    ];
  return [rbox(0, h - 1.5, 0, w, 1.5, d, C.oak, { m: 'wood', r: 0.3 }), box(0, 6, 0, w - 3, 1, d - 3, C.oak, { m: 'wood' }), ...roundLegs(w, d, h - 1.5, 1.4, C.walnut, 1.5)];
}

function diningTable(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const id = def.id;
  if (def.symbol === 'table-round') {
    const top = id === 'patio-set' ? '#7d8a86' : C.oak;
    const m = id === 'patio-set' ? 'metal' : 'wood';
    const out: Part[] = [cyl(0, h - 1.5, 0, w, 1.5, d, top, { m }), cyl(0, 0, 0, 4, h - 1.5, 4, id === 'pub-table' ? C.black : C.walnut, { m: id === 'pub-table' ? 'metal' : 'wood' })];
    if (id === 'pub-table') out.push(cyl(0, 0, 0, w * 0.6, 1, d * 0.6, C.black, { m: 'metal' }), torus(0, 10, 0, 16, 1, 16, C.black, { m: 'metal', tube: 0.08 }));
    else if (id === 'patio-set') out.push(cyl(0, h - 1.5, 0, 2, 40, 2, C.metal, { m: 'metal' }), ...[0, 1, 2, 3].map((i) => box(0, 0.5, 0, w * 0.6, 1, 2, '#5d6763', { m: 'metal', rot: [0, (i * Math.PI) / 4, 0] })));
    else
      for (let i = 0; i < 4; i++)
        out.push(rbox(0, 0, 0, w * 0.55, 2, 3, C.walnut, { m: 'wood', r: 0.6, rot: [0, (i * Math.PI) / 4, 0] }));
    return out;
  }
  if (id === 'card-table')
    return [box(0, h - 1, 0, w, 1, d, '#2e5a44', { m: 'fabric' }), box(0, h - 1.8, 0, w, 0.8, d, C.black, { m: 'metal' }), ...legs(w, d, h - 1.8, 1, C.black, 1, 0, 0, { m: 'metal' })];
  return [
    rbox(0, h - 1.75, 0, w, 1.75, d, C.oak, { m: 'wood', r: 0.35 }),
    box(0, h - 5, 0, w - 8, 3.25, d - 8, C.oak, { m: 'wood' }),
    ...legs(w, d, h - 1.75, 2.8, C.oak, 2.5),
  ];
}

function diningChair(w: number, d: number, h: number): Part[] {
  const out: Part[] = [rbox(0, 16.5, 0.5, w, 1.6, d - 1, C.oak, { m: 'wood', r: 0.5 }), rbox(0, 18, 1, w - 2, 1.2, d - 4, UPH, { m: 'fabric', r: 0.5 })];
  out.push(...roundLegs(w, d, 16.5, 1.5, C.oak, 1.4));
  for (const s of [-1, 1]) out.push(box((s * (w - 2)) / 2, 18, -d / 2 + 1, 1.4, h - 18, 1.4, C.oak, { m: 'wood', rot: [-0.08, 0, 0] }));
  out.push(rbox(0, h - 4, -d / 2 + 0.8, w - 1, 3.5, 1.2, C.oak, { m: 'wood', r: 0.4, rot: [-0.08, 0, 0] }));
  for (let i = 0; i < 3; i++) out.push(box(-w / 4 + (i * w) / 4, 19, -d / 2 + 1.2, 1, h - 23, 0.7, C.oak, { m: 'wood', rot: [-0.08, 0, 0] }));
  return out;
}

function stool(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const out: Part[] = [cyl(0, h - 2.5, 0, w, 2.5, d, def.id === 'drafting-stool' ? C.black : C.walnut, { m: def.id === 'drafting-stool' ? 'plastic' : 'wood' })];
  if (def.id === 'drafting-stool') {
    out.push(cyl(0, 2, 0, 2, h - 4, 2, C.chrome, { m: 'chrome' }), torus(0, 12, 0, w * 0.85, 1, d * 0.85, C.chrome, { m: 'chrome', tube: 0.06 }));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      out.push(rbox(Math.cos(a) * w * 0.25, 1, Math.sin(a) * d * 0.25, w * 0.5, 1.4, 1.6, C.black, { m: 'plastic', r: 0.5, rot: [0, -a, 0] }));
      out.push(sph(Math.cos(a) * w * 0.47, 0.9, Math.sin(a) * d * 0.47, 1.8, 1.8, 1.8, C.charcoal, { m: 'rubber' }));
    }
    return out;
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    out.push(cyl(Math.cos(a) * w * 0.34, 0, Math.sin(a) * d * 0.34, 1.2, h - 2.5, 1.2, C.black, { m: 'metal' }));
  }
  out.push(torus(0, 10, 0, w * 0.75, 0.8, d * 0.75, C.black, { m: 'metal', tube: 0.07 }));
  return out;
}

// ---------------------------------------------------------------------------
// Media and storage

function tvConsole(w: number, d: number, h: number): Part[] {
  const out: Part[] = [rbox(0, 4, 0, w, h - 4, d, C.walnut, { m: 'wood', r: 0.4 }), ...roundLegs(w, d, 4, 1.4, C.black, 2)];
  // two doors + open middle bay
  const bay = w * 0.3;
  out.push(box(0, 5, d / 2 - 2.5, bay - 1, h - 6, 0.5, '#2a2a2a', { m: 'wood' }));
  for (const s of [-1, 1]) {
    const dw = (w - bay) / 2 - 1;
    out.push(box((s * (bay + dw)) / 2 + s * 0.5, 5, d / 2 + 0.05, dw - 0.4, h - 6, 0.3, C.wood, { m: 'wood' }));
    out.push(box(s * (bay / 2 + 1.5), h / 2, d / 2 + 0.3, 0.5, 4, 0.5, C.brass, { m: 'metal' }));
  }
  out.push(box(0, 6, d / 2 - 4, bay * 0.6, 3, 8, C.black, { m: 'plastic' }));
  return out;
}

function tv(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const wall = def.mount === 'wall';
  const panelD = 1.2;
  const y0 = wall ? 0 : 3;
  const ph = wall ? h : h - 3;
  const z = wall ? -d / 2 + 2.2 : -d / 2 + 3;
  const out: Part[] = [
    rbox(0, y0, z, w, ph, panelD, C.black, { m: 'gloss', r: 0.3 }),
    box(0, y0 + 0.4, z + panelD / 2 + 0.02, w - 0.8, ph - 1.2, 0.05, C.screen, { m: 'screen' }),
    box(0, y0 + ph * 0.25, z - panelD / 2 - 0.6, w * 0.5, ph * 0.5, 1.2, C.charcoal, { m: 'plastic' }),
  ];
  if (wall) out.push(box(0, h * 0.35, -d / 2 + 0.3, w * 0.35, h * 0.3, 0.6, C.metal, { m: 'metal' }));
  else
    for (const s of [-1, 1])
      out.push(rbox(s * w * 0.38, 0, z + 1, 2, 3.2, Math.min(d - 1, 9), C.charcoal, { m: 'metal', r: 0.5, rot: [0, 0, s * 0.15] }));
  return out;
}

function bookshelf(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const id = def.id;
  const t = 0.75;
  if (id === 'dumbbell-rack') {
    const out: Part[] = [...legs(w, d, h, 2, C.black, 0, 0, 0, { m: 'metal' })];
    const tiers = [
      { y: 14, z: d / 2 - 5, rot: 0.3 },
      { y: h - 4, z: -d / 2 + 5, rot: 0.3 },
    ];
    for (const [ti, tr] of tiers.entries()) {
      out.push(box(0, tr.y, tr.z, w, 1.5, 8, C.black, { m: 'metal', rot: [tr.rot, 0, 0] }));
      const n = 5;
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + 5 + (i * (w - 10)) / (n - 1);
        const s = 4.5 + (ti * n + i) * 0.35;
        out.push(cyl(x, tr.y + 1.5 + s / 2, tr.z, 7, s, s, C.charcoal, { m: 'rubber', rot: [0, 0, Math.PI / 2] }));
        out.push(cyl(x, tr.y + 1.5 + s / 2, tr.z, 9, 1, 1, C.chrome, { m: 'chrome', rot: [0, 0, Math.PI / 2] }));
      }
    }
    return out;
  }
  if (id === 'shoe-rack') {
    const out: Part[] = [box(-w / 2 + 0.5, 0, 0, 1, h, d, C.oak, { m: 'wood' }), box(w / 2 - 0.5, 0, 0, 1, h, d, C.oak, { m: 'wood' })];
    for (const y of [2, h / 2 + 1]) {
      out.push(box(0, y, 0, w - 1, 0.8, d - 1, C.oak, { m: 'wood' }));
      for (let i = 0; i < 3; i++) out.push(rbox(-w / 2 + 6 + i * 9, y + 0.8, 0, 3.6, 3.5, d - 2, pick(BOOKS, id, i + y), { m: 'leather', r: 1.2 }));
    }
    return out;
  }
  if (id === 'shelving') {
    const out: Part[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(cyl((sx * (w - 1)) / 2, 0, (sz * (d - 1)) / 2, 1, h, 1, C.chrome, { m: 'chrome' }));
    const n = 5;
    for (let i = 0; i < n; i++) {
      const y = 2 + (i * (h - 3)) / (n - 1);
      out.push(box(0, y, 0, w, 0.6, d, C.steel, { m: 'metal' }));
      if (i < n - 1) out.push(rbox(-w / 4, y + 0.6, 0, w * 0.35, 9, d * 0.8, pick(['#7a6a52', '#3a3d43', '#b45a3c'], id, i), { m: 'plastic', r: 0.8 }));
    }
    return out;
  }
  if (id === 'ladder-shelf') {
    const out: Part[] = [];
    // two leaning rails; shelves get shallower toward the top
    for (const s of [-1, 1]) out.push(box((s * (w - 1.5)) / 2, 0, 0, 1.5, h * 1.02, 1.5, C.oak, { m: 'wood', rot: [-0.2, 0, 0] }));
    const n = 5;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const y = 3 + f * (h - 8);
      const z = d / 2 - 1 - f * (d - 5) - (1 - f) * 2 + 1;
      const sd = d - 2 - f * (d - 6);
      out.push(box(0, y, z - sd / 2 + 1, w - 3, 0.8, sd, C.oak, { m: 'wood' }));
      if (i % 2 === 0) out.push(...bookRow(-w / 2 + 2, w / 2 - 2, y + 0.8, z - sd / 2 + 1, sd * 0.85, Math.min(9, (h - 8) / n - 2), id + i, 0.55));
      else out.push(cyl(w / 4, y + 0.8, z - sd / 2 + 1, 4, 5, 4, C.pot, { m: 'ceramic' }), sph(w / 4, y + 7, z - sd / 2 + 1, 6, 5, 6, C.green, { m: 'plant' }));
    }
    return out;
  }
  const color = id === 'cube-shelf' ? C.offwhite : id === 'shelf-bookcase-wall' ? C.oak : C.wood;
  const out: Part[] = [
    box(-w / 2 + t / 2, 0, 0, t, h, d, color, { m: 'wood' }),
    box(w / 2 - t / 2, 0, 0, t, h, d, color, { m: 'wood' }),
    box(0, h - t, 0, w, t, d, color, { m: 'wood' }),
    box(0, 0, 0, w, def.mount === 'wall' ? t : 2.5, d, color, { m: 'wood' }),
    box(0, 0, -d / 2 + 0.2, w - 0.2, h, 0.4, C.woodDark, { m: 'wood' }),
  ];
  if (id === 'cube-shelf') {
    const cols = 3,
      rows = 3;
    for (let i = 1; i < cols; i++) out.push(box(-w / 2 + (i * w) / cols, 0, 0, t, h, d, color, { m: 'wood' }));
    for (let j = 1; j < rows; j++) out.push(box(0, (j * h) / rows, 0, w, t, d, color, { m: 'wood' }));
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const x = -w / 2 + ((i + 0.5) * w) / cols;
        const y = (j * h) / rows + t;
        const k = (i * 3 + j) % 3;
        if (k === 0) out.push(rbox(x, y, 0.5, w / cols - 2.4, h / rows - 2.6, d - 2, pick(['#8a7a62', '#5f6f7a', '#a0806a'], id, i + j), { m: 'fabric', r: 1 }));
        else if (k === 1) out.push(...bookRow(x - w / cols / 2 + 1, x + w / cols / 2 - 1, y, 0, d * 0.75, h / rows - 3, id + i + j, 0.85));
      }
    return out;
  }
  const n = Math.max(1, Math.round(h / 13));
  const inner = h - (def.mount === 'wall' ? t : 2.5) - t;
  for (let i = 0; i < n; i++) {
    const y = (def.mount === 'wall' ? t : 2.5) + (inner * i) / n;
    if (i > 0) out.push(box(0, y, 0.2, w - 2 * t, t, d - 0.6, color, { m: 'wood' }));
    const bh = Math.min(10, inner / n - 1.5);
    if (bh < 3) continue;
    const yy = y + (i > 0 ? t : 0);
    if (i % 3 === 2) {
      // a shelf with a plant and a lying stack instead of a full row
      out.push(cyl(w / 4, yy, 0, 4, 4.5, 4, C.offwhite, { m: 'ceramic' }), sph(w / 4, yy + 4.5 + 2.5, 0, 6, 5, 6, C.green, { m: 'plant' }));
      out.push(box(-w / 4, yy, 0, 9, 3, d * 0.65, pick(BOOKS, id, i), { m: 'paper' }), box(-w / 4, yy + 3, 0, 8, 1.5, d * 0.6, pick(BOOKS, id, i + 3), { m: 'paper' }));
    } else out.push(...bookRow(-w / 2 + t + 0.3, w / 2 - t - 0.3, yy, 0.3, d * 0.85, bh, id + i, i % 2 ? 0.65 : 0.85));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Decor

function rug(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const id = def.id;
  const th = Math.max(h, 0.2);
  if (id === 'yoga-mat') return [rbox(0, 0, 0, w, th, d, '#6c8f88', { m: 'rubber', r: Math.min(th / 2, 0.1) })];
  if (id === 'gym-floor') {
    const out: Part[] = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push(box(-w / 3 + (i * w) / 3, 0, -d / 3 + (j * d) / 3, w / 3 - 0.3, th, d / 3 - 0.3, '#2a2c30', { m: 'rubber' }));
    return out;
  }
  if (id === 'chair-mat') return [box(0, 0, 0, w, th, d, '#cfd6da', { m: 'glass' })];
  const base = pick(['#8a7462', '#6f7d86', '#a39582', '#7a6c7d'], id);
  const edge = pick(['#5e4c40', '#4b5860', '#7a6c5a', '#55485a'], id);
  if (def.round) return [cyl(0, 0, 0, w, th, d, edge, { m: 'fabric' }), cyl(0, 0.02, 0, w - 8, th, d - 8, base, { m: 'fabric' }), cyl(0, 0.04, 0, w * 0.4, th, d * 0.4, edge, { m: 'fabric' })];
  const b = Math.min(6, Math.min(w, d) * 0.08);
  return [
    rbox(0, 0, 0, w, th, d, edge, { m: 'fabric', r: 0.1 }),
    box(0, 0.02, 0, w - b * 2, th, d - b * 2, base, { m: 'fabric' }),
    box(0, 0.04, 0, w - b * 4, th, 1.2, edge, { m: 'fabric' }),
    box(0, 0.04, 0, 1.2, th, d - b * 4, edge, { m: 'fabric' }),
  ];
}

function leafCluster(cx: number, cy: number, cz: number, size: number, seed: string, n = 7): Part[] {
  const out: Part[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (seed.length % 3);
    const r = size * 0.28;
    const yo = ((i * 37) % 10) / 10;
    out.push(sph(cx + Math.cos(a) * r, cy + yo * size * 0.3, cz + Math.sin(a) * r, size * 0.55, size * 0.4, size * 0.55, i % 2 ? C.green : C.greenDark, { m: 'plant' }));
  }
  out.push(sph(cx, cy + size * 0.3, cz, size * 0.6, size * 0.5, size * 0.6, C.green, { m: 'plant' }));
  return out;
}

function plant(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'plant-small') {
    const ph = h * 0.45;
    return [cyl(0, 0, 0, w * 0.75, ph, d * 0.75, C.offwhite, { m: 'ceramic', taper: 1.15 }), cyl(0, ph - 0.3, 0, w * 0.68, 0.3, d * 0.68, '#4a3a2c', { m: 'paper' }), ...leafCluster(0, ph + 2, 0, w, def.id, 5)];
  }
  const potH = Math.min(15, h * 0.28);
  const pot = [
    cyl(0, 0, 0, w * 0.6, potH, d * 0.6, def.id === 'plant-tall' ? '#3a3d43' : C.pot, { m: 'ceramic', taper: 1.2 }),
    torus(0, potH, 0, w * 0.62, 1.2, d * 0.62, def.id === 'plant-tall' ? '#3a3d43' : C.pot, { m: 'ceramic', tube: 0.08 }),
    cyl(0, potH - 0.5, 0, w * 0.55, 0.5, d * 0.55, '#4a3a2c', { m: 'paper' }),
  ];
  if (h > 60) {
    // fiddle-leaf style tree: trunk and a few leaf clusters up top
    const out: Part[] = [...pot, cyl(0, potH, 0, 1.4, h * 0.55, 1.4, C.woodDark, { m: 'wood' })];
    out.push(...leafCluster(0, h * 0.62, 0, w * 0.8, def.id, 6));
    out.push(...leafCluster(-w * 0.15, h * 0.48, w * 0.1, w * 0.55, def.id + 'b', 5));
    out.push(...leafCluster(w * 0.18, h * 0.78, -w * 0.08, w * 0.55, def.id + 'c', 5));
    return out;
  }
  // bushy floor plant: leaves on stems fanning out
  const out: Part[] = [...pot];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const tilt = 0.35 + (i % 3) * 0.12;
    const len = (h - potH) * (0.75 + (i % 2) * 0.2);
    out.push(
      sph(Math.cos(a) * len * 0.32, potH + len * 0.55, Math.sin(a) * len * 0.32, 5, len * 0.75, 2, i % 2 ? C.green : C.greenDark, {
        m: 'plant',
        rot: [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt],
      }),
    );
  }
  out.push(sph(0, potH + (h - potH) * 0.45, 0, 6, (h - potH) * 0.8, 6, C.green, { m: 'plant' }));
  return out;
}

function aquarium(w: number, d: number, h: number): Part[] {
  const standH = 28;
  const out: Part[] = [rbox(0, 0, 0, w, standH, d, C.black, { m: 'wood', r: 0.4 })];
  out.push(box(-w / 4, 2, d / 2 + 0.05, w / 2 - 1, standH - 4, 0.3, C.charcoal, { m: 'wood' }), box(w / 4, 2, d / 2 + 0.05, w / 2 - 1, standH - 4, 0.3, C.charcoal, { m: 'wood' }));
  const th = h - standH - 2;
  out.push(box(0, standH, 0, w, th, d, '#9cc9dd', { m: 'glass' }));
  out.push(box(0, standH + 0.5, 0, w - 1, th * 0.85, d - 1, '#6fa9c4', { m: 'glass' }));
  out.push(box(0, standH, 0, w - 0.6, 2, d - 0.6, '#d8c49a', { m: 'stone' }));
  out.push(box(0, h - 2, 0, w + 0.4, 2, d + 0.4, C.black, { m: 'plastic' }));
  for (let i = 0; i < 5; i++) out.push(sph(-w / 2 + 6 + i * ((w - 12) / 4), standH + 2 + 4, ((i % 2) - 0.5) * 3, 2.5, 8 + (i % 3) * 3, 2.5, i % 2 ? C.green : C.greenDark, { m: 'plant' }));
  out.push(sph(w * 0.1, standH + th * 0.55, 0, 2.2, 1.2, 0.8, '#e07b39', { m: 'gloss' }), sph(-w * 0.2, standH + th * 0.4, 1, 1.8, 1, 0.7, '#3f6e8c', { m: 'gloss' }));
  return out;
}

function divider(w: number, d: number, h: number): Part[] {
  const n = 3;
  const pw = w / n;
  const out: Part[] = [];
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + pw / 2 + i * pw;
    const z = (i % 2 ? 1 : -1) * (d / 2 - 2);
    const rot: [number, number, number] = [0, i % 2 ? 0.45 : -0.45, 0];
    out.push(box(x, 1, z, pw - 0.6, h - 1, 1, C.oak, { m: 'wood', rot }));
    out.push(box(x, 4, z, pw - 3, h - 8, 1.2, '#efe6d2', { m: 'paper', rot }));
  }
  return out;
}

function piano(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const keys = (cx: number, y: number, z: number, kw: number, kd: number): Part[] => {
    const out: Part[] = [box(cx, y, z, kw, 0.8, kd, C.white, { m: 'gloss' })];
    const n = Math.floor(kw / 2.4);
    for (let i = 0; i < n; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) out.push(box(cx - kw / 2 + (i * kw) / n, y + 0.8, z - kd * 0.2, 0.7, 0.5, kd * 0.6, C.black, { m: 'gloss' }));
    return out;
  };
  if (def.clearUnder) {
    // digital piano on a stand
    return [
      rbox(0, h - 4, 0, w, 4, d, C.black, { m: 'plastic', r: 0.6 }),
      ...keys(0, h - 1, d / 2 - 3.5, w - 6, 5.5),
      box(-w / 2 + 2, 0, 0, 1.5, h - 4, d - 2, C.black, { m: 'metal' }),
      box(w / 2 - 2, 0, 0, 1.5, h - 4, d - 2, C.black, { m: 'metal' }),
      box(0, 4, -d / 2 + 2, w - 4, 1, 3, C.black, { m: 'metal' }),
    ];
  }
  if (d > 40) {
    // baby grand: rounded case on three legs, propped lid
    const caseY = 24;
    const out: Part[] = [
      rbox(0, caseY, -4, w, 12, d - 8, C.black, { m: 'gloss', r: 3 }),
      sph(-w * 0.1, caseY + 6, -d / 2 + 14, w * 0.8, 12, 26, C.black, { m: 'gloss' }),
      ...keys(0, caseY + 3, d / 2 - 4, w - 6, 6),
      rbox(-w * 0.12, caseY + 12, -4, w * 0.7, 1, d - 18, C.black, { m: 'gloss', r: 0.5, rot: [0, 0, -0.45] }),
    ];
    for (const [x, z] of [
      [-w / 2 + 4, d / 2 - 6],
      [w / 2 - 4, d / 2 - 6],
      [0, -d / 2 + 6],
    ])
      out.push(cyl(x, 0, z, 3.2, caseY, 3.2, C.black, { m: 'gloss', taper: 1.2 }));
    out.push(box(0, 0, d / 2 - 12, 1.5, caseY, 1.5, C.black, { m: 'gloss' }), rbox(0, 0.5, d / 2 - 10, 8, 1, 4, C.brass, { m: 'metal', r: 0.4 }));
    return out;
  }
  // upright
  return [
    rbox(0, 0, -d / 2 + 6, w, h, 12, C.black, { m: 'gloss', r: 0.8 }),
    rbox(0, 25, d / 2 - 5.5, w, 3, 11, C.black, { m: 'gloss', r: 0.5 }),
    ...keys(0, 28, d / 2 - 5, w - 6, 6),
    box(-w / 2 + 2, 0, d / 2 - 3, 2.5, 25, 3, C.black, { m: 'gloss' }),
    box(w / 2 - 2, 0, d / 2 - 3, 2.5, 25, 3, C.black, { m: 'gloss' }),
    box(0, 36, -d / 2 + 12.2, w * 0.4, 8, 0.6, C.black, { m: 'gloss', rot: [-0.3, 0, 0] }),
  ];
}

function guitar(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const wall = def.mount === 'wall';
  const base = wall ? 0 : 3;
  const bodyD = 4;
  const z = wall ? -d / 2 + 2.6 : 0;
  const out: Part[] = [
    sph(0, base + 6.5, z, Math.min(w, 15), 13, bodyD, '#c28a4e', { m: 'gloss' }),
    sph(0, base + 15.5, z, Math.min(w, 15) * 0.78, 10, bodyD, '#c28a4e', { m: 'gloss' }),
    cyl(0, base + 10, z + bodyD / 2 - 0.2, 3.2, 0.3, 3.2, C.black, { m: 'plastic', rot: [Math.PI / 2, 0, 0] }),
    box(0, base + 19, z + 0.5, 1.8, h - base - 25, 1, C.woodDark, { m: 'wood' }),
    rbox(0, h - 6, z + 0.5, 3, 6, 1.2, C.woodDark, { m: 'wood', r: 0.4 }),
    box(0, base + 4, z + bodyD / 2 - 0.3, 3.5, 1, 0.6, C.woodDark, { m: 'wood' }),
  ];
  if (wall) out.push(box(0, h - 9, -d / 2 + 0.4, 3, 3, 0.8, C.black, { m: 'metal' }), box(0, h - 7, -d / 2 + 1.5, 2.6, 0.8, 2.4, C.black, { m: 'metal' }));
  else
    out.push(
      ...[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
        return box(Math.cos(a) * 4, 0, Math.sin(a) * 4, 8, 1, 1, C.black, { m: 'metal', rot: [0, -a, 0] });
      }),
      box(0, 0, -bodyD / 2 - 1.5, 1, h * 0.75, 1, C.black, { m: 'metal', rot: [0.12, 0, 0] }),
      box(0, 3, 1, 8, 1, 3, C.black, { m: 'metal' }),
    );
  return out;
}

// ---------------------------------------------------------------------------
// Lighting

function drumShade(y: number, dia: number, hh: number, x = 0, z = 0): Part[] {
  return [cyl(x, y, z, dia, hh, dia, '#f1ebdf', { m: 'paper', taper: 0.92 }), torus(x, y + hh, z, dia * 0.92, 0.4, dia * 0.92, '#e2dacb', { m: 'paper', tube: 0.04 })];
}

function lamp(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  // table lamp: ceramic gourd base, drum shade
  const shadeH = h * 0.42;
  return [
    cyl(0, 0, 0, w * 0.4, 1, d * 0.4, C.charcoal, { m: 'metal' }),
    sph(0, h * 0.2 + 1, 0, w * 0.5, h * 0.38, d * 0.5, pick(['#3f6e8c', '#d9cfb8', '#5a8f6b'], def.id), { m: 'ceramic' }),
    cyl(0, h * 0.38, 0, 0.7, h * 0.22, 0.7, C.brass, { m: 'metal' }),
    ...drumShade(h - shadeH, w, shadeH),
  ];
}

function floorLamp(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'coat-tree') {
    const out: Part[] = [cyl(0, 1, 0, 2, h - 3, 2, C.walnut, { m: 'wood' }), sph(0, h - 1.5, 0, 3, 3, 3, C.walnut, { m: 'wood' })];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      out.push(box(Math.cos(a) * (w / 4), 0, Math.sin(a) * (d / 4), w / 2, 1.5, 2, C.walnut, { m: 'wood', rot: [0, -a, 0] }));
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      out.push(box(Math.cos(a) * 2.5, h - 10, Math.sin(a) * 2.5, 5, 1, 1, C.walnut, { m: 'wood', rot: [0, -a, 0.6] }));
    }
    out.push(rbox(3, h - 30, 1, 10, 24, 6, '#5e6b78', { m: 'fabric', r: 2.5 }), rbox(-3, h - 22, -2, 9, 14, 7, '#9a7a52', { m: 'leather', r: 2.5 }));
    return out;
  }
  if (def.id === 'arc-lamp') {
    // marble base, arcing pole reaching ~5' out over a sofa (outside the footprint, like the real thing)
    const out: Part[] = [cyl(0, 0, 0, w, 6, d, C.offwhite, { m: 'stone' })];
    const steps = 8;
    const reach = 48;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps,
        t1 = (i + 1) / steps;
      const p = (t: number) => ({ x: Math.sin((t * Math.PI) / 2) * reach, y: 6 + Math.sin(t * Math.PI * 0.95) * (h - 18) + t * 8 });
      const a = p(t0),
        b = p(t1);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.x - a.x, b.y - a.y);
      out.push(cyl((a.x + b.x) / 2, (a.y + b.y) / 2 - len / 2, 0, 1, len + 0.6, 1, C.chrome, { m: 'chrome', rot: [0, 0, -ang] }));
    }
    out.push(sph(reach, h - 16, 0, 15, 9, 15, C.chrome, { m: 'chrome' }));
    return out;
  }
  return [cyl(0, 0, 0, w * 0.75, 1.2, d * 0.75, C.charcoal, { m: 'metal' }), cyl(0, 1.2, 0, 1, h - 14, 1, C.charcoal, { m: 'metal' }), ...drumShade(h - 14, w, 14)];
}

function pendant(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'chandelier') {
    const out: Part[] = [cyl(0, h - 3, 0, 6, 3, 6, C.brass, { m: 'metal' }), cyl(0, h * 0.5, 0, 0.6, h * 0.5 - 3, 0.6, C.brass, { m: 'metal' }), sph(0, h * 0.45, 0, 4, 6, 4, C.brass, { m: 'metal' })];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = w / 2 - 3;
      out.push(box(Math.cos(a) * r * 0.5, h * 0.4, Math.sin(a) * r * 0.5, r, 0.6, 0.6, C.brass, { m: 'metal', rot: [0, -a, 0] }));
      out.push(cyl(Math.cos(a) * r, h * 0.4, Math.sin(a) * r, 1.6, 2, 1.6, C.brass, { m: 'metal' }));
      out.push(sph(Math.cos(a) * r, h * 0.4 + 3.5, Math.sin(a) * r, 1.6, 3, 1.6, '#fff4d6', { m: 'glow' }));
    }
    return out;
  }
  const shadeH = Math.min(10, h * 0.4);
  return [
    cyl(0, h - 1.2, 0, 4.5, 1.2, 4.5, C.black, { m: 'metal' }),
    cyl(0, shadeH, 0, 0.3, h - shadeH - 1.2, 0.3, C.black, { m: 'plastic' }),
    cyl(0, 0, 0, w, shadeH, d, C.charcoal, { m: 'metal', taper: 0.35 }),
    sph(0, 0.5, 0, w * 0.35, 2, d * 0.35, '#fff4d6', { m: 'glow' }),
  ];
}

function ceilingFan(w: number, h: number): Part[] {
  const out: Part[] = [cyl(0, h - 1.5, 0, 5, 1.5, 5, C.white, { m: 'plastic', taper: 0.7 }), cyl(0, 6, 0, 0.9, h - 7.5, 0.9, C.white, { m: 'metal' })];
  out.push(cyl(0, 3, 0, 8, 4, 8, C.white, { m: 'plastic' }), sph(0, 2.5, 0, 6, 3.5, 6, '#fff4d6', { m: 'glow' }));
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = w / 4 + 2;
    out.push(box(Math.cos(a) * 5, 4.5, Math.sin(a) * 5, 4, 0.5, 1, C.metal, { m: 'metal', rot: [0, -a, 0] }));
    out.push(rbox(Math.cos(a) * r, 4.6, Math.sin(a) * r, w / 2 - 6, 0.4, 5.2, C.woodLight, { m: 'wood', r: 0.18, rot: [0.12, -a, 0] }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Wall pieces

function shelfWall(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'coat-hooks') {
    const out: Part[] = [rbox(0, 0, -d / 2 + 0.5, w, h, 1, C.oak, { m: 'wood', r: 0.3 })];
    for (let i = 0; i < 4; i++) {
      const x = -w / 2 + 4 + (i * (w - 8)) / 3;
      out.push(cyl(x, h * 0.4, -d / 2 + 2.5, 0.6, 3, 0.6, C.black, { m: 'metal', rot: [Math.PI / 2 - 0.3, 0, 0] }), sph(x, h * 0.5, d / 2 - 1, 1.2, 1.2, 1.2, C.black, { m: 'metal' }));
    }
    return out;
  }
  if (def.id === 'lumber-rack') {
    const out: Part[] = [];
    for (const s of [-1, 1]) out.push(box((s * w) / 2.4, 0, -d / 2 + 1, 2, h, 2, C.black, { m: 'metal' }));
    for (const f of [0.08, 0.5, 0.92]) {
      const y = f * (h - 2);
      for (const s of [-1, 1]) out.push(box((s * w) / 2.4, y, 0, 1.5, 1.5, d, C.black, { m: 'metal' }));
      for (let i = 0; i < 4; i++) out.push(box(0, y + 1.5 + Math.floor(i / 2) * 1.6, -d / 2 + 3 + (i % 2) * 4, w + 10 > w ? w : w, 1.5, 3.5, C.woodLight, { m: 'wood' }));
    }
    return out;
  }
  // floating shelf: thick wood plank + a few objects
  const plank = 1.6;
  const out: Part[] = [rbox(0, 0, 0, w, plank, d, C.oak, { m: 'wood', r: 0.2 })];
  const top = h - plank - 0.3;
  out.push(...bookRow(-w / 2 + 1.5, -w / 2 + 1.5 + w * 0.42, plank, -0.5, d * 0.85, Math.min(top, 8.5), def.id, 1));
  out.push(cyl(w * 0.12, plank, 0, 3.5, Math.min(top, 5), 3.5, C.offwhite, { m: 'ceramic', taper: 0.85 }));
  out.push(cyl(w * 0.32, plank, 0, 4, Math.min(3.5, top), 4, C.pot, { m: 'ceramic' }), ...leafCluster(w * 0.32, plank + 4, 0, Math.min(6, d), def.id, 4));
  return out;
}

function art(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const id = def.id;
  const t = Math.max(d, 0.6);
  if (id === 'clock') {
    const out: Part[] = [
      cyl(0, h / 2 - t / 2, -d / 2 + t / 2, w, t, h, C.black, { m: 'plastic', rot: [Math.PI / 2, 0, 0] }),
      cyl(0, h / 2 - 0.2, -d / 2 + t + 0.02, w - 1.5, 0.15, h - 1.5, C.white, { m: 'paper', rot: [Math.PI / 2, 0, 0] }),
    ];
    const z = -d / 2 + t + 0.2;
    out.push(box(0, h / 2, z, 0.5, 3.6, 0.15, C.black, { rot: [0, 0, 0.6] }), box(0, h / 2, z + 0.05, 0.35, 4.8, 0.15, C.black, { rot: [0, 0, -0.9] }));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      out.push(box(Math.sin(a) * (w / 2 - 1.5), h / 2 + Math.cos(a) * (h / 2 - 1.5) - 0.4, z, 0.4, 0.8, 0.1, C.black, { rot: [0, 0, -a] }));
    }
    return out;
  }
  const poster = id.startsWith('poster');
  const z = -d / 2;
  if (id === 'gallery-wall') {
    const frames: [number, number, number, number][] = [
      [-w / 2 + 9, 6, 16, 22],
      [-w / 2 + 9, 30, 14, 10],
      [-w / 2 + 31, 4, 20, 28],
      [-w / 2 + 31, 33.5, 12, 6.5],
      [w / 2 - 10, 8, 16, 16],
      [w / 2 - 10, 28, 12, 12],
    ];
    return frames.flatMap(([x, y, fw, fh], i) => [
      box(x, y, z + t / 2, fw, fh, t, i % 2 ? C.black : C.oak, { m: i % 2 ? 'plastic' : 'wood' }),
      box(x, y + 1.5, z + t + 0.02, fw - 3, fh - 3, 0.05, C.offwhite, { m: 'paper' }),
      box(x, y + 3, z + t + 0.05, Math.max(1, fw - 6), Math.max(0.5, fh - 6), 0.05, pick(ART, id, i), { m: 'paper' }),
    ]);
  }
  if (poster)
    return [
      box(0, 0, z + 0.3, w, h, 0.6, C.black, { m: 'plastic' }),
      box(0, 0.6, z + 0.62, w - 1.2, h - 1.2, 0.05, pick(ART, id), { m: 'paper' }),
      box(0, h * 0.55, z + 0.66, w * 0.6, h * 0.25, 0.05, pick(ART, id, 3), { m: 'paper' }),
      box(0, h * 0.12, z + 0.66, w * 0.7, h * 0.06, 0.05, C.offwhite, { m: 'paper' }),
    ];
  // framed art with a mat
  return [
    box(0, 0, z + t / 2, w, h, t, C.walnut, { m: 'wood' }),
    box(0, 1.5, z + t + 0.02, w - 3, h - 3, 0.05, C.offwhite, { m: 'paper' }),
    box(0, 4, z + t + 0.05, w - 8, h - 8, 0.05, pick(ART, id), { m: 'paper' }),
    box(-w * 0.12, h * 0.35, z + t + 0.08, (w - 8) * 0.4, (h - 8) * 0.45, 0.05, pick(ART, id, 2), { m: 'paper' }),
    sph(w * 0.15, h * 0.62, z + t + 0.1, (w - 8) * 0.25, (w - 8) * 0.25, 0.05, pick(ART, id, 5), { m: 'paper' }),
  ];
}

function ledStrip(w: number, d: number, h: number): Part[] {
  const t = Math.max(h, 0.5);
  return [box(0, 0, -d / 2 + 0.3, w, t, 0.6, '#d6d6d6', { m: 'plastic' }), box(0, t * 0.2, -d / 2 + 0.6, w - 0.4, t * 0.6, 0.15, '#ffe9b0', { m: 'glow' })];
}

// ---------------------------------------------------------------------------

export const livingParts: ModelFn = (def, w, d, h) => {
  switch (def.symbol) {
    case 'sofa':
    case 'loveseat':
      return sofa(def, w, d, h);
    case 'sectional':
      return sectional(def, w, d, h);
    case 'armchair':
      return armchair(def, w, d, h);
    case 'beanbag':
      return beanbag(w, d, h);
    case 'ottoman':
      return ottoman(def, w, d, h);
    case 'coffee-table':
    case 'side-table':
      return lowTable(def, w, d, h);
    case 'table-rect':
    case 'table-round':
      return diningTable(def, w, d, h);
    case 'chair':
      return diningChair(w, d, h);
    case 'stool':
      return stool(def, w, d, h);
    case 'tv-console':
      return tvConsole(w, d, h);
    case 'tv':
      return tv(def, w, d, h);
    case 'bookshelf':
      return bookshelf(def, w, d, h);
    case 'rug':
      return rug(def, w, d, h);
    case 'plant':
      return plant(def, w, d, h);
    case 'lamp':
      return lamp(def, w, d, h);
    case 'floor-lamp':
      return floorLamp(def, w, d, h);
    case 'pendant':
      return pendant(def, w, d, h);
    case 'ceiling-fan':
      return ceilingFan(w, h);
    case 'shelf-wall':
      return shelfWall(def, w, d, h);
    case 'art':
      return art(def, w, d, h);
    case 'piano':
      return piano(def, w, d, h);
    case 'divider':
      return divider(w, d, h);
    case 'aquarium':
      return aquarium(w, d, h);
    case 'led-strip':
      return ledStrip(w, d, h);
    case 'guitar':
      return guitar(def, w, d, h);
    default:
      return null;
  }
};
