/**
 * Desk and tech models: desks, office chairs, monitors, PCs, keyboards, mice,
 * desk mats, risers, speakers, printers, a mug, a desk lamp, office drawers.
 * Return parts for the pieces this file handles, or null to fall through to
 * the next category (and finally ./legacy.ts). See ./kit.ts.
 */
import type { FurnitureDef } from '../../engine/types';
import { C, box, cyl, rbox, sph, starBase, torus, type ModelFn, type Part } from './kit';

const FRAME = C.black;

// ---------------------------------------------------------------------------
// Desks

/** A T-shaped metal side frame (foot, post, top rail) spanning `span` inches along z (or x). */
function sideFrame(x: number, z: number, span: number, h: number, alongX: boolean, c = FRAME): Part[] {
  const [sx, sz] = alongX ? [span, 2.2] : [2.2, span];
  const [px, pz] = alongX ? [2, 2] : [2, 2];
  return [
    rbox(x, 0, z, sx, 1.4, sz, c, { m: 'metal', r: 0.5 }),
    box(x, 1.4, z, px, h - 1.4 - 2.2, pz, c, { m: 'metal' }),
    box(x, h - 2.2, z, alongX ? span - 2 : 1.6, 1, alongX ? 1.6 : span - 2, c, { m: 'metal' }),
  ];
}

/** Desk top slab with a slightly rounded edge. */
const slab = (x: number, z: number, w: number, d: number, h: number, c: string, t = 1.1, r = 0.35) => rbox(x, h - t, z, w, t, d, c, { m: 'wood', r });

/** Frames at the ends of a rectangle's long axis, skipping ends that butt into another part (L-desks). */
function frameFor(px: number, pz: number, pw: number, pd: number, h: number, inside: (x: number, z: number) => boolean, c = FRAME): Part[] {
  const out: Part[] = [];
  const longX = pw >= pd;
  const ends: [number, number][] = longX
    ? [
        [px + 2.5, px - 1],
        [px + pw - 2.5, px + pw + 1],
      ]
    : [
        [pz + 2.5, pz - 1],
        [pz + pd - 2.5, pz + pd + 1],
      ];
  for (const [at, probe] of ends) {
    if (longX ? inside(probe, pz + pd / 2) : inside(px + pw / 2, probe)) continue;
    out.push(...(longX ? sideFrame(at, pz + pd / 2, pd - 3, h, false, c) : sideFrame(px + pw / 2, at, pw - 3, h, true, c)));
  }
  return out;
}

function desk(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const id = def.id;
  // wall-mounted desk: slab with a slim front lip (it hangs; brackets hide below the band)
  if (def.mount === 'wall') return [slab(0, 0, w, d, h, C.oak, 1.4, 0.5), box(0, 0, -d / 2 + 0.4, w, h, 0.8, C.woodDark, { m: 'wood' })];

  if (id === 'drafting-table') {
    const out: Part[] = [];
    for (const s of [-1, 1]) {
      const x = s * (w / 2 - 2);
      out.push(rbox(x, 0, 0, 2.2, 1.4, d - 2, FRAME, { m: 'metal', r: 0.5 }));
      out.push(box(x, 1.4, -2, 1.8, h - 9, 1.8, FRAME, { m: 'metal', rot: [0.12, 0, 0] }));
    }
    out.push(box(0, 6, -2, w - 4, 1.2, 1.2, FRAME, { m: 'metal' }));
    // tilted drawing board and a pencil ledge
    out.push(rbox(0, h - 9.5, 0, w, 1, d - 2, C.offwhite, { m: 'plastic', r: 0.3, rot: [0.3, 0, 0] }));
    out.push(box(0, h - 13.6, d / 2 - 2.2, w - 2, 1.4, 1.2, C.woodDark, { m: 'wood' }));
    return out;
  }

  if (id === 'desk-writing' || id === 'makeup-vanity' || id === 'sewing-table') {
    const top = id === 'makeup-vanity' ? C.white : id === 'sewing-table' ? C.woodLight : C.walnut;
    const legC = id === 'makeup-vanity' ? C.offwhite : C.walnut;
    const out: Part[] = [slab(0, 0, w, d, h, top, 1.1, 0.4)];
    out.push(box(0, h - 5, -0.5, w - 3, 3.9, d - 3, top, { m: 'wood' })); // apron
    out.push(rbox(0, h - 4.4, d / 2 - 1.6, w * 0.45, 2.8, 0.6, top, { m: 'wood', r: 0.2 })); // drawer
    out.push(cyl(0, h - 3.3, d / 2 - 1.0, 0.8, 0.6, 0.8, C.brass, { m: 'metal', rot: [Math.PI / 2, 0, 0] }));
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) out.push(cyl((sx * (w - 4)) / 2, 0, (sz * (d - 4)) / 2, 1.3, h - 5, 1.3, legC, { m: 'wood', taper: 1.5 }));
    return out;
  }

  if (id === 'desk-executive') {
    const out: Part[] = [slab(0, 0, w, d, h, C.walnut, 1.5, 0.5)];
    const pw = 16;
    for (const s of [-1, 1]) {
      const x = s * (w / 2 - pw / 2 - 1);
      out.push(box(x, 0.5, 0, pw, h - 2, d - 2, C.walnut, { m: 'wood' }));
      for (let i = 0; i < 3; i++) {
        const y = 2 + i * ((h - 4) / 3);
        out.push(rbox(x, y, d / 2 - 0.9, pw - 1.5, (h - 4) / 3 - 0.6, 0.6, C.wood, { m: 'wood', r: 0.2 }));
        out.push(box(x, y + (h - 4) / 6, d / 2 - 0.4, 4, 0.5, 0.6, C.brass, { m: 'metal' }));
      }
    }
    out.push(box(0, 6, -d / 2 + 2, w - 2 * pw - 2, h - 8, 0.8, C.walnut, { m: 'wood' })); // modesty panel
    return out;
  }

  // L-desks and plain desks: a top per footprint part on black side frames
  const parts = def.parts ?? [[0, 0, w, d] as [number, number, number, number]];
  const local = parts.map(([px, pz, pw, pd]) => [px - w / 2, pz - d / 2, pw, pd] as [number, number, number, number]);
  const inside = (x: number, z: number) => local.some(([px, pz, pw, pd]) => x > px && x < px + pw && z > pz && z < pz + pd);
  const gaming = id === 'desk-gaming';
  const standing = id === 'desk-standing';
  const topC = gaming ? C.charcoal : id.startsWith('desk-l') ? C.oak : id === 'desk-small' ? C.woodLight : C.oak;
  const out: Part[] = [];
  for (const [px, pz, pw, pd] of local) {
    out.push(slab(px + pw / 2, pz + pd / 2, pw, pd, h, topC, gaming ? 1.2 : 1.1, gaming ? 0.6 : 0.35));
    if (standing) {
      // two-stage lifting columns on wide feet, with a crossbar
      for (const s of [-1, 1]) {
        const x = px + pw / 2 + s * (pw / 2 - 4);
        const z = pz + pd / 2;
        out.push(rbox(x, 0, z, 2.6, 1.4, pd - 3, FRAME, { m: 'metal', r: 0.5 }));
        out.push(box(x, 1.4, z, 2.8, 12, 2.2, FRAME, { m: 'metal' }));
        out.push(box(x, 13.4, z, 2.4, h - 16.5, 1.9, C.graphite, { m: 'metal' }));
        out.push(box(x, h - 3.1, z, 2, 2, pd - 4, FRAME, { m: 'metal' }));
      }
      out.push(box(px + pw / 2, 14, pz + pd / 2, pw - 10, 1.4, 1.4, FRAME, { m: 'metal' }));
      out.push(rbox(px + pw - 9, h - 2.6, pz + pd - 1.6, 5, 1.4, 2, C.black, { m: 'plastic', r: 0.4 })); // controls
    } else {
      out.push(...frameFor(px, pz, pw, pd, h, inside));
      if (!def.parts) out.push(box(px + pw / 2, h - 8, pz + 2.5, pw - 7, 1.2, 1.2, FRAME, { m: 'metal' })); // back stretcher
    }
  }
  if (gaming) {
    // a cable tray and a red edge accent
    out.push(box(0, h - 4, -d / 2 + 4, w * 0.6, 1.6, 4, C.black, { m: 'metal' }));
    out.push(box(0, h - 1.15, d / 2 - 0.15, w - 2, 0.3, 0.3, C.red, { m: 'glow' }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chairs

function officeChair(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const gaming = def.id === 'gaming-chair';
  const seatY = 17.5;
  const seatC = C.charcoal;
  const out: Part[] = [...starBase(Math.min(w, d) - 1, 1, C.black)];
  out.push(cyl(0, 3.5, 0, 2, seatY - 5.5, 2, C.chrome, { m: 'chrome' }));
  out.push(box(0, seatY - 2.2, -0.5, 6, 1.4, 6, C.black, { m: 'metal' })); // mechanism
  const sw = w * (gaming ? 0.78 : 0.72),
    sd = d * 0.7;
  if (gaming) {
    // bucket seat with raised side bolsters
    out.push(rbox(0, seatY - 1, 1.5, sw, 3.4, sd, seatC, { m: 'leather', r: 1.4 }));
    for (const s of [-1, 1]) out.push(rbox((s * (sw - 3)) / 2, seatY + 1.4, 1.5, 3, 2.6, sd - 1, C.red, { m: 'leather', r: 1.2 }));
    // tall back with wings and a headrest pillow
    const bz = -d / 2 + 4;
    const bh = h - seatY - 2;
    out.push(rbox(0, seatY + 2, bz, sw * 0.78, bh, 3.6, seatC, { m: 'leather', r: 1.5, rot: [-0.14, 0, 0] }));
    for (const s of [-1, 1]) out.push(rbox((s * sw * 0.41), seatY + 4, bz + 0.8, 2.6, bh * 0.62, 4, C.red, { m: 'leather', r: 1.1, rot: [-0.14, 0, s * 0.08] }));
    out.push(rbox(0, h - 9, bz + 2.6, sw * 0.5, 4, 2.6, C.black, { m: 'leather', r: 1.2, rot: [-0.14, 0, 0] }));
    out.push(rbox(0, seatY + 7, bz + 2.4, sw * 0.5, 4, 2.4, C.black, { m: 'leather', r: 1.2, rot: [-0.14, 0, 0] }));
  } else {
    out.push(rbox(0, seatY - 1, 1, sw, 3.2, sd, seatC, { m: 'fabric', r: 1.4 }));
    // mesh back on a curved spine
    const bz = -d / 2 + 3.5;
    out.push(box(0, seatY, bz + 1.5, 2.2, 5, 1.6, C.black, { m: 'plastic', rot: [-0.3, 0, 0] }));
    out.push(rbox(0, seatY + 4.5, bz, sw * 0.92, h - seatY - 5, 2.4, C.graphite, { m: 'fabric', r: 1.1, rot: [-0.1, 0, 0] }));
    out.push(rbox(0, seatY + 7, bz + 1.4, sw * 0.7, 3.5, 1.2, C.black, { m: 'plastic', r: 0.5, rot: [-0.1, 0, 0] })); // lumbar
  }
  // armrests: post + pad
  for (const s of [-1, 1]) {
    const x = s * (sw / 2 + (gaming ? 0.6 : 0.3));
    out.push(box(x, seatY - 1, 0.5, 1.4, 8, 1.6, C.black, { m: 'plastic' }));
    out.push(rbox(x, seatY + 7, 1.5, 2.6, 1.3, 9, C.black, { m: 'rubber', r: 0.55 }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Displays

/** A display panel (bezel + glass + rear housing) centered at x, bottom y, front face toward +z at z. */
function panel(x: number, y: number, z: number, pw: number, ph: number, rotY = 0, t = 0.8): Part[] {
  const rot: [number, number, number] = [0, rotY, 0];
  // offsets in the rotated frame: push screen slightly forward along the panel normal
  const nx = Math.sin(rotY),
    nz = Math.cos(rotY);
  return [
    rbox(x, y, z, pw, ph, t, C.black, { m: 'plastic', r: 0.25, rot }),
    box(x + nx * (t / 2 + 0.02), y + 0.35, z + nz * (t / 2 + 0.02), pw - 0.7, ph - 1.1, 0.06, C.screen, { m: 'screen', rot }),
    rbox(x - nx * (t / 2 + 0.6), y + ph * 0.2, z - nz * (t / 2 + 0.6), Math.min(pw * 0.5, 9), ph * 0.55, 1.4, C.charcoal, { m: 'plastic', r: 0.5, rot }),
  ];
}

/** A curved display made of angled segments (edges come toward you). */
function curvedPanel(x: number, y: number, z: number, pw: number, ph: number, radius: number, n: number): Part[] {
  const out: Part[] = [];
  const seg = pw / n;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n - 0.5; // -0.5..0.5
    const a = (s * pw) / radius;
    const px = x + Math.sin(a) * radius;
    const pz = z + (1 - Math.cos(a)) * radius;
    const rot: [number, number, number] = [0, -a, 0];
    const nx = -Math.sin(a),
      nz = Math.cos(a);
    out.push(box(px, y, pz, seg + 0.05, ph, 0.8, C.black, { m: 'plastic', rot }));
    out.push(box(px + nx * 0.42, y + 0.35, pz + nz * 0.42, seg + 0.02, ph - 1.1, 0.06, C.screen, { m: 'screen', rot }));
  }
  out.push(rbox(x, y + ph * 0.2, z - 1.2, Math.min(pw * 0.35, 12), ph * 0.55, 1.6, C.charcoal, { m: 'plastic', r: 0.6 }));
  return out;
}

function monitor(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const out: Part[] = [];
  const multi = w > 40 && !def.id.includes('49');
  const pz = -d / 2 + 3.2; // panel plane, toward the back of the footprint
  if (multi) {
    // dual / triple on a clamp-mounted arm
    const n = w > 55 ? 3 : 2;
    const pw = (w - 3) / n;
    const ph = pw * 0.58;
    const py = h - ph;
    out.push(rbox(0, 0, -d / 2 + 1.6, 4, 2.2, 3, C.black, { m: 'metal', r: 0.4 })); // clamp
    out.push(cyl(0, 2.2, -d / 2 + 1.6, 1.6, py + ph / 2 - 2.2, 1.6, C.graphite, { m: 'metal' }));
    out.push(rbox(0, py + ph / 2 - 0.6, -d / 2 + 1.8, w - pw * 0.8, 1.2, 1.2, C.graphite, { m: 'metal', r: 0.4 }));
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * pw;
      const ang = off === 0 ? 0 : -Math.sign(off) * 0.22;
      const fz = off === 0 ? pz : pz + 1.2;
      out.push(...panel(off * 0.98, py, fz, pw - 0.3, ph, ang));
    }
    return out;
  }
  const vertical = w < h;
  const ultrawide = w / h > 1.5;
  const pw = w;
  const ph = vertical ? h - 3 : ultrawide ? w * (def.id.includes('49') ? 0.29 : 0.43) : Math.min(h - 4, w * 0.58);
  const py = h - ph;
  // foot: a V on wide screens, a rounded rectangle otherwise
  const neckZ = pz - 1.7;
  if (pw > 26) {
    // V foot: two legs spreading forward from the neck
    const a = 0.5;
    const L = Math.min(9, (d / 2 - neckZ - 0.3) / Math.cos(a));
    for (const s of [-1, 1])
      out.push(rbox(s * Math.sin(a) * (L / 2), 0, neckZ + Math.cos(a) * (L / 2), 1.8, 0.6, L, C.graphite, { m: 'metal', r: 0.3, rot: [0, s * a, 0] }));
  } else {
    out.push(rbox(0, 0, 0.3, Math.min(9, pw * 0.42), 0.6, Math.min(d - 1, 7.5), C.graphite, { m: 'metal', r: 0.6 }));
  }
  // neck rising behind the panel
  out.push(rbox(0, 0.6, neckZ, 2.6, py + ph * 0.55 - 0.6, 1.2, C.graphite, { m: 'metal', r: 0.4 }));
  if (ultrawide) out.push(...curvedPanel(0, py, pz, pw, ph, def.id.includes('49') ? 40 : 60, def.id.includes('49') ? 9 : 7));
  else out.push(...panel(0, py, pz, pw, ph));
  return out;
}

/** Wall-mounted monitor: slim panel standing off a small bracket. */
function wallMonitor(w: number, d: number, h: number): Part[] {
  return [
    box(0, h * 0.35, -d / 2 + 0.2, Math.min(w * 0.3, 6), Math.min(h * 0.3, 6), 0.4, C.graphite, { m: 'metal' }),
    box(0, h * 0.45, -d / 2 + 1, 1.4, 1.4, 1.4, C.graphite, { m: 'metal' }),
    rbox(0, 0, d / 2 - 0.45, w, h, 0.8, C.black, { m: 'plastic', r: 0.25 }),
    box(0, 0.35, d / 2 - 0.02, w - 0.7, h - 1.1, 0.06, C.screen, { m: 'screen' }),
  ];
}

// ---------------------------------------------------------------------------
// Computers and peripherals

function pcTower(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const out: Part[] = [];
  const t = 0.3;
  const y0 = 0.8;
  const H = h - y0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(rbox((sx * (w - 2)) / 2, 0, (sz * (d - 3)) / 2, 1.6, y0, 2.4, C.black, { m: 'rubber', r: 0.3 }));
  // shell: solid left side, top, bottom, back (glass is on the right, the side you usually see)
  out.push(box(-w / 2 + t / 2, y0, 0, t, H, d, C.charcoal, { m: 'metal' }));
  out.push(box(0, h - t, 0, w, t, d, C.charcoal, { m: 'metal' }));
  out.push(box(0, y0, 0, w, 1.6, d, C.charcoal, { m: 'metal' })); // PSU shroud floor
  out.push(box(0, y0, -d / 2 + t / 2, w, H, t, C.charcoal, { m: 'metal' }));
  // front: frame with an inset mesh grille and a thin light strip
  out.push(rbox(0, y0, d / 2 - 0.4, w, H, 0.8, C.black, { m: 'plastic', r: 0.3 }));
  out.push(box(-0.6, y0 + 1, d / 2 + 0.01, w - 2.6, H - 2.6, 0.06, '#34363c', { m: 'fabric' }));
  out.push(box(w / 2 - 0.9, y0 + 1, d / 2 + 0.02, 0.18, H - 4, 0.06, C.offwhite, { m: 'glow' }));
  out.push(cyl(w / 2 - 1.4, h - 1.6, d / 2 + 0.02, 0.7, 0.1, 0.7, C.steel, { m: 'chrome', rot: [Math.PI / 2, 0, 0] })); // power button
  // inside, seen through the glass: motherboard, cooler, GPU, intake fans
  out.push(box(-w / 2 + t + 0.15, y0 + 2, -1, 0.2, H - 3.5, d - 5, '#4a4e56', { m: 'plastic' }));
  for (let i = 0; i < 2; i++) out.push(box(-w / 2 + 0.9, y0 + H * 0.6, d * 0.08 + i * 0.5, 0.9, 4, 0.25, C.red, { m: 'plastic' })); // RAM
  out.push(rbox(-w / 2 + 2.2, y0 + H * 0.62, -d * 0.12, 3.2, 3.6, 3.6, C.steel, { m: 'metal', r: 0.4 }));
  out.push(rbox(-w / 2 + 2.8, y0 + H * 0.36, d * 0.02, 4.4, 1.6, d * 0.58, C.metal, { m: 'metal', r: 0.3 }));
  out.push(box(-w / 2 + 2.8, y0 + H * 0.36 + 1.62, d * 0.02, 4, 0.08, d * 0.5, C.offwhite, { m: 'glow' })); // GPU light bar
  const fans = h > 16 ? 3 : 2;
  const fd = Math.min(H / fans - 0.4, w - 2.2, 4.8);
  for (let i = 0; i < fans; i++) {
    const fy = y0 + 2 + (i + 0.5) * ((H - 2.6) / fans);
    out.push(torus(0, fy, d / 2 - 1.6, fd, 1, fd, C.offwhite, { m: 'glow', tube: 0.12, rot: [Math.PI / 2, 0, 0] }));
    out.push(cyl(0, fy - 0.5, d / 2 - 1.6, fd * 0.32, 1, fd * 0.32, C.charcoal, { m: 'plastic', rot: [Math.PI / 2, 0, 0] }));
  }
  // tempered glass side
  out.push(box(w / 2 - 0.1, y0 + 0.2, 0, 0.2, H - 0.4, d - 0.6, '#9fb4c4', { m: 'glass' }));
  void def;
  return out;
}

function laptop(w: number, d: number, h: number): Part[] {
  // open, lid tilted back ~105 degrees (the lid rises above the catalog's 1" band)
  const base = Math.max(0.5, Math.min(h, 0.7));
  const lidH = d * 0.95;
  const a = 0.26; // tilt back from vertical
  const out: Part[] = [rbox(0, 0, 0.6, w, base, d - 1.2, C.steel, { m: 'metal', r: 0.25 })];
  out.push(box(0, base, 0.1, w - 2, 0.05, d * 0.42, C.charcoal, { m: 'plastic' })); // keyboard area
  out.push(rbox(0, base, d / 2 - 2.2, w * 0.36, 0.04, 2.4, C.metal, { m: 'metal', r: 0.02 })); // trackpad
  const ly = base + (Math.cos(a) * lidH) / 2 - lidH / 2;
  const lz = -d / 2 + 0.6 - (Math.sin(a) * lidH) / 2;
  out.push(rbox(0, ly, lz, w, lidH, 0.3, C.steel, { m: 'metal', r: 0.12, rot: [-a, 0, 0] }));
  out.push(box(0, ly + 0.5, lz + Math.cos(a) * 0.17, w - 0.8, lidH - 1, 0.04, C.screen, { m: 'screen', rot: [-a, 0, 0] }));
  return out;
}

/** Keycaps: individual keys when there are few, row strips per cluster otherwise. */
function keyboard(w: number, d: number, h: number, x0 = 0, caseC = '#1b1c1f'): Part[] {
  const out: Part[] = [];
  const baseH = Math.min(h * 0.55, 0.9);
  out.push(rbox(x0, 0, 0, w, baseH, d, caseC, { m: 'plastic', r: 0.35 }));
  const keyC = '#4a4e56';
  const rows = d >= 5.5 ? 6 : 5;
  const pitch = Math.min(0.75, (d - 0.6) / rows);
  const cap = pitch - 0.1;
  const kh = Math.max(0.25, h - baseH - 0.05);
  // clusters: main always; nav block on tenkeyless+; numpad on full
  const clusters: [number, number][] = [];
  const left = x0 - w / 2 + 0.35;
  if (w >= 16) {
    const main = w * 0.62;
    clusters.push([left, left + main], [left + main + 0.35, left + main + 0.35 + pitch * 3], [x0 + w / 2 - 0.35 - pitch * 4, x0 + w / 2 - 0.35]);
  } else if (w >= 13) {
    const main = w - 0.7 - pitch * 3 - 0.35;
    clusters.push([left, left + main], [left + main + 0.35, x0 + w / 2 - 0.35]);
  } else clusters.push([left, x0 + w / 2 - 0.35]);
  const z0 = -d / 2 + 0.3 + pitch / 2;
  const total = clusters.reduce((s, [a, b]) => s + Math.floor((b - a) / pitch) * rows, 0);
  const each = total <= 140;
  for (let r = 0; r < rows; r++) {
    const z = z0 + r * pitch;
    for (const [a, b] of clusters) {
      const n = Math.floor((b - a) / pitch);
      if (n <= 0) continue;
      if (r === rows - 1 && a === clusters[0][0]) {
        // bottom row of the main block: modifiers + a long space bar
        const span = n * pitch;
        out.push(rbox(a + span * 0.5, baseH, z, span * 0.45, kh, cap, C.offwhite, { m: 'plastic', r: 0.12 }));
        out.push(rbox(a + span * 0.12, baseH, z, span * 0.2, kh, cap, keyC, { m: 'plastic', r: 0.12 }));
        out.push(rbox(a + span * 0.87, baseH, z, span * 0.22, kh, cap, keyC, { m: 'plastic', r: 0.12 }));
        continue;
      }
      if (each)
        for (let i = 0; i < n; i++) {
          const esc = r === 0 && i === 0 && a === clusters[0][0];
          out.push(rbox(a + pitch * (i + 0.5), baseH, z, cap, kh, cap, esc ? C.red : keyC, { m: 'plastic', r: 0.1 }));
        }
      else out.push(rbox(a + (n * pitch) / 2, baseH, z, n * pitch - 0.1, kh, cap, keyC, { m: 'plastic', r: 0.1 }));
    }
  }
  return out;
}

function mouse(x: number, z: number, w: number, d: number, h: number): Part[] {
  return [
    sph(x, h * 0.48, z, w, h * 0.96, d, C.black, { m: 'gloss' }),
    box(x, h * 0.62, z + d * 0.22, 0.05, h * 0.38, d * 0.42, C.graphite, { m: 'plastic' }), // button split
    cyl(x, h * 0.78, z + d * 0.18, 0.35, 0.3, 0.7, C.graphite, { m: 'rubber', rot: [0, 0, Math.PI / 2] }), // wheel
  ];
}

function gamepad(w: number, d: number, h: number): Part[] {
  return [
    rbox(0, 0.6, -0.2, w * 0.62, h * 0.45, d * 0.62, C.charcoal, { m: 'plastic', r: 0.5 }),
    sph(-w * 0.32, h * 0.38, d * 0.08, w * 0.34, h * 0.72, d * 0.78, C.charcoal, { m: 'plastic' }),
    sph(w * 0.32, h * 0.38, d * 0.08, w * 0.34, h * 0.72, d * 0.78, C.charcoal, { m: 'plastic' }),
    cyl(-w * 0.15, h * 0.58, d * 0.1, 0.8, h * 0.32, 0.8, C.black, { m: 'rubber' }),
    cyl(w * 0.15, h * 0.58, d * 0.1, 0.8, h * 0.32, 0.8, C.black, { m: 'rubber' }),
    ...[0, 1, 2, 3].map((i) => sph(w * 0.3 + Math.cos(i * 1.57) * 0.45, h * 0.88, -d * 0.12 + Math.sin(i * 1.57) * 0.45, 0.4, 0.3, 0.4, C.graphite, { m: 'plastic' })),
  ];
}

function streamDeck(w: number, d: number, h: number): Part[] {
  const out: Part[] = [rbox(0, 0, 0.6, w * 0.7, 0.4, d * 0.6, C.black, { m: 'plastic', r: 0.2 })];
  const a = 0.45;
  out.push(rbox(0, h * 0.35, -0.1, w, h * 0.5, d * 0.7, C.black, { m: 'plastic', r: 0.3, rot: [a, 0, 0] }));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 5; c++) {
      const z = -0.9 + r * 0.85;
      out.push(box(-w * 0.36 + c * (w * 0.18), h * 0.35 + h * 0.5 - 0.4 - z * Math.sin(a) * 0.9, z * Math.cos(a) + 0.3, w * 0.13, 0.25, 0.6, C.screen, { m: 'screen', rot: [a, 0, 0] }));
    }
  return out;
}

function pad(w: number, d: number, h: number): Part[] {
  const t = Math.max(h, 0.12);
  return [
    rbox(0, 0, 0, w, t * 0.55, d, C.black, { m: 'rubber', r: Math.min(0.6, t * 0.27) }),
    rbox(0, t * 0.45, 0, w - 0.25, t * 0.55, d - 0.25, C.charcoal, { m: 'fabric', r: Math.min(0.5, t * 0.27) }),
  ];
}

function riser(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.under) {
    // footrest: angled platform on a base
    return [
      rbox(0, 0, 0, w, 1, d, C.black, { m: 'plastic', r: 0.4 }),
      rbox(0, 1.6, 0, w - 0.5, 1, d * 0.98, C.graphite, { m: 'rubber', r: 0.4, rot: [-0.22, 0, 0] }),
      box(0, 1, -d / 2 + 2, w - 4, h - 2.5, 1.2, C.black, { m: 'plastic' }),
    ];
  }
  if (def.id === 'laptop-stand') {
    const a = 0.32;
    return [
      ...[-1, 1].map((s) => rbox(s * (w / 2 - 0.6), 0, 0, 1, h * 0.85, d * 0.8, C.steel, { m: 'metal', r: 0.3, rot: [-a * 0.5, 0, 0] })),
      rbox(0, h - 2.2, 0, w, 0.35, d, C.steel, { m: 'metal', r: 0.15, rot: [a, 0, 0] }),
      box(0, h - 2.2 - Math.sin(a) * d * 0.5 + 0.2, d / 2 - 0.4, w - 1, 0.8, 0.4, C.steel, { m: 'metal' }), // front lip
    ];
  }
  if (def.id === 'desk-hutch') {
    return [
      rbox(0, h - 1, 0, w, 1, d, C.oak, { m: 'wood', r: 0.3 }),
      box(-w / 2 + 0.5, 0, 0, 1, h - 1, d, C.oak, { m: 'wood' }),
      box(w / 2 - 0.5, 0, 0, 1, h - 1, d, C.oak, { m: 'wood' }),
      box(0, 0, -d / 2 + 0.3, w - 2, h - 1, 0.6, C.oak, { m: 'wood' }),
      box(-w / 6, 0, 0, 0.8, h - 1, d - 1, C.oak, { m: 'wood' }),
      box(w / 6, 0, 0, 0.8, h - 1, d - 1, C.oak, { m: 'wood' }),
    ];
  }
  // monitor riser: board on two legs with a slim shelf
  return [
    rbox(0, h - 1, 0, w, 1, d, C.walnut, { m: 'wood', r: 0.35 }),
    rbox(-w / 2 + 1.2, 0, 0, 1.6, h - 1, d - 0.5, C.black, { m: 'metal', r: 0.3 }),
    rbox(w / 2 - 1.2, 0, 0, 1.6, h - 1, d - 0.5, C.black, { m: 'metal', r: 0.3 }),
  ];
}

function speaker(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'headphone-stand') {
    const hx = 0;
    return [
      cyl(0, 0, 0, w, 0.7, d, C.walnut, { m: 'wood' }),
      cyl(0, 0.7, 0, 0.8, h - 3.5, 0.8, C.steel, { m: 'metal' }),
      rbox(0, h - 3.2, 0, 3.6, 0.8, 1.6, C.steel, { m: 'metal', r: 0.3 }),
      // headphones: headband over the hanger, cups hanging either side
      torus(hx, h - 3.8, 0, 6, 1.2, 6, C.black, { m: 'leather', tube: 0.12, rot: [Math.PI / 2, 0, 0] }),
      cyl(-2.6, h - 7.4, 0, 3, 1.4, 3, C.charcoal, { m: 'leather', rot: [0, 0, Math.PI / 2] }),
      cyl(2.6, h - 7.4, 0, 3, 1.4, 3, C.charcoal, { m: 'leather', rot: [0, 0, Math.PI / 2] }),
    ];
  }
  const out: Part[] = [];
  const cab = def.id === 'speaker-floor' ? C.walnut : C.black;
  const y0 = def.id === 'speaker-floor' ? 1.2 : 0;
  if (y0) out.push(rbox(0, 0, 0, w, y0, d, C.black, { m: 'metal', r: 0.3 }));
  out.push(rbox(0, y0, 0, w, h - y0, d, cab, { m: def.id === 'speaker-floor' ? 'wood' : 'plastic', r: 0.5 }));
  const front = d / 2 + 0.02;
  const driver = (y: number, dia: number) => [
    torus(0, y, front, dia, 0.5, dia, C.graphite, { m: 'rubber', tube: 0.16, rot: [Math.PI / 2, 0, 0] }),
    cyl(0, y - 0.15, front - 0.1, dia * 0.72, 0.3, dia * 0.72, C.charcoal, { m: 'plastic', rot: [Math.PI / 2, 0, 0] }),
    sph(0, y, front - 0.05, dia * 0.22, dia * 0.22, 0.4, C.graphite, { m: 'gloss' }),
  ];
  if (def.id === 'subwoofer') out.push(...driver(h * 0.5, Math.min(w, h) * 0.75));
  else if (def.id === 'speaker-floor') {
    out.push(...driver(h - 3.5, 1.4), ...driver(h - 9, w * 0.62), ...driver(h - 17, w * 0.62));
  } else out.push(...driver(h * 0.78, Math.min(1.3, w * 0.25)), ...driver(h * 0.38, w * 0.7));
  return out;
}

function printer(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  if (def.id === 'game-console') {
    return [
      rbox(0, 0, 0, w, h * 0.85, d, C.black, { m: 'gloss', r: 0.4 }),
      box(0, h * 0.85, 0, w * 0.9, h * 0.15, d * 0.9, C.charcoal, { m: 'plastic' }),
      box(0, h * 0.3, d / 2 + 0.01, w * 0.5, 0.15, 0.05, C.offwhite, { m: 'glow' }),
    ];
  }
  if (def.id === 'printer-3d') {
    const out: Part[] = [rbox(0, 0, 0, w, 3, d, C.charcoal, { m: 'metal', r: 0.4 })];
    for (const s of [-1, 1]) out.push(box(s * (w / 2 - 1), 3, -d / 2 + 2, 1.4, h - 3, 1.4, C.black, { m: 'metal' }));
    out.push(box(0, h - 1.4, -d / 2 + 2, w - 0.6, 1.4, 1.4, C.black, { m: 'metal' })); // top beam
    out.push(box(0, h * 0.58, -d / 2 + 2.5, w - 3, 1, 1.2, C.graphite, { m: 'metal' })); // X gantry
    out.push(rbox(0, h * 0.58 - 1.6, -d / 2 + 4, 2.6, 3, 2.6, C.black, { m: 'plastic', r: 0.3 })); // print head
    out.push(box(0, 3.2, 1.5, w - 4, 0.4, d - 5, C.steel, { m: 'metal' })); // bed
    out.push(rbox(-2, 3.6, 1.5, 3, 2.5, 3, C.red, { m: 'plastic', r: 0.4 })); // a print in progress
    out.push(cyl(w / 2 - 1, h - 8, -d / 2 + 2, 1.2, 6, 6, C.offwhite, { m: 'plastic', rot: [0, 0, Math.PI / 2] })); // spool
    return out;
  }
  return [
    rbox(0, 0, 0, w, h * 0.78, d, C.offwhite, { m: 'plastic', r: 0.6 }),
    rbox(0, h * 0.78, -0.3, w - 0.4, h * 0.22, d - 1, C.white, { m: 'plastic', r: 0.4 }), // scanner lid
    box(0, h * 0.3, d / 2 - 1.5, w * 0.7, 0.3, 3, C.graphite, { m: 'plastic' }), // output slot / tray
    box(w * 0.3, h * 0.78 + 0.1, d / 2 - 1.2, w * 0.25, 0.3, 1.6, C.screen, { m: 'screen' }), // control panel
  ];
}

function mug(w: number, d: number, h: number): Part[] {
  const body = Math.min(w, d) - 0.9;
  const bx = -w / 2 + body / 2;
  return [
    cyl(bx, 0, 0, body, h, body, C.white, { m: 'ceramic' }),
    cyl(bx, h - 0.6, 0, body - 0.3, 0.45, body - 0.3, '#3b2416', { m: 'gloss' }), // coffee
    torus(w / 2 - 0.7, h * 0.52, 0, 1.4, 0.45, 1.4, C.white, { m: 'ceramic', tube: 0.3, rot: [Math.PI / 2, 0, 0] }),
  ];
}

function deskLamp(w: number, d: number, h: number): Part[] {
  const lower = h * 0.55,
    upper = h * 0.48;
  return [
    cyl(0, 0, -d * 0.15, w * 0.85, 0.8, d * 0.85, C.black, { m: 'metal' }),
    box(0, 0.6, -d * 0.2, 0.6, lower, 0.6, C.black, { m: 'metal', rot: [0.32, 0, 0] }),
    sph(0, lower, -d * 0.15 + Math.sin(0.32) * lower * 0.5, 1, 1, 1, C.graphite, { m: 'metal' }),
    box(0, lower - upper * 0.5 + 0.4, 1.2, 0.5, upper, 0.5, C.black, { m: 'metal', rot: [-0.9, 0, 0] }),
    cyl(0, h - 4.2, d / 2 - 2.2, 3.4, 3.4, 3.4, C.black, { m: 'metal', taper: 0.45, rot: [0.4, 0, 0] }),
    cyl(0, h - 4.4, d / 2 - 1.9, 2.4, 0.2, 2.4, C.offwhite, { m: 'glow', rot: [0.4, 0, 0] }),
  ];
}

function officeDrawers(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const rolling = def.id === 'pedestal';
  const y0 = rolling ? 2 : 0.5;
  const n = rolling ? 3 : 2;
  const body = '#5d6168';
  const out: Part[] = [rbox(0, y0, -0.3, w, h - y0, d - 0.6, body, { m: 'metal', r: 0.3 })];
  if (!rolling) out.push(box(0, 0, -0.3, w - 1, y0, d - 1.5, C.black, { m: 'metal' }));
  else for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(sph((sx * (w - 3)) / 2, 1, (sz * (d - 3)) / 2, 1.8, 1.8, 1.8, C.black, { m: 'rubber' }));
  const heights = rolling ? [0.25, 0.25, 0.5] : [0.5, 0.5];
  let y = h - 0.6;
  for (let i = 0; i < n; i++) {
    const dh = (h - y0 - 1) * heights[i];
    y -= dh;
    out.push(rbox(0, y + 0.15, d / 2 - 0.5, w - 0.9, dh - 0.3, 0.5, '#6c7078', { m: 'metal', r: 0.15 }));
    out.push(rbox(0, y + dh * 0.6, d / 2 - 0.05, Math.min(w * 0.45, 7), 0.7, 0.6, C.chrome, { m: 'chrome', r: 0.25 })); // pull
    if (!rolling) out.push(box(0, y + dh * 0.82, d / 2 - 0.2, 2.5, 1, 0.1, C.steel, { m: 'metal' })); // label holder
  }
  return out;
}

// ---------------------------------------------------------------------------

export const deskParts: ModelFn = (def, w, d, h) => {
  const id = def.id;
  if (id === 'desk-lamp') return deskLamp(w, d, h);
  switch (def.symbol) {
    case 'desk':
    case 'desk-l':
      return desk(def, w, d, h);
    case 'office-chair':
      return officeChair(def, w, d, h);
    case 'monitor':
      return monitor(def, w, d, h);
    case 'tv':
      return id.startsWith('monitor-wall') ? wallMonitor(w, d, h) : null;
    case 'pc-tower':
      return pcTower(def, w, d, h);
    case 'laptop':
      return laptop(w, d, h);
    case 'keyboard':
      if (id === 'stream-deck') return streamDeck(w, d, h);
      if (id === 'keyboard') return [...keyboard(w * 0.74, d, h, -w * 0.13), ...mouse(w / 2 - w * 0.07, 0.4, 2.6, Math.min(d - 1, 4.8), Math.min(h, 1.6))];
      return keyboard(w, d, h);
    case 'mouse':
      return id === 'gamepad' ? gamepad(w, d, h) : mouse(0, 0, w, d, h);
    case 'pad':
      return pad(w, d, h);
    case 'riser':
      return riser(def, w, d, h);
    case 'speaker':
      return speaker(def, w, d, h);
    case 'printer':
      return printer(def, w, d, h);
    case 'mug':
      return mug(w, d, h);
    case 'dresser':
      return id === 'file-cabinet' || id === 'lateral-file' || id === 'pedestal' ? officeDrawers(def, w, d, h) : null;
    default:
      return null;
  }
};
