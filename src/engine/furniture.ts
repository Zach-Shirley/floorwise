/**
 * Placed furniture: fit checks against walls, doors, windows, fixtures and other
 * pieces, plus snapping helpers used while dragging.
 *
 * Height is the "third dimension" on a 2D plan. Every piece has a vertical band
 * (bottom to top, in inches). Two pieces only collide when their footprints AND
 * their bands overlap, so a PC tower fits under a desk, a monitor rests on it,
 * and a shelf can hang on the wall above a dresser.
 */
import { getFurniture } from '../data/furniture';
import { boxCorners, convexOverlap, rectPoly, sideOf, unionBoundary, type Pt } from './geometry';
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
  /** Wall pieces only: bottom edge height in inches (overrides the catalog default). */
  elev?: number;
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

/** Ceiling height in inches (8'). */
export const CEILING = 96;
/** Doors are 80" tall: anything lower than that inside a swing gets hit. */
const DOOR_H = 80;
/** Typical window: sill at 36", head at 84". */
const WINDOW_BAND: [number, number] = [36, 84];

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

/** Local-frame point (relative to item center, before rotation) -> world point. */
function localPt(b: ItemBox, x: number, y: number): Pt {
  const t = (b.rot * Math.PI) / 180;
  return { x: b.cx + x * Math.cos(t) - y * Math.sin(t), y: b.cy + x * Math.sin(t) + y * Math.cos(t) };
}

/** Local-frame rect (relative to item center, before rotation) -> world polygon. */
function localPoly(b: ItemBox, x: number, y: number, w: number, h: number): Pt[] {
  return boxCorners(x + w / 2, y + h / 2, w, h, 0).map((p) => localPt(b, p.x, p.y));
}

/** The footprint as convex polygons: one box, or one per part for L-shapes. */
export function itemPolys(b: ItemBox, def: FurnitureDef): Pt[][] {
  if (!def.parts) return [itemCorners(b)];
  return def.parts.map(([x, y, w, d]) => localPoly(b, x / 12 - b.w / 2, y / 12 - b.d / 2, w / 12, d / 12));
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

function pointInConvex(p: Pt, poly: Pt[]): boolean {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(cross) < 1e-9) continue;
    const s = Math.sign(cross);
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

const polysOverlap = (a: Pt[][], b: Pt[][], tol: number) => a.some((p) => b.some((q) => convexOverlap(p, q, tol) > 0));

// ---------------------------------------------------------------------------
// Heights

export interface Stack {
  /** Height of the piece's mount point (its bottom) above the floor, inches. */
  elev: number;
  /** Solid vertical band [bottom, top] in inches, after any open space underneath. */
  band: [number, number];
  /** What a surface piece rests on. */
  on?: { uid?: string; name: string };
}

const bandOf = (def: FurnitureDef, elev: number): [number, number] => [elev + (def.clearUnder ?? 0), elev + def.h];

/**
 * Work out every piece's height. Floor, wall and ceiling pieces know theirs;
 * surface pieces rest on the tallest floor piece or fixture under their center.
 */
export function resolveStacks(floor: RFloor, items: PlacedItem[]): Map<string, Stack> {
  const res = new Map<string, Stack>();
  type Support = { uid?: string; name: string; polys: Pt[][]; top: number };
  const base: Support[] = floor.fixtures.map((f) => ({ name: f.def.name, polys: [itemCorners(f)], top: f.def.h }));
  const holders: PlacedItem[] = [];
  const surface: PlacedItem[] = [];
  for (const p of items) {
    const def = getFurniture(p.item);
    if (!def) continue;
    const mount = def.mount ?? 'floor';
    if (mount === 'surface') {
      (def.holds ? holders : surface).push(p);
      continue;
    }
    const elev = mount === 'wall' ? p.elev ?? def.elev ?? 48 : mount === 'ceiling' ? CEILING - def.h : 0;
    res.set(p.uid, { elev, band: bandOf(def, elev) });
    // Things rest on floor furniture (not on chairs pushed under a desk), and on wall-mounted desks.
    const supports = (mount === 'floor' && !def.flat && !def.tucks) || (mount === 'wall' && def.symbol === 'desk');
    if (supports) base.push({ uid: p.uid, name: def.name, polys: itemPolys(itemBox(p, def), def), top: elev + def.h });
  }
  const settle = (p: PlacedItem, supports: Support[]) => {
    const def = getFurniture(p.item)!;
    const c = { x: p.x, y: p.y };
    let best: Support | null = null;
    for (const s of supports) {
      if (s.uid === p.uid) continue;
      if (s.polys.some((poly) => pointInConvex(c, poly)) && (!best || s.top > best.top)) best = s;
    }
    const elev = best?.top ?? 0;
    res.set(p.uid, { elev, band: bandOf(def, elev), on: best ? { uid: best.uid, name: best.name } : undefined });
    return { uid: p.uid, name: def.name, polys: itemPolys(itemBox(p, def), def), top: elev + def.h };
  };
  // Holders (mats, risers) settle first, twice so a riser can sit on a mat; then everything else.
  let held = holders.map((p) => settle(p, base));
  held = holders.map((p) => settle(p, [...base, ...held]));
  for (const p of surface) settle(p, [...base, ...held]);
  return res;
}

const bandsOverlap = (a: [number, number], b: [number, number]) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 0.5;

// ---------------------------------------------------------------------------
// Fit

const TOL = 0.03; // ~3/8": touching is fine

/** Is there a wall right behind this piece's back edge? */
function backOnWall(b: ItemBox, wallPolys: Pt[][]): boolean {
  const probes = [-0.3, 0, 0.3].map((f) => localPt(b, f * b.w, -b.d / 2 - 1.5 / 12));
  return probes.filter((p) => wallPolys.some((w) => pointInConvex(p, w))).length >= 2;
}

/** A thin box covering a window opening, reaching a few inches into the room. */
function windowZone(floor: RFloor, i: number): Pt[] {
  const w = floor.windows[i];
  const reach = WALL_HALF + 4 / 12;
  const { seg } = w;
  const lo = seg.c - w.out * reach,
    hi = seg.c;
  const [a, b] = [Math.min(lo, hi), Math.max(lo, hi)];
  return rectPoly(seg.o === 'h' ? [seg.a0, a, seg.a1 - seg.a0, b - a] : [a, seg.a0, b - a, seg.a1 - seg.a0]);
}

export function analyzeFit(floor: RFloor, items: PlacedItem[]): Map<string, FitWarning[]> {
  const res = new Map<string, FitWarning[]>();
  const wallPolys = floor.walls.map((w) => rectPoly(wallRect(w)));
  const windows = floor.windows.map((_, i) => windowZone(floor, i));
  const stacks = resolveStacks(floor, items);
  const boxes = items.flatMap((p) => {
    const def = getFurniture(p.item);
    const st = stacks.get(p.uid);
    if (!def || !st) return [];
    const b = itemBox(p, def);
    return [{ p, def, b, polys: itemPolys(b, def), st }];
  });
  const fixtures = floor.fixtures.map((f: RFixture) => ({ f, polys: [itemCorners(f)], band: bandOf(f.def, 0) }));

  for (const it of boxes) {
    const warns: FitWarning[] = [];
    const add = (level: FitWarning['level'], msg: string) => {
      if (!warns.some((w) => w.msg === msg)) warns.push({ level, msg });
    };
    const mount = it.def.mount ?? 'floor';
    const low = it.st.band[0] < DOOR_H;
    const thin = it.def.d <= 2;
    const center = { x: it.b.cx, y: it.b.cy };
    if (!floor.rooms.some((r) => r.type !== 'open-below' && inRoom(center, r, 0))) add('block', 'Outside the house');
    if (wallPolys.some((w) => it.polys.some((p) => convexOverlap(p, w, TOL) > 0))) add('block', 'Runs into a wall');
    if (mount === 'wall' && !backOnWall(it.b, wallPolys)) add('block', 'Needs a wall behind it to hang on');
    if (mount === 'surface' && !it.st.on) add('tight', 'Sitting on the floor: put it on a desk, table or dresser');
    if (it.def.flat) {
      if (warns.length) res.set(it.p.uid, warns);
      continue;
    }
    if (low) {
      for (const d of floor.doors) {
        if (d.swingPolys.some((s) => it.polys.some((p) => convexOverlap(p, s, TOL) > 0))) add('block', 'Blocks a door swing');
        else if (!thin && d.approach.some((a) => it.polys.some((p) => convexOverlap(p, rectPoly(a), TOL) > 0))) add('tight', 'Crowds a doorway');
      }
    }
    for (const fx of fixtures)
      if (bandsOverlap(it.st.band, fx.band) && polysOverlap(it.polys, fx.polys, TOL)) add('block', `Overlaps the ${fx.f.def.name.toLowerCase()}`);
    for (const other of boxes) {
      if (other === it || other.def.flat) continue;
      if (it.st.on?.uid === other.p.uid || other.st.on?.uid === it.p.uid) continue; // resting on it
      // a chair pushed in under a desk or table, and so passing under whatever sits on top of it
      const tuckedUnder = (a: FurnitureDef, b: FurnitureDef) => a.tucks && (b.clearUnder || b.mount === 'surface');
      if (tuckedUnder(it.def, other.def) || tuckedUnder(other.def, it.def)) continue;
      if (!bandsOverlap(it.st.band, other.st.band)) continue; // one is above the other
      if (polysOverlap(it.polys, other.polys, TOL)) add('block', `Overlaps the ${other.def.name.toLowerCase()}`);
    }
    if (mount !== 'ceiling' && bandsOverlap(it.st.band, WINDOW_BAND) && windows.some((w) => it.polys.some((p) => convexOverlap(p, w, TOL) > 0)))
      add('tight', mount === 'wall' ? 'Covers a window' : 'Blocks part of a window');
    if (!warns.some((w) => w.level === 'block')) {
      for (const z of clearanceZones(it.b, it.def)) {
        const zp = [z.poly];
        const hit =
          wallPolys.some((w) => convexOverlap(z.poly, w, TOL) > 0) ||
          fixtures.some((fx) => fx.band[0] < 30 && polysOverlap(zp, fx.polys, TOL)) ||
          boxes.some(
            (o) =>
              o !== it &&
              !o.def.flat &&
              !o.def.tucks &&
              o.st.band[0] < 30 &&
              o.st.on?.uid !== it.p.uid &&
              polysOverlap(zp, o.polys, TOL),
          );
        if (hit) add('tight', `Less than ${z.label} clear`);
      }
    }
    if (warns.length) res.set(it.p.uid, warns);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Snapping and placement

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

/**
 * Wall pieces: hang on the nearest wall of the room under the cursor, back to
 * the wall, sliding along it. Returns the new center and rotation.
 */
export function snapToWallMount(floor: RFloor, b: ItemBox): { x: number; y: number; rot: number } {
  const p = { x: b.cx, y: b.cy };
  const room = floor.rooms.find((r) => inRoom(p, r, 0.5));
  if (!room) return { x: b.cx, y: b.cy, rot: b.rot };
  const wallPolys = floor.walls.map((w) => rectPoly(wallRect(w)));
  let best: { dist: number; x: number; y: number; rot: number } | null = null;
  for (const seg of unionBoundary(room.rects)) {
    const inside = sideOf(seg, room.rects); // which way the room lies from this edge
    const face = seg.c + inside * WALL_HALF;
    const span = seg.a1 - seg.a0;
    if (span < b.w - 1e-6) continue;
    const along = Math.min(Math.max(seg.o === 'h' ? p.x : p.y, seg.a0 + b.w / 2), seg.a1 - b.w / 2);
    const across = face + (inside * b.d) / 2;
    const x = seg.o === 'h' ? along : across,
      y = seg.o === 'h' ? across : along;
    const dist = Math.hypot(x - p.x, y - p.y);
    // Back faces the wall: wall to the north -> rot 0, east -> 90, south -> 180, west -> 270.
    const rot = seg.o === 'h' ? (inside === 1 ? 0 : 180) : inside === 1 ? 270 : 90;
    if (!backOnWall({ cx: x, cy: y, w: b.w, d: b.d, rot }, wallPolys)) continue; // open edge or doorway
    if (!best || dist < best.dist) best = { dist, x, y, rot };
  }
  return best ? { x: best.x, y: best.y, rot: best.rot } : { x: b.cx, y: b.cy, rot: b.rot };
}

/**
 * Pieces that belong to `uid` and travel along when it moves: things resting on
 * it (monitors on a desk, a lamp on a nightstand) and under-desk pieces tucked
 * beneath it (a PC tower, a drawer pedestal).
 */
export function ridersOf(floor: RFloor, items: PlacedItem[], uid: string): PlacedItem[] {
  const stacks = resolveStacks(floor, items);
  const out: PlacedItem[] = [];
  const seen = new Set([uid]);
  const queue = [uid];
  while (queue.length) {
    const hid = queue.shift()!;
    const host = items.find((i) => i.uid === hid);
    const hdef = host && getFurniture(host.item);
    if (!host || !hdef) continue;
    const hostPolys = hdef.clearUnder ? itemPolys(itemBox(host, hdef), hdef) : [];
    for (const i of items) {
      if (seen.has(i.uid)) continue;
      const d = getFurniture(i.item);
      const onIt = stacks.get(i.uid)?.on?.uid === hid;
      const underIt = !!d?.under && d.h <= (hdef.clearUnder ?? 0) && hostPolys.some((p) => pointInConvex({ x: i.x, y: i.y }, p));
      if (onIt || underIt) {
        seen.add(i.uid);
        out.push(i);
        queue.push(i.uid); // a keyboard on a mat on a desk travels with the desk
      }
    }
  }
  return out;
}

/** Move `riders` the same way their support moved from `from` to `to` (translate + rotate about its center). */
export function carryRiders(
  riders: PlacedItem[],
  from: { x: number; y: number; rot: number },
  to: { x: number; y: number; rot: number },
): { uid: string; x: number; y: number; rot: number }[] {
  const da = to.rot - from.rot;
  const t = (da * Math.PI) / 180;
  return riders.map((r) => {
    const dx = r.x - from.x,
      dy = r.y - from.y;
    return {
      uid: r.uid,
      x: to.x + dx * Math.cos(t) - dy * Math.sin(t),
      y: to.y + dx * Math.sin(t) + dy * Math.cos(t),
      rot: (((r.rot + da) % 360) + 360) % 360,
    };
  });
}

/** Pieces that belong in the middle of a room rather than against a wall. */
const CENTRAL = new Set(['table-rect', 'table-round', 'rug', 'coffee-table', 'island', 'pool-table', 'ping-pong', 'ottoman', 'ceiling-fan', 'pendant', 'beanbag']);

type Spot = { x: number; y: number; rot: number };

/**
 * Find a good spot for a new piece in a room: back against a wall (or centered
 * for tables and rugs), on a desk or table for surface pieces, under a desk for
 * PC towers, preferring spots with no fit warnings.
 */
export function findSpot(floor: RFloor, items: PlacedItem[], item: string, room: RRoom): Spot | null {
  const def = getFurniture(item);
  if (!def) return null;
  const w = def.w / 12,
    d = def.d / 12;
  const central = CENTRAL.has(def.symbol);
  const [cx, cy] = [room.labelAt.x, room.labelAt.y];
  const others = items.filter((i) => i.floor === floor.id);
  const score = (c: Spot) => {
    const probe: PlacedItem = { uid: '__probe', item, floor: floor.id, ...c };
    const warns = analyzeFit(floor, [...others, probe]).get('__probe') ?? [];
    return warns.reduce((s, w) => s + (w.level === 'block' ? 1000 : 40), 0);
  };

  // On top of something, or tucked under something, in this room.
  const hosts = others
    .map((o) => ({ o, def: getFurniture(o.item)! }))
    .filter(({ o, def: hd }) => hd && inRoom({ x: o.x, y: o.y }, room, 0) && (hd.mount ?? 'floor') === 'floor' && !hd.flat);
  if (def.mount === 'surface' || def.under) {
    const prefs = def.sitsOn ?? [];
    const ok = hosts.filter(({ def: hd }) => (def.under ? (hd.clearUnder ?? 0) >= def.h : prefs.length === 0 || prefs.includes(hd.symbol)));
    ok.sort((a, b) => (prefs.indexOf(a.def.symbol) + 99) % 99 - (prefs.indexOf(b.def.symbol) + 99) % 99);
    for (const { o, def: hd } of ok) {
      const hb = itemBox(o, hd);
      // local offsets on the host: back-center for surface pieces, back corners underneath
      const offs: [number, number][] = def.under
        ? [
            [hb.w / 2 - w / 2 - 1 / 12, -hb.d / 2 + d / 2 + 1 / 12],
            [-hb.w / 2 + w / 2 + 1 / 12, -hb.d / 2 + d / 2 + 1 / 12],
          ]
        : [
            [0, -hb.d / 2 + d / 2 + 2 / 12],
            [-hb.w / 4, -hb.d / 2 + d / 2 + 2 / 12],
            [hb.w / 4, -hb.d / 2 + d / 2 + 2 / 12],
            [0, 0],
          ];
      for (const [lx, ly] of offs) {
        const p = localPt(hb, lx, ly);
        const c = { x: p.x, y: p.y, rot: o.rot };
        if (score(c) < 1) return c;
      }
    }
  }

  const cands: (Spot & { bias: number })[] = [];
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
  let best: (Spot & { score: number }) | null = null;
  for (const c of cands) {
    const s = score(c) + c.bias;
    if (!best || s < best.score) best = { x: c.x, y: c.y, rot: c.rot, score: s };
    if (s < 1 && !central) break;
  }
  return best && best.score < 1000 ? { x: best.x, y: best.y, rot: best.rot } : null;
}

export const newUid = () => Math.random().toString(36).slice(2, 10);
