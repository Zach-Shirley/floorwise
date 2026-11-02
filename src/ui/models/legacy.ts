/**
 * The first-generation block models (v0.3). Kept as the fallback for any
 * symbol the newer category files don't cover yet.
 */
import type { FurnitureDef } from '../../engine/types';
import { ART, BOOKS, box, cyl, legs, pick, sph, type Part } from './kit';

// ---------------------------------------------------------------------------
// Palette: neutral, so a future lighting pass has something honest to light.

const WOOD = '#9a7352';
const WOOD_D = '#6b4e37';
const WOOD_L = '#c9a982';
const FABRIC = '#7c838d';
const FABRIC_D = '#5c626b';
const LINEN = '#e9e4da';
const PILLOW = '#f4f1ea';
const WHITE = '#ecebe7';
const STONE = '#d8d4cc';
const METAL = '#a3a8ae';
const STEEL = '#c6cacf';
const BLACK = '#232427';
const SCREEN = '#101215';
const FELT = '#2e6a46';
const GREEN = '#557f4c';
const POT = '#b4694b';
const RED = '#a83c3c';

/** A cabinet with drawer lines on its front. */
function cabinet(w: number, d: number, h: number, body: string, top = body, drawers = 0): Part[] {
  const out = [box(0, 2, -0.5, w - 1, h - 3, d - 1, body), box(0, h - 1, 0, w, 1, d, top), box(0, 0, -0.5, w - 2, 2, d - 2, WOOD_D)];
  for (let i = 1; i < drawers; i++) out.push(box(0, 2 + ((h - 3) * i) / drawers, d / 2 - 0.9, w - 2, 0.35, 0.3, WOOD_D));
  return out;
}

/** A seat (sofa, armchair) over one footprint part. */
function seat(x0: number, z0: number, w: number, d: number, h: number, backEdges: ('back' | 'left' | 'right')[], arms: ('left' | 'right')[], c = FABRIC): Part[] {
  const cx = x0 + w / 2,
    cz = z0 + d / 2;
  const out: Part[] = [box(cx, 3, cz, w, 7, d, FABRIC_D), box(cx, 10, cz + 1, w - 2, 7, d - 4, c)];
  const bt = Math.min(9, d * 0.28);
  for (const e of backEdges) {
    if (e === 'back') out.push(box(cx, 10, z0 + bt / 2, w, h - 10, bt, c));
    if (e === 'left') out.push(box(x0 + bt / 2, 10, cz, bt, h - 10, d, c));
    if (e === 'right') out.push(box(x0 + w - bt / 2, 10, cz, bt, h - 10, d, c));
  }
  const at = Math.min(6, w * 0.14);
  for (const a of arms) out.push(box(a === 'left' ? x0 + at / 2 : x0 + w - at / 2, 3, cz, at, 21, d, c));
  return out;
}

export function legacyParts(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  const cu = def.clearUnder ?? 0;
  switch (def.symbol) {
    case 'bed': {
      const mat = Math.max(8, h - 12);
      const head = def.id === 'daybed' ? [] : [box(0, 0, -d / 2 + 1.5, w, h + 18, 3, WOOD_D)];
      const pw = w > 48 ? (w - 10) / 2 : w - 8;
      const pillows = (w > 48 ? [-w / 4 + 1, w / 4 - 1] : [0]).map((x) => box(x, h, -d / 2 + 10, pw, 5, 13, PILLOW));
      return [
        box(0, 0, 0, w, 12, d, WOOD),
        box(0, 12, 1, w - 2, mat, d - 4, LINEN),
        box(0, h - 0.5, d * 0.18, w - 1, 1.5, d * 0.62, FABRIC),
        ...head,
        ...pillows,
        ...(def.id === 'daybed' ? [box(0, 10, -d / 2 + 2, w, 22, 4, WOOD), box(-w / 2 + 2, 10, 0, 4, 22, d, WOOD), box(w / 2 - 2, 10, 0, 4, 22, d, WOOD)] : []),
      ];
    }
    case 'bunk':
    case 'loft-bed': {
      const posts = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => box((sx * (w - 3)) / 2, 0, (sz * (d - 3)) / 2, 3, h, 3, WOOD)));
      const levels = def.symbol === 'bunk' ? [8, 44] : [cu];
      const out: Part[] = [...posts];
      for (const y of levels) out.push(box(0, y, 0, w, 3, d, WOOD_D), box(0, y + 3, 0, w - 4, 7, d - 4, LINEN), box(0, y + 10, -d / 2 + 9, w - 10, 4, 12, PILLOW));
      out.push(box(0, h - 6, d / 2 - 1.5, w, 2, 1.5, WOOD), box(0, h - 6, -d / 2 + 1.5, w, 2, 1.5, WOOD));
      for (let y = 12; y < h - 8; y += 11) out.push(box(w / 2 - 1, y, d / 2 - 10, 2, 1.5, 14, WOOD_L)); // ladder
      return out;
    }
    case 'crib':
      return [box(0, 12, 0, w - 3, 5, d - 3, LINEN), ...legs(w, d, h, 2, WHITE, 0), box(0, h - 2, -d / 2 + 1, w, 2, 2, WHITE), box(0, h - 2, d / 2 - 1, w, 2, 2, WHITE), box(-w / 2 + 1, h - 2, 0, 2, 2, d, WHITE), box(w / 2 - 1, h - 2, 0, 2, 2, d, WHITE)];
    case 'nightstand':
      return cabinet(w, d, h, WOOD, WOOD, 2);
    case 'dresser':
      return def.id.startsWith('file') || def.id === 'lateral-file' || def.id === 'pedestal'
        ? cabinet(w, d, h, METAL, METAL, def.id === 'pedestal' ? 3 : 2)
        : cabinet(w, d, h, WOOD, WOOD, Math.max(2, Math.round(h / 9)));
    case 'wardrobe':
      return [...cabinet(w, d, h, WOOD_L, WOOD_L, 0), box(0, 3, d / 2 - 0.4, 0.4, h - 5, 0.4, WOOD_D)];
    case 'tool-chest':
      return [...cabinet(w, d, h, RED, BLACK, Math.max(3, Math.round(h / 7))), ...[-1, 1].map((s) => cyl((s * w) / 3, 0, d / 3, 3, 2, 3, BLACK))];
    case 'sofa':
    case 'loveseat':
      return seat(-w / 2, -d / 2, w, d, h, ['back'], ['left', 'right']);
    case 'armchair':
      return def.id === 'chaise' || def.id === 'lounger'
        ? seat(-w / 2, -d / 2, w, d, h, ['back'], [])
        : seat(-w / 2, -d / 2, w, d, h, ['back'], ['left', 'right'], def.id === 'recliner' ? FABRIC_D : FABRIC);
    case 'sectional': {
      const parts = def.parts ?? [[0, 0, w, d]];
      const [a, ...rest] = parts;
      const out = seat(a[0] - w / 2, a[1] - d / 2, a[2], a[3], h, ['back'], [a[0] === 0 && rest[0]?.[0] === 0 ? 'right' : 'left']);
      for (const p of rest) out.push(...seat(p[0] - w / 2, p[1] - d / 2, p[2], p[3], h, [p[0] === 0 ? 'left' : 'right'], []));
      return out;
    }
    case 'beanbag':
      return [sph(0, h * 0.45, 0, w, h * 0.9, d, FABRIC), sph(0, h * 0.75, -d * 0.18, w * 0.8, h * 0.5, d * 0.5, FABRIC)];
    case 'ottoman':
      return def.round ? [cyl(0, 0, 0, w, h, d, FABRIC)] : [box(0, 3, 0, w, h - 3, d, FABRIC), ...legs(w, d, 3, 1.5, WOOD_D, 1)];
    case 'coffee-table':
    case 'side-table':
      if (def.round) return [cyl(0, h - 1.5, 0, w, 1.5, d, WOOD), cyl(0, 0, 0, 3, h - 1.5, 3, WOOD_D), cyl(0, 0, 0, w * 0.5, 1, d * 0.5, WOOD_D)];
      if (def.tucks) return [box(0, h - 2, 0, w, 2, d, WOOD), ...legs(w, d, h - 2)]; // benches
      return [box(0, h - 1.5, 0, w, 1.5, d, WOOD), ...legs(w, d, h - 1.5), ...(h < 20 ? [box(0, 4, 0, w - 4, 0.8, d - 4, WOOD_D)] : [])];
    case 'table-rect':
      return [box(0, h - 1.5, 0, w, 1.5, d, WOOD), ...legs(w, d, h - 1.5, 2.5)];
    case 'table-round':
      return [cyl(0, h - 1.5, 0, w, 1.5, d, WOOD), cyl(0, 0, 0, 4, h - 1.5, 4, WOOD_D), cyl(0, 0, 0, w * 0.45, 1.2, d * 0.45, WOOD_D)];
    case 'chair':
      return [box(0, 17, 0, w, 1.5, d, WOOD), ...legs(w, d, 17, 1.5, WOOD_D, 0.5), box(0, 18.5, -d / 2 + 0.75, w, h - 18.5, 1.5, WOOD)];
    case 'stool':
      return [cyl(0, h - 2, 0, w, 2, d, WOOD), cyl(0, 0, 0, 2, h - 2, 2, METAL), cyl(0, 0, 0, w * 0.8, 1, d * 0.8, METAL), cyl(0, 10, 0, w * 0.7, 0.8, d * 0.7, METAL)];
    case 'office-chair': {
      const seatY = 18;
      return [
        cyl(0, 1, 0, w, 1, d, BLACK),
        cyl(0, 2, 0, 2, seatY - 2, 2, METAL),
        box(0, seatY, 1, w * 0.75, 3.5, d * 0.7, BLACK),
        box(0, seatY + 4, -d * 0.32, w * 0.72, h - seatY - 4, 3, BLACK),
        box(-w * 0.38, seatY + 3, 1, 2, 6, d * 0.45, BLACK),
        box(w * 0.38, seatY + 3, 1, 2, 6, d * 0.45, BLACK),
      ];
    }
    case 'desk':
    case 'desk-l': {
      const parts = def.parts ?? [[0, 0, w, d] as [number, number, number, number]];
      const out: Part[] = [];
      for (const [px, pz, pw, pd] of parts) {
        const cx = px + pw / 2 - w / 2,
          cz = pz + pd / 2 - d / 2;
        out.push(box(cx, h - 1.2, cz, pw, 1.2, pd, def.mount === 'wall' ? WOOD_L : WOOD));
        if (cu) out.push(...legs(pw, pd, h - 1.2, 2, BLACK, 1, cx, cz));
      }
      if (def.mount === 'wall') out.push(box(-w / 3, h - 8, -d / 2 + 4, 1, 6.8, 8, METAL), box(w / 3, h - 8, -d / 2 + 4, 1, 6.8, 8, METAL));
      if (def.id === 'makeup-vanity') out.push(box(0, h, -d / 2 + 1, w * 0.7, 24, 1, STEEL));
      return out;
    }
    case 'bookshelf': {
      const out: Part[] = [box(-w / 2 + 0.4, 0, 0, 0.8, h, d, WOOD), box(w / 2 - 0.4, 0, 0, 0.8, h, d, WOOD), box(0, h - 0.8, 0, w, 0.8, d, WOOD), box(0, 0, 0, w, 2, d, WOOD), box(0, 0, -d / 2 + 0.25, w, h, 0.5, WOOD_D)];
      const n = Math.max(1, Math.round(h / 13));
      for (let i = 0; i < n; i++) {
        const y = 2 + ((h - 2.8) * i) / n;
        if (i > 0) out.push(box(0, y, 0, w - 1.6, 0.75, d - 1, WOOD));
        const bh = Math.min(9, (h - 2.8) / n - 2);
        if (bh > 2) out.push(box(-w * 0.12, y + 0.75, 0, w * 0.6, bh, d * 0.7, pick(BOOKS, def.id, i)));
      }
      return out;
    }
    case 'tv-console':
      return [...cabinet(w, d, h, WOOD_D, WOOD, 0), box(-w / 4, 4, d / 2 - 0.4, 0.4, h - 6, 0.4, BLACK), box(w / 4, 4, d / 2 - 0.4, 0.4, h - 6, 0.4, BLACK)];
    case 'rug':
      return [box(0, 0, 0, w, h, d, def.id.includes('gym') || def.id.includes('mat') ? FABRIC_D : '#8a7a6a'), box(0, h, 0, w - 8, 0.05, d - 8, '#9c8b78')];
    case 'plant': {
      const potH = Math.min(14, h * 0.3);
      return h > 40
        ? [cyl(0, 0, 0, w * 0.55, potH, d * 0.55, POT), cyl(0, potH, 0, 1.5, h * 0.4, 1.5, WOOD_D), sph(0, h * 0.7, 0, w, h * 0.55, d, GREEN)]
        : [cyl(0, 0, 0, w * 0.6, potH, d * 0.6, POT), sph(0, potH + (h - potH) / 2, 0, w, h - potH, d, GREEN)];
    }
    case 'piano':
      if (cu) return [box(0, h - 4, 0, w, 4, d, BLACK), box(0, h - 0.5, 2, w - 4, 0.6, 5, WHITE), ...legs(w, d, h - 4, 1.5, BLACK)];
      if (d > 40) return [box(0, 6, 0, w, 10, d, BLACK), box(0, 16, d / 2 - 4, w - 4, 1, 6, WHITE), ...legs(w, d, 26, 3, BLACK, 4).map((p) => ({ ...p, sy: 26 })), box(0, 26, 0, w, 14, d, BLACK)];
      return [box(0, 0, -d / 2 + 6, w, h, 12, BLACK), box(0, 26, d / 2 - 5, w, 3, 10, BLACK), box(0, 29, d / 2 - 5, w - 4, 0.6, 6, WHITE)];
    case 'counter':
    case 'island':
      return [box(0, 0, -0.5, w - 1, 4, d - 3, WOOD_D), box(0, 4, -0.5, w - 0.5, h - 5.5, d - 1.5, WHITE), box(0, h - 1.5, 0, w, 1.5, d, STONE)];
    case 'sink-kitchen':
      return [box(0, 0, -0.5, w - 1, 4, d - 3, WOOD_D), box(0, 4, -0.5, w - 0.5, h - 5.5, d - 1.5, WHITE), box(0, h - 1.5, 0, w, 1.5, d, STONE), box(0, h - 0.3, 0, w - 8, 0.4, d - 8, STEEL), cyl(0, h, -d / 2 + 3, 1.2, 12, 1.2, STEEL)];
    case 'range':
      return [box(0, 0, 0, w, h - 1, d, STEEL), box(0, h - 1, 0, w, 1, d, BLACK), box(0, h, -d / 2 + 1, w, 6, 2, STEEL), box(0, 6, d / 2 - 0.2, w - 4, h - 14, 0.4, BLACK)];
    case 'fridge':
      return [box(0, 0, 0, w, h, d, STEEL), box(0, h * 0.62, d / 2 - 0.1, w, 0.4, 0.4, METAL), box(w / 2 - 3, h * 0.66, d / 2 + 0.6, 1, h * 0.25, 1, METAL)];
    case 'dishwasher':
      return [box(0, 0, 0, w, h - 1.5, d, STEEL), box(0, h - 1.5, 0, w, 1.5, d, STONE)];
    case 'vanity':
      return [box(0, 0, -0.5, w - 1, h - 1.5, d - 1, WOOD_L), box(0, h - 1.5, 0, w, 1.5, d, STONE), ...(w >= 58 ? [-w / 4, w / 4] : [0]).map((x) => cyl(x, h - 0.4, 1, 14, 0.5, 11, WHITE))];
    case 'toilet':
      return [box(0, 15, -d / 2 + 4, w, 15, 8, WHITE), cyl(0, 0, 3, w * 0.7, 15, d * 0.6, WHITE), cyl(0, 15, 3, w * 0.85, 1, d * 0.65, WHITE)];
    case 'tub': {
      const t = 3;
      if (def.id === 'hot-tub') return [box(0, 0, 0, w, h, d, WOOD_D), box(0, h - 0.2, 0, w - 8, 0.4, d - 8, '#6aa5c4')];
      return [box(0, 0, 0, w, 2, d, WHITE), box(0, 2, -d / 2 + t / 2, w, h - 2, t, WHITE), box(0, 2, d / 2 - t / 2, w, h - 2, t, WHITE), box(-w / 2 + t / 2, 2, 0, t, h - 2, d, WHITE), box(w / 2 - t / 2, 2, 0, t, h - 2, d, WHITE)];
    }
    case 'shower':
      return [box(0, 0, 0, w, 3, d, WHITE), box(0, 3, d / 2 - 0.25, w, h - 3, 0.5, '#bcd3de', { m: 'glass' }), cyl(0, h - 6, -d / 2 + 4, 6, 1, 6, STEEL)];
    case 'washer':
    case 'dryer': {
      const stacked = h > 50;
      const unit = (y: number, hh: number) => [box(0, y, 0, w, hh, d, WHITE), cyl(0, y + hh * 0.45, d / 2, 15, 0.8, 15, '#cfd6dc', { rot: [Math.PI / 2, 0, 0] })];
      return stacked ? [...unit(0, h / 2), ...unit(h / 2, h / 2)] : unit(0, h);
    }
    case 'water-heater':
      return [cyl(0, 0, 0, w, h, d, WHITE), cyl(0, h, 0, 3, 6, 3, METAL)];
    case 'monitor': {
      const n = w > 55 ? 3 : w > 40 ? 2 : 1;
      const pw = w / n - (n > 1 ? 0.6 : 0);
      const ph = Math.min(h - 3, n > 1 || w > h ? pw * 0.6 : h - 3);
      const z = -d / 2 + 2.5;
      const out: Part[] = [box(0, 0, z + 1, Math.min(w * 0.4, 10), 0.6, Math.min(d - 1, 8), BLACK), box(0, 0.6, z - 0.8, 1.8, h - ph * 0.6, 1.2, BLACK)];
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + pw / 2 + i * (pw + (n > 1 ? 0.6 : 0)) + (n > 1 ? 0.3 : 0);
        out.push(box(x, h - ph, z, pw, ph, 1, BLACK), box(x, h - ph + 0.6, z + 0.55, pw - 1, ph - 1.2, 0.1, SCREEN));
      }
      return out;
    }
    case 'tv': {
      const panelD = Math.min(d, 2);
      const z = def.mount === 'wall' ? -d / 2 + panelD / 2 + 1 : -d / 2 + 3;
      const out: Part[] = [box(0, def.mount === 'wall' ? 0 : 3, z, w, def.mount === 'wall' ? h : h - 3, panelD, BLACK), box(0, (def.mount === 'wall' ? 0 : 3) + 0.6, z + panelD / 2 + 0.05, w - 1.2, (def.mount === 'wall' ? h : h - 3) - 1.2, 0.1, SCREEN)];
      if (def.mount !== 'wall') out.push(box(-w / 3, 0, 0, 2, 3, d - 1, BLACK), box(w / 3, 0, 0, 2, 3, d - 1, BLACK));
      return out;
    }
    case 'pc-tower':
      return [box(0, 0.8, 0, w, h - 0.8, d, BLACK), box(0, 1.5, d / 2, w - 1.5, h - 3, 0.2, '#34363b'), ...legs(w, d, 0.8, 1, METAL, 0.5)];
    case 'laptop':
      return [box(0, 0, 0, w, 0.7, d, METAL), box(0, 0.7, -d / 2 + 0.3, w, d * 0.95, 0.3, METAL, { rot: [-0.25, 0, 0] })];
    case 'keyboard':
      return def.id === 'keyboard'
        ? [box(-w * 0.14, 0, 0, w * 0.72, h * 0.7, d, BLACK), sph(w / 2 - w * 0.09, 0.6, 0, 2.6, 1.4, 4.4, BLACK)]
        : [box(0, 0, 0, w, h * 0.6, d, BLACK), box(0, h * 0.6, 0.2, w - 0.8, h * 0.4, d - 1, '#3a3c41')];
    case 'mouse':
      return [sph(0, h / 2, 0, w, h, d, BLACK)];
    case 'pad':
      return [box(0, 0, 0, w, Math.max(h, 0.1), d, '#2b2d31')];
    case 'riser':
      if (def.under) return [box(0, 0, 0, w, h, d, BLACK, { rot: [-0.15, 0, 0] })];
      return [box(0, h - 1, 0, w, 1, d, WOOD), box(-w / 2 + 0.75, 0, 0, 1.5, h - 1, d, WOOD), box(w / 2 - 0.75, 0, 0, 1.5, h - 1, d, WOOD)];
    case 'mug':
      return [cyl(0, 0, 0, w, h, d, WHITE)];
    case 'speaker':
      return def.id === 'headphone-stand'
        ? [cyl(0, 0, 0, w, 0.8, d, BLACK), cyl(0, 0.8, 0, 1, h - 3, 1, BLACK), box(0, h - 3, 0, 6, 3, 2, BLACK)]
        : [box(0, 0, 0, w, h, d, BLACK), cyl(0, h * 0.35, d / 2, Math.min(w, h) * 0.6, 0.3, Math.min(w, h) * 0.6, '#3a3c41', { rot: [Math.PI / 2, 0, 0] })];
    case 'printer':
      return [box(0, 0, 0, w, h, d, def.id === 'game-console' ? BLACK : '#d4d4d4'), box(0, h, -d / 4, w * 0.7, 0.3, d * 0.3, '#9a9a9a')];
    case 'lamp':
      return [cyl(0, 0, 0, w * 0.45, 1, d * 0.45, METAL), cyl(0, 1, 0, 0.8, h * 0.55, 0.8, METAL), cyl(0, h * 0.55, 0, w, h * 0.45, d, LINEN)];
    case 'floor-lamp':
      if (def.id === 'coat-tree') return [cyl(0, 0, 0, w * 0.6, 1, d * 0.6, WOOD_D), cyl(0, 1, 0, 1.5, h - 1, 1.5, WOOD), sph(0, h - 10, 0, w * 0.8, 12, d * 0.8, FABRIC_D)];
      return [cyl(0, 0, 0, w * 0.8, 1, d * 0.8, METAL), cyl(0, 1, 0, 1, h - 12, 1, METAL), cyl(0, h - 12, 0, w, 12, d, LINEN)];
    case 'pendant':
      return [cyl(0, h * 0.4, 0, 0.3, h * 0.6, 0.3, BLACK), cyl(0, 0, 0, w, h * 0.4, d, LINEN)];
    case 'ceiling-fan':
      return [cyl(0, h - 2, 0, 5, 2, 5, WHITE), cyl(0, 3, 0, 0.8, h - 5, 0.8, WHITE), cyl(0, 1, 0, 8, 3, 8, WHITE), ...[0, 1, 2, 3].map((i) => box(Math.cos((i * Math.PI) / 2) * (w / 4), 2.5, Math.sin((i * Math.PI) / 2) * (d / 4), i % 2 ? 5 : w / 2 - 4, 0.4, i % 2 ? d / 2 - 4 : 5, WOOD_L))];
    case 'shelf-wall':
      if (def.id === 'coat-hooks') return [box(0, h / 2, -d / 2 + 0.5, w, h / 2, 1, WOOD), ...[-1, 0, 1].map((i) => box((i * w) / 3, 1, 0, 1, 2, d - 1, METAL))];
      if (def.id === 'lumber-rack') return [...[-1, 1].map((s) => box((s * w) / 2.4, 0, -d / 2 + 1, 2, h, 2, METAL)), ...[0, 0.5, 1].map((f) => box(0, f * (h - 2), 0, w, 2, d, WOOD_L))];
      return [box(0, 0, 0, w, 1.2, d, WOOD), box(-w * 0.15, 1.2, -0.5, w * 0.4, h * 0.65, d * 0.7, pick(BOOKS, def.id)), cyl(w * 0.3, 1.2, 0, 4, 5, 4, POT), sph(w * 0.3, 1.2 + 5 + 2.5, 0, 6, 5, 6, GREEN)];
    case 'art':
      return def.round
        ? [cyl(0, h / 2 - w / 2, 0, w, d, h, WHITE, { rot: [Math.PI / 2, 0, 0] })]
        : [box(0, 0, 0, w, h, Math.max(d, 0.6), def.id.startsWith('poster') ? WHITE : WOOD_D), box(0, 1, Math.max(d, 0.6) / 2 + 0.02, w - 2, h - 2, 0.05, pick(ART, def.id))];
    case 'mirror':
      return [box(0, 0, 0, w, h, Math.max(d * 0.5, 0.8), WOOD_D), box(0, 1, Math.max(d * 0.5, 0.8) / 2 + 0.02, w - 2, h - 2, 0.05, '#cfd9df')];
    case 'pegboard':
      return [box(0, 0, -d / 2 + 0.4, w, h, 0.8, '#b48c5c'), box(-w / 4, h * 0.3, 0, 2, h * 0.4, 1.5, RED), box(w / 6, h * 0.4, 0, 8, 1.5, 1.5, METAL)];
    case 'workbench':
      return [box(0, h - 2, 0, w, 2, d, WOOD_L), ...legs(w, d, h - 2, 3, WOOD, 2), box(0, 8, 0, w - 6, 1, d - 6, WOOD)];
    case 'pool-table':
      return [box(0, 10, 0, w, h - 10 - 2, d, WOOD_D), box(0, h - 2, 0, w, 2, d, WOOD_D), box(0, h - 1.5, 0, w - 8, 1.6, d - 8, FELT), ...legs(w, d, 10, 5, WOOD_D, 3)];
    case 'ping-pong': {
      const top = def.id === 'ping-pong' ? '#2a4c7a' : def.id === 'air-hockey' ? WHITE : FELT;
      return [box(0, h - 2, 0, w, 2, d, top), ...legs(w, d, h - 2, 2, BLACK, 4), ...(def.id === 'ping-pong' ? [box(0, h, 0, 0.3, 6, d + 4, WHITE)] : [])];
    }
    case 'arcade':
      return [box(0, 0, -2, w, h, d - 4, BLACK), box(0, 36, d / 2 - 6, w, 3, 10, '#3a3c41'), box(0, 44, 2, w - 4, 16, 1, SCREEN, { rot: [-0.3, 0, 0] })];
    case 'treadmill':
      return [box(0, 0, 4, w - 6, 8, d - 10, BLACK), box(0, 8, 4, w - 10, 0.5, d - 14, '#3a3c41'), box(-w / 2 + 2, 0, -d / 2 + 4, 2, h - 6, 2, METAL), box(w / 2 - 2, 0, -d / 2 + 4, 2, h - 6, 2, METAL), box(0, h - 8, -d / 2 + 5, w - 4, 6, 6, BLACK)];
    case 'bike':
      return def.id === 'rower'
        ? [box(0, 0, 0, 6, 10, d, METAL), box(0, 10, 10, 12, 3, 12, BLACK), cyl(0, 0, -d / 2 + 10, 18, 18, 18, BLACK, { rot: [0, 0, Math.PI / 2] })]
        : [box(0, 0, 0, w, 2, d, BLACK), box(0, 2, -d / 4, 3, h - 18, 3, METAL), box(0, 28, 6, 3, 2, 3, METAL), box(0, 30, 6, 8, 3, 10, BLACK), box(0, 2, -d / 2 + 6, 3, h - 2, 3, METAL), box(0, h - 2, -d / 2 + 6, 18, 2, 3, BLACK), cyl(0, 8, -d / 2 + 10, 14, 3, 14, BLACK, { rot: [0, 0, Math.PI / 2] })];
    case 'weight-bench':
      return [box(0, h - 4, 0, w * 0.6, 4, d, BLACK), ...legs(w * 0.6, d, h - 4, 2, METAL, 2), box(0, 0, 0, w, 1.5, d * 0.9, METAL)];
    case 'rack': {
      const post = def.id === 'clothes-rack' ? 1.2 : 3;
      const out = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => box((sx * (w - post)) / 2, 0, (sz * (d - post)) / 2, post, h, post, def.id === 'clothes-rack' ? METAL : BLACK)));
      out.push(box(0, h - post, -(d - post) / 2, w, post, post, BLACK), box(0, h - post, (d - post) / 2, w, post, post, BLACK));
      if (def.id === 'clothes-rack') out.push(box(0, h * 0.4, 0, w - 4, h * 0.5, 10, pick(ART, 'clothes')));
      else out.push(box(0, 48, 0, w + 8, 1.5, 1.5, STEEL));
      return out;
    }
    case 'guitar':
      return [sph(0, 12, 0, w * 0.9, 20, Math.max(3, d * 0.3), WOOD_L), box(0, 20, 0, 2, h - 20, 1.2, WOOD_D), ...(def.mount === 'wall' ? [] : [box(0, 0, 0, w, 1, d, BLACK)])];
    case 'drums':
      return [
        cyl(0, 2, -d * 0.2, 20, 20, 20, RED, { rot: [Math.PI / 2, 0, 0] }),
        cyl(-w * 0.3, 0, d * 0.2, 14, 22, 14, RED),
        cyl(w * 0.3, 0, d * 0.25, 16, 18, 16, RED),
        cyl(-w * 0.15, 26, -d * 0.05, 12, 8, 12, RED),
        cyl(w * 0.15, 26, -d * 0.05, 12, 8, 12, RED),
        cyl(-w * 0.4, h - 10, -d * 0.2, 16, 0.4, 16, '#c8a64a'),
        cyl(w * 0.4, h - 6, -d * 0.2, 18, 0.4, 18, '#c8a64a'),
        cyl(-w * 0.4, 0, -d * 0.2, 1, h - 10, 1, METAL),
        cyl(w * 0.4, 0, -d * 0.2, 1, h - 6, 1, METAL),
      ];
    case 'aquarium':
      return [box(0, 0, 0, w, 30, d, BLACK), box(0, 30, 0, w, h - 30, d, '#7fb3cf', { m: 'glass' }), box(0, 31, 0, w - 2, 2, d - 2, '#c9b48a')];
    case 'easel':
      return [box(-w / 3, 0, 4, 1.5, h, 1.5, WOOD, { rot: [0, 0, 0.12] }), box(w / 3, 0, 4, 1.5, h, 1.5, WOOD, { rot: [0, 0, -0.12] }), box(0, 0, -d / 2 + 2, 1.5, h - 4, 1.5, WOOD, { rot: [0.25, 0, 0] }), box(0, 30, 3, w * 0.8, 28, 1, WHITE)];
    case 'divider': {
      const n = 3,
        pw = w / n;
      return Array.from({ length: n }, (_, i) => box(-w / 2 + pw / 2 + i * pw, 1, 0, pw - 0.5, h - 1, 1, WOOD_L, { rot: [0, i % 2 ? 0.5 : -0.5, 0] }));
    }
    case 'led-strip':
      return [box(0, 0, 0, w, Math.max(h, 0.6), Math.max(d, 0.6), '#fff2c6', { m: 'glow' })];
    default:
      return [box(0, 0, 0, w, h, d, def.round ? METAL : FABRIC)];
  }
}

