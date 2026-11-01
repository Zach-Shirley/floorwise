/**
 * Placed furniture: fit checks against walls, doors, fixtures and other pieces,
 * plus snapping helpers used while dragging.
 */
import { getFurniture } from '../data/furniture';
import { boxCorners, convexOverlap, rectPoly, type Pt } from './geometry';
import { WALL_EXT, WALL_HALF, inRoom, itemCorners, type RFloor, type RFixture, type RRoom, type RWall } from './resolve';
import type { FurnitureDef, Rect } from './types';

export interface PlacedItem {
  uid: string;
  /** Furniture catalog id. */
  item: string;
  floor: string;
  /** Center, in feet. */
  x: number;
  y: number;
  /** Clockwise degrees; 0 = front faces south (down the screen). */
  rot: number;
}

export interface FitWarning {
  level: 'block' | 'tight';
  msg: string;
}

export interface ItemBox {
  cx: number;
  cy: number;
  w: number;
  d: number;
  rot: number;
}

export const itemBox = (p: PlacedItem, def: FurnitureDef): ItemBox => ({
  cx: p.x,
  cy: p.y,
  w: def.w / 12,
  d: def.d / 12,
  rot: p.rot,
});

/** The solid footprint of a wall piece (exterior walls grow outward). */
export function wallRect(w: RWall): Rect {
  const { seg } = w;
  let lo: number, hi: number;
  if (w.kind === 'int') {
    lo = seg.c - WALL_HALF;
    hi = seg.c + WALL_HALF;
  } else {
    const o = w.out!;
    const a = seg.c - o * WALL_HALF,
      b = seg.c + o * (WALL_EXT - WALL_HALF);
    lo = Math.min(a, b);
    hi = Math.max(a, b);
  }
  return seg.o === 'h' ? [seg.a0, lo, seg.a1 - seg.a0, hi - lo] : [lo, seg.a0, hi - lo, seg.a1 - seg.a0];
}

/** Local-frame rect (relative to item center, before rotation) -> world polygon. */
function localPoly(b: ItemBox, x: number, y: number, w: number, h: number): Pt[] {
  const t = (b.rot * Math.PI) / 180;
  return boxCorners(x + w / 2, y + h / 2, w, h, 0).map((p) => ({
    x: b.cx + p.x * Math.cos(t) - p.y * Math.sin(t),
    y: b.cy + p.x * Math.sin(t) + p.y * Math.cos(t),
  }));
}

/** Recommended clear zones around an item (front strip, side strips), as world polygons. */
export function clearanceZones(b: ItemBox, def: FurnitureDef): { poly: Pt[]; label: string }[] {
  const out: { poly: Pt[]; label: string }[] = [];
  const front = def.clearance?.front ?? 0;
  const sides = def.clearance?.sides ?? 0;
  if (front > 0) out.push({ poly: localPoly(b, -b.w / 2, b.d / 2, b.w, front / 12), label: `${front}" in front` });
  if (sides > 0) {
    out.push({ poly: localPoly(b, -b.w / 2 - sides / 12, -b.d / 2, sides / 12, b.d), label: `${sides}" at the side` });
    out.push({ poly: localPoly(b, b.w / 2, -b.d / 2, sides / 12, b.d), label: `${sides}" at the side` });
  }
  return out;
}

const TOL = 0.03; // ~3/8": touching is fine

export function analyzeFit(floor: RFloor, items: PlacedItem[]): Map<string, FitWarning[]> {
  const res = new Map<string, FitWarning[]>();
  const wallPolys = floor.walls.map((w) => rectPoly(wallRect(w)));
  const boxes = items.flatMap((p) => {
    const def = getFurniture(p.item);
    if (!def) return [];
    const b = itemBox(p, def);
    return [{ p, def, b, poly: itemCorners(b) }];
  });
  const fixtures = floor.fixtures.map((f: RFixture) => ({ f, poly: itemCorners(f) }));

  for (const it of boxes) {
    const warns: FitWarning[] = [];
    const add = (level: FitWarning['level'], msg: string) => {
      if (!warns.some((w) => w.msg === msg)) warns.push({ level, msg });
    };
    const center = { x: it.b.cx, y: it.b.cy };
    if (!floor.rooms.some((r) => inRoom(center, r, 0))) add('block', 'Outside the house');
    if (wallPolys.some((w) => convexOverlap(it.poly, w, TOL) > 0)) add('block', 'Runs into a wall');
    if (!it.def.flat) {
      for (const d of floor.doors) {
        if (d.swingPolys.some((s) => convexOverlap(it.poly, s, TOL) > 0)) add('block', 'Blocks a door swing');
        else if (d.approach.some((a) => convexOverlap(it.poly, rectPoly(a), TOL) > 0)) add('tight', 'Crowds a doorway');
      }
      for (const fx of fixtures)
        if (convexOverlap(it.poly, fx.poly, TOL) > 0) add('block', `Overlaps the ${fx.f.def.name.toLowerCase()}`);
      for (const other of boxes) {
        if (other === it || other.def.flat) continue;
        if (convexOverlap(it.poly, other.poly, TOL) > 0) add('block', `Overlaps the ${other.def.name.toLowerCase()}`);
      }
      if (!warns.some((w) => w.level === 'block')) {
        for (const z of clearanceZones(it.b, it.def)) {
          const hit =
            wallPolys.some((w) => convexOverlap(z.poly, w, TOL) > 0) ||
            fixtures.some((fx) => convexOverlap(z.poly, fx.poly, TOL) > 0) ||
            boxes.some((o) => o !== it && !o.def.flat && convexOverlap(z.poly, o.poly, TOL) > 0);
          if (hit) add('tight', `Less than ${z.label} clear`);
        }
      }
    }
    if (warns.length) res.set(it.p.uid, warns);
  }
  return res;
}

/**
 * Pull an axis-aligned item flush against nearby wall faces of the room it is in.
 * Returns the adjusted center.
 */
export function snapToWalls(floor: RFloor, b: ItemBox, dist = 0.4): { x: number; y: number } {
  const quarter = ((Math.round(b.rot) % 360) + 360) % 360;
  if (quarter % 90 !== 0) return { x: b.cx, y: b.cy };
  const sideways = quarter % 180 !== 0;
  const hw = (sideways ? b.d : b.w) / 2,
    hd = (sideways ? b.w : b.d) / 2;
  const room = floor.rooms.find((r) => inRoom({ x: b.cx, y: b.cy }, r, 0));
  if (!room) return { x: b.cx, y: b.cy };
  let bestX = dist,
    bestY = dist,
    x = b.cx,
    y = b.cy;
  for (const r of room.rects) {
    const x0 = r[0] + WALL_HALF,
      x1 = r[0] + r[2] - WALL_HALF,
      y0 = r[1] + WALL_HALF,
      y1 = r[1] + r[3] - WALL_HALF;
    const cands: [number, 'x' | 'y', number][] = [
      [Math.abs(b.cx - hw - x0), 'x', x0 + hw],
      [Math.abs(b.cx + hw - x1), 'x', x1 - hw],
      [Math.abs(b.cy - hd - y0), 'y', y0 + hd],
      [Math.abs(b.cy + hd - y1), 'y', y1 - hd],
    ];
    for (const [d, axis, v] of cands) {
      if (axis === 'x' && d < bestX) [bestX, x] = [d, v];
      if (axis === 'y' && d < bestY) [bestY, y] = [d, v];
    }
  }
  return { x, y };
}

/** Pieces that belong in the middle of a room rather than against a wall. */
const CENTRAL = new Set(['table-rect', 'table-round', 'rug', 'coffee-table', 'island']);

/**
 * Find a good spot for a new piece in a room: back against a wall (or centered
 * for tables and rugs), preferring spots with no fit warnings.
 */
export function findSpot(floor: RFloor, items: PlacedItem[], item: string, room: RRoom): { x: number; y: number; rot: number } | null {
  const def = getFurniture(item);
  if (!def) return null;
  const w = def.w / 12,
    d = def.d / 12;
  const central = CENTRAL.has(def.symbol);
  const [cx, cy] = [room.labelAt.x, room.labelAt.y];
  const cands: { x: number; y: number; rot: number; bias: number }[] = [];
  const step = 0.25;
  for (const r of room.rects) {
    const x0 = r[0] + WALL_HALF,
      x1 = r[0] + r[2] - WALL_HALF,
      y0 = r[1] + WALL_HALF,
      y1 = r[1] + r[3] - WALL_HALF;
    if (central) {
      for (const rot of [0, 90]) {
        const hw = (rot ? d : w) / 2,
          hd = (rot ? w : d) / 2;
        for (let x = x0 + hw; x <= x1 - hw + 1e-6; x += step)
          for (let y = y0 + hd; y <= y1 - hd + 1e-6; y += step) cands.push({ x, y, rot, bias: Math.hypot(x - cx, y - cy) });
      }
      continue;
    }
    for (let a = x0 + w / 2; a <= x1 - w / 2 + 1e-6; a += step) {
      cands.push({ x: a, y: y0 + d / 2, rot: 0, bias: Math.abs(a - cx) * 0.2 });
      cands.push({ x: a, y: y1 - d / 2, rot: 180, bias: Math.abs(a - cx) * 0.2 });
    }
    for (let a = y0 + w / 2; a <= y1 - w / 2 + 1e-6; a += step) {
      cands.push({ x: x0 + d / 2, y: a, rot: 270, bias: Math.abs(a - cy) * 0.2 });
      cands.push({ x: x1 - d / 2, y: a, rot: 90, bias: Math.abs(a - cy) * 0.2 });
    }
  }
  const others = items.filter((i) => i.floor === floor.id);
  let best: { x: number; y: number; rot: number; score: number } | null = null;
  for (const c of cands) {
    const probe: PlacedItem = { uid: '__probe', item, floor: floor.id, x: c.x, y: c.y, rot: c.rot };
    const warns = analyzeFit(floor, [...others, probe]).get('__probe') ?? [];
    const score = warns.reduce((s, w) => s + (w.level === 'block' ? 1000 : 40), 0) + c.bias;
    if (!best || score < best.score) best = { ...c, score };
    if (score < 1 && !central) break;
  }
  return best && best.score < 1000 ? best : null;
}

export const newUid = () => Math.random().toString(36).slice(2, 10);
