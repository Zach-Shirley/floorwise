/**
 * Kitchen, bath, laundry, workshop, games, fitness and outdoor models.
 * Return parts for the pieces this file handles, or null to fall through to
 * ./legacy.ts. See ./kit.ts for the frame (inches, front toward +z).
 */
import { C, box, cyl, legs, rbox, sph, torus, type ModelFn, type Part } from './kit';

const CAB = '#e9e6df'; // painted cabinet
const CAB_EDGE = '#d9d5cc';
const TOP = '#d5d0c6'; // stone
const APPL = '#c4c8cd'; // stainless

/** A bar pull, horizontal or vertical, standing proud of a front face at z. */
function pull(x: number, y: number, z: number, len: number, vertical = false, c = C.chrome): Part[] {
  return vertical
    ? [cyl(x, y, z + 0.9, 0.5, len, 0.5, c, { m: 'chrome' }), box(x, y + 0.6, z + 0.4, 0.4, 0.4, 0.8, c, { m: 'chrome' }), box(x, y + len - 1, z + 0.4, 0.4, 0.4, 0.8, c, { m: 'chrome' })]
    : [cyl(x, y, z + 0.9, 0.5, len, 0.5, c, { m: 'chrome', rot: [0, 0, Math.PI / 2] }), box(x - len / 2 + 0.6, y - 0.2, z + 0.4, 0.4, 0.4, 0.8, c, { m: 'chrome' }), box(x + len / 2 - 0.6, y - 0.2, z + 0.4, 0.4, 0.4, 0.8, c, { m: 'chrome' })];
}

/**
 * Base cabinets across width w: toe kick, carcass, a drawer over doors in each
 * bay, stone top with overhang. `front` = how far the top overhangs the front.
 */
function baseCabinets(w: number, d: number, h: number, opts: { front?: number; top?: string; sink?: boolean } = {}): Part[] {
  const ov = opts.front ?? 1;
  const topT = 1.5;
  const cabD = d - ov;
  const cz = -d / 2 + cabD / 2; // carcass center
  const fz = -d / 2 + cabD; // front face
  const bodyH = h - topT;
  const out: Part[] = [
    box(0, 0, cz - 1.5, w - 0.5, 4, cabD - 3, C.charcoal, { m: 'plastic' }), // toe kick (recessed)
    box(0, 4, cz, w - 0.2, bodyH - 4, cabD, CAB_EDGE, { m: 'wood' }),
    rbox(0, h - topT, 0, w, topT, d, opts.top ?? TOP, { m: 'stone', r: 0.3 }),
  ];
  const bays = Math.max(1, Math.round(w / 24));
  const bw = w / bays;
  for (let i = 0; i < bays; i++) {
    const bx = -w / 2 + bw * (i + 0.5);
    const drawerH = 6;
    const doorH = bodyH - 4 - drawerH - 1.5;
    if (!opts.sink) {
      out.push(rbox(bx, 4 + doorH + 1, fz, bw - 0.4, drawerH, 0.8, CAB, { m: 'wood', r: 0.2 }));
      out.push(...pull(bx, 4 + doorH + 1 + drawerH / 2, fz + 0.4, Math.min(8, bw * 0.4)));
    } else {
      out.push(rbox(bx, 4 + doorH + 1, fz, bw - 0.4, drawerH, 0.8, CAB, { m: 'wood', r: 0.2 })); // false front
    }
    const doors = bw > 21 ? 2 : 1;
    const dw = (bw - 0.4) / doors;
    for (let j = 0; j < doors; j++) {
      const dx = bx - (bw - 0.4) / 2 + dw * (j + 0.5);
      out.push(rbox(dx, 4.5, fz, dw - 0.25, doorH, 0.8, CAB, { m: 'wood', r: 0.2 }));
      const px = doors === 2 ? (j === 0 ? dx + dw / 2 - 1.5 : dx - dw / 2 + 1.5) : dx + dw / 2 - 1.5;
      out.push(...pull(px, 4.5 + doorH - 6, fz + 0.4, 4, true));
    }
  }
  return out;
}

/** A faucet: base, riser, spout arching toward the front, lever. `stem` = riser height. */
function faucet(x: number, y: number, z: number, reach = 7, stem = 11): Part[] {
  return [
    cyl(x, y, z, 2, 1, 2, C.steel, { m: 'metal' }),
    cyl(x, y + 1, z, 1, stem, 1, C.steel, { m: 'metal' }),
    box(x, y + stem, z + reach / 2 - 0.5, 1, 1, reach, C.steel, { m: 'metal' }), // spout arm
    cyl(x, y + stem - 2, z + reach - 0.5, 0.9, 2.5, 0.9, C.steel, { m: 'metal' }), // outlet
    box(x + 1.6, y + stem * 0.3, z, 2.2, 0.5, 0.5, C.steel, { m: 'metal' }),
  ];
}

function knob(x: number, y: number, z: number, dia = 1.6, c = C.charcoal): Part {
  return cyl(x, y, z + 0.4, dia, 0.8, dia, c, { m: 'plastic', rot: [Math.PI / 2, 0, 0] });
}

/** Casters at the corners of a footprint. */
function casters(w: number, d: number, inset = 2): Part[] {
  const out: Part[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const x = sx * (w / 2 - inset),
        z = sz * (d / 2 - inset);
      out.push(box(x, 2.5, z, 2, 0.8, 2, C.metal, { m: 'metal' }), cyl(x, 1.25, z, 2.5, 1, 2.5, C.charcoal, { m: 'rubber', rot: [0, 0, Math.PI / 2] }));
    }
  return out;
}

/** Sideways cylinders (rotated a quarter turn about x or z) are written with y = their center. */
function centerSideways(parts: Part[] | null): Part[] | null {
  if (!parts) return parts;
  const q = (a = 0) => Math.abs(Math.abs(a) - Math.PI / 2) < 1e-3;
  return parts.map((p) => (p.k === 'cyl' && p.rot && (q(p.rot[0]) || q(p.rot[2])) ? { ...p, y: p.y - p.sy / 2 } : p));
}

export const restParts: ModelFn = (def, w, d, h) => centerSideways(build(def, w, d, h));

const build: ModelFn = (def, w, d, h) => {
  const id = def.id;
  switch (def.symbol) {
    // ----------------------------------------------------------------- kitchen
    case 'counter':
      return baseCabinets(w, d, h);
    case 'island': {
      // seating overhang on the front: cabinets only fill the back part
      const ov = Math.min(12, d * 0.3);
      const parts = baseCabinets(w, d, h, { front: ov });
      // end panels down to the floor
      parts.push(box(-w / 2 + 0.6, 0, -ov / 2, 1.2, h - 1.5, d - ov, CAB_EDGE, { m: 'wood' }), box(w / 2 - 0.6, 0, -ov / 2, 1.2, h - 1.5, d - ov, CAB_EDGE, { m: 'wood' }));
      return parts;
    }
    case 'sink-kitchen': {
      const parts = baseCabinets(w, d, h, { sink: true });
      const bw = Math.min(w - 6, 30);
      // undermount basin: dark recess in the top plus rim
      parts.push(rbox(0, h - 0.2, 1, bw, 0.25, d - 9, C.steel, { m: 'metal', r: 0.1 }));
      parts.push(rbox(0, h - 0.1, 1, bw - 1.5, 0.25, d - 10.5, '#7c8187', { m: 'metal', r: 1.5 }));
      parts.push(...faucet(0, h, -d / 2 + 2.5, 8));
      return parts;
    }
    case 'range': {
      const out: Part[] = [
        rbox(0, 0, 0, w, h - 1, d, APPL, { m: 'metal', r: 0.4 }),
        box(0, h - 1, 0, w, 1, d, C.black, { m: 'gloss' }),
        rbox(0, h - 1, -d / 2 + 1.25, w, 7, 2.5, APPL, { m: 'metal', r: 0.4 }), // backguard
        // oven door
        rbox(0, 5, d / 2, w - 2, h - 16, 1, C.charcoal, { m: 'gloss', r: 0.5 }),
        box(0, 9, d / 2 + 0.6, w - 9, h - 26, 0.2, '#111317', { m: 'glass' }),
        ...pull(0, h - 13, d / 2 + 0.5, w - 6),
        box(0, 0.5, d / 2 - 0.5, w - 2, 3.5, 0.6, C.charcoal, { m: 'plastic' }), // drawer
      ];
      // burners + grates
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const x = (sx * w) / 4.2,
            z = (sz * d) / 4.6 + 1;
          out.push(cyl(x, h, z, 4, 0.5, 4, C.charcoal, { m: 'metal' }), torus(x, h + 0.6, z, 8, 0.5, 8, C.black, { m: 'metal', tube: 0.08 }));
          out.push(box(x, h + 0.4, z, 9, 0.4, 0.4, C.black, { m: 'metal' }), box(x, h + 0.4, z, 0.4, 0.4, 9, C.black, { m: 'metal' }));
        }
      // knobs on the front lip
      for (let i = 0; i < 4; i++) out.push(knob(-w / 2 + 4 + (i * (w - 8)) / 3, h - 4, d / 2, 1.6));
      return out;
    }
    case 'fridge': {
      const out: Part[] = [rbox(0, 0, -0.5, w, h, d - 1, APPL, { m: 'metal', r: 0.8 })];
      const fz = d / 2 - 1;
      if (w >= 33) {
        // French doors over a freezer drawer
        const split = h * 0.36;
        out.push(rbox(0, 1, fz, w - 0.6, split - 1.5, 1.2, APPL, { m: 'metal', r: 0.5 }), ...pull(0, split - 4, fz + 0.6, w * 0.5));
        out.push(rbox(-w / 4, split, fz, w / 2 - 0.4, h - split - 0.5, 1.2, APPL, { m: 'metal', r: 0.5 }), rbox(w / 4, split, fz, w / 2 - 0.4, h - split - 0.5, 1.2, APPL, { m: 'metal', r: 0.5 }));
        out.push(...pull(-1.6, split + 4, fz + 0.6, h * 0.35, true), ...pull(1.6, split + 4, fz + 0.6, h * 0.35, true));
      } else {
        const split = h * 0.7;
        out.push(rbox(0, 1, fz, w - 0.6, split - 1.5, 1.2, APPL, { m: 'metal', r: 0.5 }), rbox(0, split, fz, w - 0.6, h - split - 0.5, 1.2, APPL, { m: 'metal', r: 0.5 }));
        out.push(...pull(w / 2 - 3, split - 22, fz + 0.6, 18, true), ...pull(w / 2 - 3, split + 3, fz + 0.6, 10, true));
      }
      out.push(box(0, 0, d / 2 - 0.8, w - 2, 1, 0.5, C.charcoal, { m: 'plastic' })); // grille
      return out;
    }
    case 'dishwasher':
      return [
        box(0, 0, -1, w - 0.4, 4, d - 3, C.charcoal, { m: 'plastic' }),
        box(0, 4, -0.5, w - 0.4, h - 5.5, d - 1, APPL, { m: 'metal' }),
        rbox(0, 4, d / 2 - 0.6, w - 0.6, h - 5.5, 1, APPL, { m: 'metal', r: 0.3 }),
        ...pull(0, h - 6, d / 2 - 0.1, w - 6),
        rbox(0, h - 1.5, 0, w, 1.5, d, TOP, { m: 'stone', r: 0.3 }),
      ];

    // -------------------------------------------------------------------- bath
    case 'toilet': {
      const tankD = 8;
      const tz = -d / 2 + tankD / 2 + 0.5;
      const bz = -d / 2 + tankD + (d - tankD) / 2 - 1.5;
      const bowlD = d - tankD - 1;
      return [
        rbox(0, 16, tz, w - 1, 13, tankD, C.white, { m: 'ceramic', r: 1.2 }),
        rbox(0, 29, tz, w - 0.4, 1, tankD + 0.6, C.white, { m: 'ceramic', r: 0.5 }), // lid
        box(-w / 2 + 2.5, 25, tz + tankD / 2 + 0.3, 2.2, 0.6, 0.8, C.chrome, { m: 'chrome' }), // flush lever
        cyl(0, 0, bz - 2, w * 0.45, 8, bowlD * 0.45, C.white, { m: 'ceramic', taper: 1.25 }), // pedestal
        sph(0, 11.5, bz, w * 0.82, 8, bowlD, C.white, { m: 'ceramic' }), // bowl
        torus(0, 15.3, bz, w * 0.82, 1.2, bowlD, C.white, { m: 'plastic', tube: 0.2 }), // seat
        cyl(0, 15.6, bz + 0.3, w * 0.8, 0.7, bowlD - 1.2, C.offwhite, { m: 'plastic' }), // lid closed (oval, like the seat)
        rbox(0, 14, -d / 2 + tankD + 1, w * 0.55, 3, 3, C.white, { m: 'ceramic', r: 1 }),
      ];
    }
    case 'vanity': {
      const out: Part[] = [box(0, 0, -1, w - 1, 4, d - 3, C.charcoal, { m: 'plastic' }), box(0, 4, -0.5, w - 0.4, h - 5.5, d - 1, C.oak, { m: 'wood' })];
      const fz = d / 2 - 0.5;
      const doors = Math.max(1, Math.round(w / 18));
      const dw = (w - 0.6) / doors;
      for (let i = 0; i < doors; i++) {
        const x = -w / 2 + 0.3 + dw * (i + 0.5);
        out.push(rbox(x, 4.5, fz, dw - 0.3, h - 7, 0.8, C.woodLight, { m: 'wood', r: 0.2 }));
        out.push(...pull(i % 2 ? x - dw / 2 + 1.5 : x + dw / 2 - 1.5, h - 12, fz + 0.4, 4, true));
      }
      out.push(rbox(0, h - 1.5, 0, w, 1.5, d, C.offwhite, { m: 'stone', r: 0.3 }));
      const sinks = w >= 58 ? [-w / 4, w / 4] : [0];
      for (const sx of sinks) {
        out.push(rbox(sx, h - 0.1, 1.5, 15, 0.3, 11, C.white, { m: 'ceramic', r: 3 }), rbox(sx, h, 1.5, 13.5, 0.3, 9.5, '#cfd3d6', { m: 'ceramic', r: 3 }));
        out.push(...faucet(sx, h, -d / 2 + 2.5, 5, 6));
      }
      return out;
    }
    case 'tub': {
      if (id === 'hot-tub') {
        const out: Part[] = [rbox(0, 0, 0, w, h - 3, d, C.walnut, { m: 'wood', r: 3 }), rbox(0, h - 4, 0, w, 4, d, '#4a4d52', { m: 'plastic', r: 2 })];
        out.push(rbox(0, h - 4.5, 0, w - 10, 1, d - 10, '#6aa9c9', { m: 'glass', r: 4 }), rbox(0, h - 12, 0, w - 10, 7, d - 10, '#4f8fb3', { m: 'gloss', r: 4 }));
        for (let i = 0; i < 6; i++) out.push(box(-w / 2 + 0.5, 3 + i * ((h - 10) / 6), 0, 0.5, 0.6, d - 4, C.woodDark, { m: 'wood' }));
        return out;
      }
      if (id === 'tub-soaker') {
        return [
          cyl(0, 0, 0, w, h - 2, d, C.white, { m: 'ceramic', taper: 1.08 }),
          torus(0, h - 1, 0, w, 2, d, C.white, { m: 'ceramic', tube: 0.06 }),
          cyl(0, h - 9, 0, w - 4, 7.5, d - 4, '#d7dde0', { m: 'ceramic' }),
          // floor-mount filler at the foot end
          cyl(-w / 2 + 3, 0, -d / 2 + 3, 1.2, h + 10, 1.2, C.chrome, { m: 'chrome' }),
        ];
      }
      const t = 3;
      return [
        rbox(0, 0, 0, w, 2.5, d, C.white, { m: 'ceramic', r: 0.5 }),
        box(0, 2.5, -d / 2 + t / 2, w, h - 2.5, t, C.white, { m: 'ceramic' }),
        box(0, 2.5, d / 2 - t / 2, w, h - 2.5, t, C.white, { m: 'ceramic' }), // apron
        box(-w / 2 + 4, 2.5, 0, 8, h - 2.5, d, C.white, { m: 'ceramic' }), // drain end (thicker deck)
        box(w / 2 - t / 2, 2.5, 0, t, h - 2.5, d, C.white, { m: 'ceramic' }),
        rbox(1.5, 2.5, 0, w - 13, 1, d - 2 * t, '#dfe4e6', { m: 'ceramic', r: 0.5 }), // inner floor
        cyl(-w / 2 + 4, h + 4, -d / 2 + 1.5, 1.2, 1.2, 4, C.chrome, { m: 'chrome', rot: [Math.PI / 2, 0, 0] }), // spout
        cyl(-w / 2 + 4, h + 9, -d / 2 + 0.8, 2.2, 0.8, 2.2, C.chrome, { m: 'chrome', rot: [Math.PI / 2, 0, 0] }), // valve
        cyl(-w / 2 + 9, 3, 0, 1.6, 0.2, 1.6, C.chrome, { m: 'chrome' }), // drain
      ];
    }
    case 'shower': {
      const out: Part[] = [rbox(0, 0, 0, w, 3, d, C.white, { m: 'ceramic', r: 0.6 }), cyl(0, 3, 0, 2.5, 0.2, 2.5, C.chrome, { m: 'chrome' })];
      // glass front (fixed panel + door) and one side, with thin chrome frame
      out.push(box(0, 3, d / 2 - 0.3, w, h - 3, 0.4, '#bcd3de', { m: 'glass' }), box(w / 2 - 0.3, 3, 0, 0.4, h - 3, d, '#bcd3de', { m: 'glass' }));
      out.push(box(0, h - 0.8, d / 2 - 0.3, w, 0.8, 0.8, C.chrome, { m: 'chrome' }), box(w / 2 - 0.3, h - 0.8, 0, 0.8, 0.8, d, C.chrome, { m: 'chrome' }));
      out.push(box(-w / 2 + 0.4, 3, d / 2 - 0.3, 0.8, h - 3.8, 0.8, C.chrome, { m: 'chrome' }), box(w / 2 - 0.3, 3, d / 2 - 0.3, 0.8, h - 3.8, 0.8, C.chrome, { m: 'chrome' }));
      out.push(box(-w / 6, 30, d / 2 + 0.3, 0.6, 14, 0.8, C.chrome, { m: 'chrome' })); // door handle
      // head on an arm, valve
      out.push(box(0, h - 8, -d / 2 + 4, 1, 1, 7, C.chrome, { m: 'chrome' }), cyl(0, h - 9, -d / 2 + 7.5, 6, 0.8, 6, C.chrome, { m: 'chrome' }));
      out.push(cyl(0, 44, -d / 2 + 0.5, 3, 1, 3, C.chrome, { m: 'chrome', rot: [Math.PI / 2, 0, 0] }));
      return out;
    }

    // ----------------------------------------------------------------- laundry
    case 'washer':
    case 'dryer': {
      const unit = (y: number, hh: number, dryer: boolean): Part[] => [
        rbox(0, y, 0, w, hh, d, C.white, { m: 'gloss', r: 1 }),
        box(0, y + hh - 6, d / 2 + 0.05, w - 1.5, 5, 0.2, '#d7d9dc', { m: 'plastic' }), // control panel
        knob(w / 2 - 5, y + hh - 4.5, d / 2, 2.4, C.steel),
        box(-w / 6, y + hh - 4, d / 2 + 0.2, 6, 1.6, 0.3, '#1d2a35', { m: 'screen' }),
        torus(0, y + (hh - 6) / 2 + 0.5, d / 2 + 0.6, 16, 1.4, 16, C.steel, { m: 'chrome', tube: 0.1, rot: [Math.PI / 2, 0, 0] }),
        cyl(0, y + (hh - 6) / 2 + 0.5, d / 2 + 0.3, 13.5, 0.6, 13.5, dryer ? '#3a3d43' : '#5f7d91', { m: 'glass', rot: [Math.PI / 2, 0, 0] }),
      ];
      if (h > 50) return [...unit(0, h / 2, false), ...unit(h / 2, h / 2, true)];
      return unit(0, h, def.symbol === 'dryer');
    }
    case 'water-heater':
      return [
        cyl(0, 0, 0, w, h - 3, d, C.white, { m: 'gloss' }),
        cyl(0, h - 3, 0, w - 1, 3, d - 1, C.white, { m: 'gloss', taper: 0.8 }),
        cyl(-4, h, 0, 1.2, 8, 1.2, '#b87333', { m: 'metal' }),
        cyl(4, h, 0, 1.2, 8, 1.2, '#b87333', { m: 'metal' }),
        cyl(0, h, 0, 3.5, 6, 3.5, C.metal, { m: 'metal' }), // flue
        box(0, 10, d / 2 - 1.5, 6, 8, 2, C.charcoal, { m: 'plastic' }), // control
        rbox(0, 4, d / 2 - 1, 8, 3, 1, '#b52f2f', { m: 'plastic', r: 0.4 }),
      ];

    // ---------------------------------------------------------------- workshop
    case 'workbench': {
      if (id === 'table-saw') {
        return [
          // stand
          ...legs(w * 0.8, d * 0.8, h - 14, 1.6, C.charcoal, 0, 0, 0, { m: 'metal' }),
          box(0, h - 14, 0, w * 0.7, 10, d * 0.7, '#e2b23b', { m: 'plastic' }), // motor housing (yellow)
          rbox(0, h - 4, 0, w, 2.5, d, '#c3c7cc', { m: 'metal', r: 0.4 }), // cast top
          box(0, h - 1.5, 0, w * 0.86, 1.5, d - 2, '#aeb3b8', { m: 'metal' }),
          box(0, h, -2, 0.2, 4, 9, '#9aa0a6', { m: 'chrome' }), // blade
          rbox(0, h + 0.8, -2, 3, 5, 12, '#d9e6ee', { m: 'glass', r: 1 }), // guard
          box(w / 4, h, 0, 2, 3, d, '#d23a2c', { m: 'metal' }), // fence
          box(-w / 4, h - 0.2, d / 4, 1, 0.6, 6, C.charcoal, { m: 'metal' }), // miter
          knob(0, h - 9, d * 0.35, 4, C.charcoal),
          box(0, 0, 0, w * 0.82, 1, d * 0.82, C.charcoal, { m: 'metal' }),
        ].map((p) => (p.y + p.sy > h ? { ...p, sy: Math.max(0.2, h - p.y) } : p));
      }
      const topT = 2.5;
      return [
        rbox(0, h - topT, 0, w, topT, d, C.woodLight, { m: 'wood', r: 0.3 }),
        box(0, h - topT - 3, d / 2 - 2, w - 6, 3, 1.5, C.wood, { m: 'wood' }), // apron
        ...legs(w, d, h - topT, 3.5, C.wood, 1.5),
        box(0, 8, 0, w - 6, 1, d - 4, C.wood, { m: 'wood' }), // lower shelf
        box(0, 10, -1, w * 0.3, 6, d * 0.5, '#7d6a52', { m: 'wood' }), // stuff on shelf (lumber offcuts)
        // vise at the front-left corner
        box(-w / 2 + 9, h - 4.5, d / 2 + 0, 9, 4.5, 3, '#3d6fb5', { m: 'metal' }),
        box(-w / 2 + 9, h - 4.5, d / 2 - 2, 9, 4.5, 1.5, '#3d6fb5', { m: 'metal' }),
        cyl(-w / 2 + 9, h - 2.5, d / 2 + 0.5, 0.8, 4, 0.8, C.chrome, { m: 'chrome', rot: [Math.PI / 2, 0, 0] }),
        // a few tools on top
        box(w / 4, h, 0, 10, 1.5, 3, C.charcoal, { m: 'metal' }),
        box(w / 4 + 6, h, 3, 1, 1, 8, '#c94a3a', { m: 'plastic' }),
      ];
    }
    case 'tool-chest': {
      if (id === 'drill-press') {
        return [
          rbox(0, 0, 0, w, 2, d, C.charcoal, { m: 'metal', r: 0.5 }),
          cyl(0, 2, -d / 4, 3, h - 14, 3, C.chrome, { m: 'chrome' }), // column
          box(0, 24, -d / 4 + 4, 4, 2, 8, C.charcoal, { m: 'metal' }),
          cyl(0, 26, d / 8, 10, 1.2, 10, C.steel, { m: 'metal' }), // table
          rbox(0, h - 14, 0, w - 1, 12, d - 4, '#2f6aa8', { m: 'metal', r: 2 }), // head
          rbox(0, h - 4, -d / 4, w - 3, 4, 8, '#2f6aa8', { m: 'metal', r: 1.5 }), // belt cover
          cyl(0, h - 20, d / 8, 1, 6, 1, C.chrome, { m: 'chrome' }), // chuck
          box(w / 2 - 1, h - 10, 0, 6, 0.6, 0.6, C.chrome, { m: 'chrome' }), // feed handles
        ];
      }
      if (id === 'bandsaw') {
        return [
          box(0, 0, 0, w * 0.7, 24, d * 0.7, C.charcoal, { m: 'metal' }), // stand
          rbox(-w * 0.15, 24, 0, w * 0.5, h - 26, d * 0.45, '#e1e3e6', { m: 'metal', r: 4 }), // C frame body
          rbox(-w * 0.15, h - 12, 0, w * 0.6, 10, d * 0.45, '#e1e3e6', { m: 'metal', r: 4 }),
          rbox(w * 0.05, 40, 0, w * 0.75, 2, d * 0.8, '#b5babf', { m: 'metal', r: 0.5 }), // table
          box(w * 0.18, 42, 0, 0.2, h - 56, 0.6, C.chrome, { m: 'chrome' }), // blade
          box(-w * 0.3, 30, d * 0.24, 3, 4, 2, '#d23a2c', { m: 'plastic' }), // switch
        ];
      }
      const body = h;
      const out: Part[] = [...casters(w, d, 3), rbox(0, 4, 0, w, body - 4.8, d, C.red, { m: 'gloss', r: 0.8 })];
      const n = Math.max(4, Math.round((body - 8) / 4.5));
      const dh = (body - 8) / n;
      for (let i = 0; i < n; i++) {
        const y = 5 + i * dh;
        out.push(box(0, y + 0.3, d / 2 + 0.05, w - 2, dh - 0.6, 0.3, '#b84444', { m: 'gloss' }));
        out.push(box(0, y + dh - 1.6, d / 2 + 0.5, w - 6, 0.5, 0.8, C.chrome, { m: 'chrome' }));
      }
      out.push(rbox(0, body - 0.8, 0, w, 0.8, d, C.charcoal, { m: 'rubber', r: 0.3 }));
      return out;
    }
    case 'pegboard': {
      const out: Part[] = [box(0, 0, -d / 2 + 0.4, w, h, 0.6, '#b48c5c', { m: 'wood' }), box(0, 0, -d / 2 + 0.05, w + 1, h + 1, 0.1, C.woodDark, { m: 'wood' })];
      // dot grid (sparse so it reads but stays cheap)
      for (let x = -w / 2 + 3; x < w / 2 - 1; x += 6) for (let y = 3; y < h - 1; y += 6) out.push(box(x, y, -d / 2 + 0.75, 0.5, 0.5, 0.1, '#5a4430', { m: 'paper' }));
      const fz = -d / 2 + 1.5;
      out.push(rbox(-w / 3, h * 0.35, fz, 1.6, h * 0.45, 1.2, C.red, { m: 'plastic', r: 0.5 }), box(-w / 3, h * 0.8, fz, 4, 2, 1, C.steel, { m: 'metal' })); // hammer
      out.push(box(-w / 8, h * 0.4, fz, 1, h * 0.4, 0.6, '#d9b13b', { m: 'plastic' }), box(-w / 8 + 2, h * 0.4, fz, 1, h * 0.35, 0.6, '#3a74c4', { m: 'plastic' })); // screwdrivers
      out.push(box(w / 6, h * 0.55, fz, 9, 0.8, 0.6, C.steel, { m: 'metal' }), box(w / 6, h * 0.45, fz, 7, 0.8, 0.6, C.steel, { m: 'metal' }), box(w / 6, h * 0.35, fz, 5, 0.8, 0.6, C.steel, { m: 'metal' })); // wrenches
      out.push(torus(w / 2.6, h * 0.55, fz, 8, 1, 8, '#2b2b2b', { m: 'rubber', tube: 0.15, rot: [Math.PI / 2, 0, 0] })); // tape / cord loop
      out.push(rbox(w / 2.6, h * 0.12, fz, 7, 5, 4, '#e2b23b', { m: 'plastic', r: 0.8 })); // drill
      return out;
    }

    // ----------------------------------------------------------- hobby & games
    case 'pool-table': {
      const railW = 5;
      const bodyY = 12;
      const out: Part[] = [
        // chunky turned legs
        ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cyl((sx * (w - 12)) / 2, 0, (sz * (d - 12)) / 2, 7, bodyY + 1, 7, C.walnut, { m: 'wood', taper: 0.7 }))),
        rbox(0, bodyY, 0, w - 4, h - bodyY - 3, d - 4, C.walnut, { m: 'wood', r: 1.5 }), // apron/body
        // rails: four strips around the bed
        rbox(0, h - 3, -d / 2 + railW / 2, w, 3, railW, C.walnut, { m: 'wood', r: 1 }),
        rbox(0, h - 3, d / 2 - railW / 2, w, 3, railW, C.walnut, { m: 'wood', r: 1 }),
        rbox(-w / 2 + railW / 2, h - 3, 0, railW, 3, d - 2 * railW, C.walnut, { m: 'wood', r: 1 }),
        rbox(w / 2 - railW / 2, h - 3, 0, railW, 3, d - 2 * railW, C.walnut, { m: 'wood', r: 1 }),
        box(0, h - 3, 0, w - 2 * railW, 2.2, d - 2 * railW, C.felt, { m: 'fabric' }), // bed
        box(0, h - 0.2, -d / 2 + railW + 0.8, w - 2 * railW - 4, 0.6, 1.4, '#255a3a', { m: 'fabric' }), // cushions
        box(0, h - 0.2, d / 2 - railW - 0.8, w - 2 * railW - 4, 0.6, 1.4, '#255a3a', { m: 'fabric' }),
        box(-w / 2 + railW + 0.8, h - 0.2, 0, 1.4, 0.6, d - 2 * railW - 4, '#255a3a', { m: 'fabric' }),
        box(w / 2 - railW - 0.8, h - 0.2, 0, 1.4, 0.6, d - 2 * railW - 4, '#255a3a', { m: 'fabric' }),
      ];
      // six pockets
      for (const px of [-w / 2 + railW, 0, w / 2 - railW])
        for (const pz of [-d / 2 + railW, d / 2 - railW]) out.push(cyl(px, h - 2.6, pz, 4.5, 2.7, 4.5, '#111214', { m: 'rubber' }));
      // diamonds on rails
      for (let i = 1; i < 8; i++) if (i !== 4) out.push(box(-w / 2 + (i * w) / 8, h, -d / 2 + 2.5, 0.8, 0.1, 0.8, '#efe7cf', { m: 'ceramic' }), box(-w / 2 + (i * w) / 8, h, d / 2 - 2.5, 0.8, 0.1, 0.8, '#efe7cf', { m: 'ceramic' }));
      // a racked triangle of balls and the cue ball
      const ballC = ['#e8c547', '#2e5fb0', '#c8352e', '#5b2e86', '#e07b28', '#2b8a4a', '#7a2424', '#111111', '#e8c547', '#2e5fb0', '#c8352e', '#5b2e86', '#e07b28', '#2b8a4a', '#7a2424'];
      let k = 0;
      for (let row = 0; row < 5; row++)
        for (let j = 0; j <= row; j++) out.push(sph(w / 4 + row * 2, h - 0.8 + 1.1, (j - row / 2) * 2.3, 2.2, 2.2, 2.2, ballC[k++], { m: 'gloss' }));
      out.push(sph(-w / 4, h - 0.8 + 1.1, 0, 2.2, 2.2, 2.2, '#f7f5ee', { m: 'gloss' }));
      return out;
    }
    case 'ping-pong': {
      if (id === 'foosball') {
        const fieldY = h - 9;
        const out: Part[] = [
          ...legs(w - 6, d - 6, fieldY, 3, C.charcoal, 0, 0, 0, { m: 'metal' }),
          box(0, fieldY - 2, 0, w, 2, d, C.walnut, { m: 'wood' }), // floor of the box
          box(0, fieldY, 0, w - 3, 0.3, d - 3, C.felt, { m: 'fabric' }),
          box(0, fieldY - 2, -d / 2 + 0.75, w, h - fieldY + 2, 1.5, C.walnut, { m: 'wood' }), // long sides
          box(0, fieldY - 2, d / 2 - 0.75, w, h - fieldY + 2, 1.5, C.walnut, { m: 'wood' }),
          box(-w / 2 + 0.75, fieldY - 2, 0, 1.5, h - fieldY + 2, d - 3, C.walnut, { m: 'wood' }), // ends, with goals
          box(w / 2 - 0.75, fieldY - 2, 0, 1.5, h - fieldY + 2, d - 3, C.walnut, { m: 'wood' }),
          box(-w / 2 + 1.6, fieldY + 0.3, 0, 0.2, 3, 8, C.black, { m: 'plastic' }),
          box(w / 2 - 1.6, fieldY + 0.3, 0, 0.2, 3, 8, C.black, { m: 'plastic' }),
          box(0, fieldY + 0.32, 0, 0.3, 0.02, d - 4, C.white, { m: 'paper' }),
        ];
        for (let i = 0; i < 8; i++) {
          const x = -w / 2 + 5 + (i * (w - 10)) / 7;
          const rodY = h - 4;
          out.push(cyl(x, rodY, 0, 0.6, d + 6, 0.6, C.chrome, { m: 'metal', rot: [Math.PI / 2, 0, 0] }));
          out.push(cyl(x, rodY, d / 2 + 2.5, 1.4, 4, 1.4, C.black, { m: 'rubber', rot: [Math.PI / 2, 0, 0] })); // handle
          const n = [1, 2, 3, 5, 5, 3, 2, 1][i];
          const col = i % 2 ? '#c8352e' : '#2e5fb0';
          for (let j = 0; j < n; j++) {
            const z = ((j + 0.5) / n - 0.5) * (d - 8);
            out.push(rbox(x, fieldY + 0.6, z, 1, rodY - fieldY + 1, 1.6, col, { m: 'plastic', r: 0.4 }), sph(x, rodY + 1.6, z, 1.6, 1.6, 1.6, '#e8c9a8', { m: 'plastic' }));
          }
        }
        return out;
      }
      if (id === 'air-hockey') {
        return [
          rbox(0, 0, 0, w * 0.85, h - 8, d * 0.8, C.charcoal, { m: 'plastic', r: 2 }),
          rbox(0, h - 8, 0, w, 6, d, '#1f4fa0', { m: 'gloss', r: 1.5 }),
          box(0, h - 2, 0, w - 4, 1, d - 4, C.white, { m: 'gloss' }),
          box(0, h - 2, -d / 2 + 1, w, 2, 2, '#1f4fa0', { m: 'plastic' }),
          box(0, h - 2, d / 2 - 1, w, 2, 2, '#1f4fa0', { m: 'plastic' }),
          box(0, h - 0.9, 0, 0.6, 0.1, d - 4, '#c8352e', { m: 'plastic' }),
          torus(0, h - 0.9, 0, 14, 0.2, 14, '#c8352e', { m: 'plastic', tube: 0.05 }),
          cyl(-w / 3, h - 1, 0, 4, 1.5, 4, '#c8352e', { m: 'gloss' }),
          cyl(w / 3, h - 1, 0, 4, 1.5, 4, '#2e5fb0', { m: 'gloss' }),
          cyl(0, h - 1, 3, 2.5, 0.4, 2.5, C.black, { m: 'plastic' }),
        ];
      }
      // ping-pong
      const top = '#1e4f7a';
      return [
        rbox(0, h - 1, 0, w, 1, d, top, { m: 'plastic', r: 0.2 }),
        box(0, h, 0, w - 1, 0.05, 0.6, C.white, { m: 'paper' }),
        box(-w / 2 + 0.4, h, 0, 0.6, 0.05, d, C.white, { m: 'paper' }),
        box(w / 2 - 0.4, h, 0, 0.6, 0.05, d, C.white, { m: 'paper' }),
        box(0, h, -d / 2 + 0.4, w, 0.05, 0.6, C.white, { m: 'paper' }),
        box(0, h, d / 2 - 0.4, w, 0.05, 0.6, C.white, { m: 'paper' }),
        // net
        box(0, h, 0, 0.3, 6, d, '#eef0f2', { m: 'fabric' }),
        box(0, h + 5.6, 0, 0.6, 0.4, d, C.white, { m: 'fabric' }),
        // undercarriage: two leg frames
        ...[-1, 1].flatMap((s) => [
          box((s * w) / 3, 0, -d / 2 + 6, 1.5, h - 1, 1.5, C.charcoal, { m: 'metal' }),
          box((s * w) / 3, 0, d / 2 - 6, 1.5, h - 1, 1.5, C.charcoal, { m: 'metal' }),
          box((s * w) / 3, 10, 0, 1.5, 1.5, d - 12, C.charcoal, { m: 'metal' }),
          cyl((s * w) / 3, 1.5, -d / 2 + 6, 3, 1.5, 3, C.black, { m: 'rubber', rot: [0, 0, Math.PI / 2] }),
          cyl((s * w) / 3, 1.5, d / 2 - 6, 3, 1.5, 3, C.black, { m: 'rubber', rot: [0, 0, Math.PI / 2] }),
        ]),
        rbox(w / 4, h + 0.1, d / 4, 6, 0.6, 10, '#b5332c', { m: 'rubber', r: 0.3 }),
        sph(-w / 5, h + 0.8, -d / 6, 1.6, 1.6, 1.6, '#f7f5ee', { m: 'gloss' }),
      ];
    }
    case 'arcade': {
      const out: Part[] = [
        // side panels with the classic profile: deep at the bottom, recess at the control deck
        box(-w / 2 + 0.4, 0, 0, 0.8, 34, d, C.black, { m: 'wood' }),
        box(w / 2 - 0.4, 0, 0, 0.8, 34, d, C.black, { m: 'wood' }),
        box(-w / 2 + 0.4, 34, -d / 2 + (d - 8) / 2, 0.8, h - 34, d - 8, C.black, { m: 'wood' }),
        box(w / 2 - 0.4, 34, -d / 2 + (d - 8) / 2, 0.8, h - 34, d - 8, C.black, { m: 'wood' }),
        box(0, 0, -1, w - 1.6, 34, d - 2, '#1c1d22', { m: 'wood' }),
        box(0, 34, -d / 2 + 10, w - 1.6, h - 34, 20, '#1c1d22', { m: 'wood' }), // upper cabinet, recessed behind the screen
        // control deck, angled
        rbox(0, 34, d / 2 - 6, w - 1.6, 2, 10, '#2c3e8c', { m: 'plastic', r: 0.4, rot: [0.18, 0, 0] }),
        cyl(-w / 4, 36, d / 2 - 6, 1, 3, 1, C.black, { m: 'plastic' }),
        sph(-w / 4, 39.5, d / 2 - 6, 1.8, 1.8, 1.8, '#c8352e', { m: 'gloss' }),
        ...[0, 1, 2].map((i) => cyl(w * 0.02 + i * 3, 36, d / 2 - 6 + (i % 2) * 1.5, 1.6, 0.8, 1.6, ['#e8c547', '#2e9b4a', '#2e5fb0'][i], { m: 'gloss' })),
        // coin door
        box(0, 14, d / 2 - 0.9, 8, 9, 0.4, '#3a3d43', { m: 'metal' }),
        box(-1.5, 18, d / 2 - 0.6, 1, 2, 0.3, '#d23a2c', { m: 'glow' }),
        box(1.5, 18, d / 2 - 0.6, 1, 2, 0.3, '#d23a2c', { m: 'glow' }),
        // angled screen
        box(0, 40, -d / 2 + 21, w - 2, 19, 1, '#0b0d12', { m: 'screen', rot: [-0.3, 0, 0] }),
        box(0, 41.5, -d / 2 + 21.6, w - 5, 15, 0.3, '#16386a', { m: 'glow', rot: [-0.3, 0, 0] }),
        // marquee box overhanging the screen
        box(0, h - 10, -d / 2 + 22, w - 1.6, 9, 8, '#141419', { m: 'wood' }),
        box(0, h - 9, -d / 2 + 26.2, w - 3, 6.5, 0.3, '#f2b632', { m: 'glow' }),
        box(0, h - 1, -4, w, 1, d - 8, C.black, { m: 'wood' }),
      ];
      return out;
    }

    // ------------------------------------------------------------------ fitness
    case 'treadmill': {
      const deckL = d - 10;
      const dz = d / 2 - deckL / 2;
      return [
        rbox(0, 0, dz, w - 4, 7, deckL, C.charcoal, { m: 'plastic', r: 1.5 }),
        box(0, 7, dz + 1, w - 12, 0.4, deckL - 6, '#18191c', { m: 'rubber' }), // belt
        box(-w / 2 + 3.5, 6.5, dz, 3, 1, deckL - 4, C.graphite, { m: 'plastic' }),
        box(w / 2 - 3.5, 6.5, dz, 3, 1, deckL - 4, C.graphite, { m: 'plastic' }),
        rbox(0, 0, -d / 2 + 6, w - 2, 9, 10, C.graphite, { m: 'plastic', r: 2 }), // motor hood
        // uprights
        rbox(-w / 2 + 2, 6, -d / 2 + 6, 2.5, h - 18, 3, C.steel, { m: 'metal', r: 0.6, rot: [-0.15, 0, 0] }),
        rbox(w / 2 - 2, 6, -d / 2 + 6, 2.5, h - 18, 3, C.steel, { m: 'metal', r: 0.6, rot: [-0.15, 0, 0] }),
        // handrails
        rbox(-w / 2 + 2, h - 22, -d / 2 + 14, 2, 2, 14, C.charcoal, { m: 'rubber', r: 0.8 }),
        rbox(w / 2 - 2, h - 22, -d / 2 + 14, 2, 2, 14, C.charcoal, { m: 'rubber', r: 0.8 }),
        // console
        rbox(0, h - 14, -d / 2 + 4, w - 2, 10, 7, C.charcoal, { m: 'plastic', r: 1.5, rot: [0.4, 0, 0] }),
        box(0, h - 11, -d / 2 + 7, w * 0.45, 4.5, 0.4, '#13305a', { m: 'screen', rot: [0.4, 0, 0] }),
        // front feet/wheels
        cyl(-w / 2 + 4, 1.5, -d / 2 + 2, 3, 2, 3, C.black, { m: 'rubber', rot: [0, 0, Math.PI / 2] }),
        cyl(w / 2 - 4, 1.5, -d / 2 + 2, 3, 2, 3, C.black, { m: 'rubber', rot: [0, 0, Math.PI / 2] }),
      ];
    }
    case 'bike': {
      if (id === 'rower') {
        return [
          rbox(0, 0, d / 2 - 8, 14, 2, 4, C.charcoal, { m: 'metal', r: 0.6 }), // rear foot
          rbox(0, 2, 6, 4, 4, d - 28, C.steel, { m: 'metal', r: 1, rot: [-0.08, 0, 0] }), // rail
          rbox(0, 9, 14, 12, 3, 13, C.black, { m: 'leather', r: 1.5 }), // seat
          cyl(0, 11, -d / 2 + 11, 20, 8, 20, '#2b2d31', { m: 'plastic', rot: [0, 0, Math.PI / 2] }), // flywheel housing
          rbox(0, 0, -d / 2 + 11, 18, 2, 6, C.charcoal, { m: 'metal', r: 0.6 }),
          box(0, 6, -d / 2 + 22, 18, 1, 6, C.charcoal, { m: 'plastic', rot: [0.5, 0, 0] }), // footrests
          rbox(0, 14, -d / 2 + 22, 20, 1.2, 1.2, C.black, { m: 'rubber', r: 0.5 }), // handle
          box(0, 16, -d / 2 + 6, 7, 5, 1, '#13305a', { m: 'screen', rot: [-0.3, 0, 0] }),
        ];
      }
      return [
        rbox(0, 0, d / 2 - 4, w, 2, 4, C.charcoal, { m: 'metal', r: 0.8 }), // rear stabilizer
        rbox(0, 0, -d / 2 + 4, w, 2, 4, C.charcoal, { m: 'metal', r: 0.8 }), // front stabilizer
        rbox(0, 2, 0, 3, 3, d - 10, C.steel, { m: 'metal', r: 1 }), // base beam
        cyl(0, 14, -d / 2 + 12, 16, 3.5, 16, C.charcoal, { m: 'metal', rot: [0, 0, Math.PI / 2] }), // flywheel
        torus(0, 14, -d / 2 + 12, 16, 3.5, 16, C.chrome, { m: 'chrome', tube: 0.08, rot: [0, 0, Math.PI / 2] }),
        rbox(0, 4, 4.5, 3, 28, 3, C.steel, { m: 'metal', r: 1, rot: [0.25, 0, 0] }), // seat post
        rbox(0, 31, 8, 9, 3, 11, C.black, { m: 'leather', r: 1.5 }), // saddle
        rbox(0, 4, -d / 2 + 12, 3, h - 10, 3, C.steel, { m: 'metal', r: 1, rot: [-0.18, 0, 0] }), // front post
        rbox(0, h - 6, -d / 2 + 9, w - 2, 1.5, 1.5, C.black, { m: 'rubber', r: 0.6 }), // handlebar
        rbox(0, h - 6, -d / 2 + 6, 2, 1.5, 7, C.black, { m: 'rubber', r: 0.6 }),
        box(0, h - 4, -d / 2 + 11, 6, 4, 1, '#13305a', { m: 'screen', rot: [-0.4, 0, 0] }),
        // crank + pedals
        cyl(0, 12, -2, 6, 1, 6, C.chrome, { m: 'chrome', rot: [0, 0, Math.PI / 2] }),
        rbox(-5, 8, -2, 4, 1, 3, C.black, { m: 'rubber', r: 0.4 }),
        rbox(5, 15, -2, 4, 1, 3, C.black, { m: 'rubber', r: 0.4 }),
      ];
    }
    case 'weight-bench': {
      const padW = Math.min(12, w * 0.5);
      return [
        rbox(0, h - 4, 6, padW, 4, d * 0.55, C.black, { m: 'leather', r: 1.5 }), // seat/back pad
        rbox(0, h - 4, -d / 2 + 8, padW, 4, 12, C.black, { m: 'leather', r: 1.5 }),
        box(0, 2, 0, 3, 3, d - 6, C.steel, { m: 'metal' }), // spine
        rbox(0, 0, d / 2 - 3, w, 2.5, 3, C.charcoal, { m: 'metal', r: 0.8 }),
        rbox(0, 0, -d / 2 + 3, w * 0.8, 2.5, 3, C.charcoal, { m: 'metal', r: 0.8 }),
        box(0, 2.5, d / 2 - 6, 2.5, h - 6.5, 2.5, C.steel, { m: 'metal' }),
        box(0, 2.5, -d / 2 + 8, 2.5, h - 6.5, 2.5, C.steel, { m: 'metal' }),
        // leg roller
        cyl(0, 7, d / 2 - 2, 4, 14, 4, C.black, { m: 'rubber', rot: [0, 0, Math.PI / 2] }),
        // a pair of dumbbells beside it
        ...[-1, 1].flatMap((s) => [
          cyl(s * (w / 2 - 2), 0, d / 4 - 4, 4, 4, 4, C.charcoal, { m: 'metal' }),
          cyl(s * (w / 2 - 2), 0, d / 4 + 4, 4, 4, 4, C.charcoal, { m: 'metal' }),
          box(s * (w / 2 - 2), 1.5, d / 4, 1, 1, 8, C.chrome, { m: 'chrome' }),
        ]),
      ];
    }
    case 'rack': {
      if (id !== 'power-rack') return null;
      const post = 3;
      const out: Part[] = [];
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const x = (sx * (w - post)) / 2,
            z = (sz * (d - post)) / 2;
          out.push(box(x, 0, z, post, h, post, C.black, { m: 'metal' }));
          for (let y = 12; y < h - 6; y += 6) out.push(box(x, y, z + (sz * post) / 2 + sz * 0.02, 0.8, 0.8, 0.05, '#555', { m: 'metal' }));
        }
      out.push(box(0, h - post, -(d - post) / 2, w, post, post, C.black, { m: 'metal' }), box(0, h - post, (d - post) / 2, w, post, post, C.black, { m: 'metal' }));
      out.push(box(-(w - post) / 2, 0, 0, post, post, d, C.black, { m: 'metal' }), box((w - post) / 2, 0, 0, post, post, d, C.black, { m: 'metal' }));
      out.push(cyl(0, h - 6, (d - post) / 2 + 1, 1.3, w + 4, 1.3, C.chrome, { m: 'chrome', rot: [0, 0, Math.PI / 2] })); // pull-up bar
      // J-hooks + barbell with plates
      const bz = (d - post) / 2;
      for (const sx of [-1, 1]) out.push(box((sx * (w - post)) / 2, 46, bz + 2.5, 2, 2, 4, C.red, { m: 'metal' }));
      out.push(cyl(0, 48.5, bz + 3.5, 1.1, w + 24 > 86 ? 84 : w + 24, 1.1, C.chrome, { m: 'chrome', rot: [0, 0, Math.PI / 2] }));
      for (const sx of [-1, 1]) {
        out.push(cyl(sx * (w / 2 + 3), 48.5, bz + 3.5, 17.7, 2.5, 17.7, C.black, { m: 'rubber', rot: [0, 0, Math.PI / 2] }));
        out.push(cyl(sx * (w / 2 + 6), 48.5, bz + 3.5, 13, 1.6, 13, '#2e5fb0', { m: 'rubber', rot: [0, 0, Math.PI / 2] }));
      }
      // safeties
      for (const sx of [-1, 1]) out.push(box((sx * (w - post)) / 2, 28, 0, 2, 2, d, C.steel, { m: 'metal' }));
      return out;
    }
    case 'drums': {
      const shell = '#9b2c2c';
      const out: Part[] = [
        // bass drum on its side, facing the front
        cyl(0, 11, -d * 0.12, 20, 14, 20, shell, { m: 'gloss', rot: [Math.PI / 2, 0, 0] }),
        cyl(0, 11, -d * 0.12 - 7.2, 19, 0.4, 19, '#efe9de', { m: 'paper', rot: [Math.PI / 2, 0, 0] }),
        torus(0, 11, -d * 0.12 + 7, 20.5, 1.2, 20.5, C.steel, { m: 'metal', tube: 0.06, rot: [Math.PI / 2, 0, 0] }),
        // floor tom, snare
        cyl(w * 0.3, 0, d * 0.15, 15, 17, 15, shell, { m: 'gloss' }),
        cyl(w * 0.3, 17, d * 0.15, 15.2, 0.3, 15.2, '#efe9de', { m: 'paper' }),
        cyl(-w * 0.25, 18, d * 0.18, 14, 5.5, 14, C.steel, { m: 'metal' }),
        cyl(-w * 0.25, 23.5, d * 0.18, 14.2, 0.3, 14.2, '#efe9de', { m: 'paper' }),
        cyl(-w * 0.25, 0, d * 0.18, 1, 18, 1, C.chrome, { m: 'chrome' }),
        // rack toms on the bass drum
        cyl(-5, 23, -d * 0.12, 10, 8, 10, shell, { m: 'gloss', rot: [0.3, 0, 0] }),
        cyl(6, 23, -d * 0.12, 11, 9, 11, shell, { m: 'gloss', rot: [0.3, 0, 0] }),
        // hi-hat
        cyl(-w * 0.4, 0, -d * 0.05, 1, 34, 1, C.chrome, { m: 'chrome' }),
        cyl(-w * 0.4, 33, -d * 0.05, 14, 0.4, 14, C.brass, { m: 'metal', taper: 0.95 }),
        cyl(-w * 0.4, 34, -d * 0.05, 14, 0.4, 14, C.brass, { m: 'metal', taper: 0.95 }),
        // crash + ride on stands
        cyl(-w * 0.38, 0, -d * 0.38, 1, h - 6, 1, C.chrome, { m: 'chrome' }),
        cyl(-w * 0.38, h - 6, -d * 0.38, 16, 0.4, 16, C.brass, { m: 'metal', rot: [0.2, 0, 0] }),
        cyl(w * 0.38, 0, -d * 0.3, 1, h - 10, 1, C.chrome, { m: 'chrome' }),
        cyl(w * 0.38, h - 10, -d * 0.3, 20, 0.4, 20, C.brass, { m: 'metal', rot: [0.15, 0, 0.1] }),
        // throne
        cyl(0, 0, d * 0.38, 1.2, 18, 1.2, C.chrome, { m: 'chrome' }),
        cyl(0, 18, d * 0.38, 13, 3, 13, C.black, { m: 'leather' }),
      ];
      return out.map((p) => ({ ...p, sx: Math.min(p.sx, w), sz: Math.min(p.sz, d) }));
    }
    case 'easel': {
      const out: Part[] = [
        rbox(-w / 3, 0, 3, 1.5, h, 1.5, C.oak, { m: 'wood', r: 0.4, rot: [0, 0, 0.12] }),
        rbox(w / 3, 0, 3, 1.5, h, 1.5, C.oak, { m: 'wood', r: 0.4, rot: [0, 0, -0.12] }),
        rbox(0, 0, -d / 2 + 4, 1.5, h - 4, 1.5, C.oak, { m: 'wood', r: 0.4, rot: [0.28, 0, 0] }),
        box(0, 26, 5, w * 0.8, 2, 3, C.oak, { m: 'wood' }), // canvas ledge
        box(0, 28, 4.5, w * 0.75, 30, 1, '#f4f1ea', { m: 'paper', rot: [-0.05, 0, 0] }), // canvas
        box(-3, 40, 5.1, 9, 8, 0.1, '#5a8fb8', { m: 'paper', rot: [-0.05, 0, 0] }),
        box(4, 34, 5.1, 7, 6, 0.1, '#d9a441', { m: 'paper', rot: [-0.05, 0, 0] }),
        box(0, h - 10, 4.2, 5, 2, 2, C.oak, { m: 'wood' }), // top clamp
      ];
      return out;
    }

    // --------------------------------------------------------- generic pieces
    case 'generic': {
      if (id === 'hamper') return null;
      if (id === 'shop-vac') {
        return [
          cyl(0, 3, 0, w, h * 0.6, d, '#e2b23b', { m: 'plastic', taper: 0.92 }),
          cyl(0, 3 + h * 0.6, 0, w - 1, h * 0.25, d - 1, C.charcoal, { m: 'plastic', taper: 0.85 }),
          rbox(0, h - 3, 0, w * 0.5, 3, 3, C.charcoal, { m: 'plastic', r: 1 }), // handle
          torus(w / 2 - 2, h * 0.55, d / 4, 6, 1.5, 6, '#222', { m: 'rubber', tube: 0.25, rot: [Math.PI / 2, 0, 0] }),
          ...[0, 1, 2, 3].map((i) => sph(Math.cos((i * Math.PI) / 2) * (w / 2 - 2), 1.5, Math.sin((i * Math.PI) / 2) * (d / 2 - 2), 3, 3, 3, C.black, { m: 'rubber' })),
        ];
      }
      if (id === 'fire-pit') {
        const out: Part[] = [
          cyl(0, 0, 0, w, h - 2, d, '#8a8378', { m: 'stone', taper: 0.95 }),
          torus(0, h - 1.5, 0, w, 3, d, '#9b948a', { m: 'stone', tube: 0.12 }),
          cyl(0, h - 6, 0, w - 8, 4, d - 8, '#1d1d1d', { m: 'stone' }),
        ];
        for (let i = 0; i < 3; i++) out.push(cyl(0, h - 3, 0, 2.5, w * 0.5, 2.5, '#5a3d28', { m: 'wood', rot: [0, (i * Math.PI) / 3, Math.PI / 2] }));
        out.push(sph(0, h - 1, 0, 6, 5, 6, '#e8742a', { m: 'glow' }));
        return out;
      }
      if (id === 'grill') {
        return [
          // cart
          ...legs(w * 0.6, d - 4, 30, 1.5, C.charcoal, 0, -w * 0.05, 0, { m: 'metal' }),
          box(-w * 0.05, 8, 0, w * 0.55, 1, d - 6, C.charcoal, { m: 'metal' }),
          rbox(-w * 0.05, 30, 0, w * 0.6, 8, d - 2, C.black, { m: 'metal', r: 1.5 }), // firebox
          rbox(-w * 0.05, 38, -0.5, w * 0.6, 7, d - 3, '#2a2b2f', { m: 'gloss', r: 3.5 }), // lid
          cyl(-w * 0.05, 41, d / 2 - 0.5, 1, w * 0.4, 1, C.chrome, { m: 'chrome', rot: [0, 0, Math.PI / 2] }), // handle
          box(w * 0.32, 30, 0, w * 0.32, 1, d - 4, C.steel, { m: 'metal' }), // side shelf
          box(-w * 0.42, 30, 0, w * 0.14, 1, d - 4, C.steel, { m: 'metal' }),
          cyl(w * 0.32, 0, 0, 12, 18, 12, '#e6e6e6', { m: 'gloss' }), // propane tank
          ...[0, 1, 2].map((i) => knob(-w * 0.2 + i * 6, 32, d / 2 - 0.5, 1.6, C.steel)),
        ];
      }
      if (id === 'heavy-bag') {
        // mount 'ceiling': y=0 is the bottom of the bag, h reaches the ceiling
        const bagH = Math.min(h - 10, 42);
        return [
          rbox(0, 0, 0, w, bagH, d, '#1f1f22', { m: 'leather', r: Math.min(w, d) / 2 - 0.1 }),
          cyl(0, bagH - 4, 0, w + 0.2, 1, d + 0.2, '#b5332c', { m: 'leather' }),
          cyl(0, bagH, 0, 0.3, h - bagH, 0.3, C.steel, { m: 'metal' }),
          cyl(0, h - 1, 0, 4, 1, 4, C.steel, { m: 'metal' }),
        ];
      }
      return null;
    }
    default:
      return null;
  }
};
