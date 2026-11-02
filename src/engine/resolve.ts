/**
 * Turns a LayoutDef (plain data) into drawable geometry: walls, door swings,
 * windows, fixture boxes and areas. Anything that doesn't line up becomes an
 * `issue` string instead of throwing, so a half-written layout still renders
 * and tells you what to fix.
 */
import { getFurniture } from '../data/furniture';
import {
  EPS,
  bbox,
  boxCorners,
  near,
  pointInRect,
  rectArea,
  sideOf,
  subtractIntervals,
  unionBoundary,
  type Pt,
  type Seg,
} from './geometry';
import type {
  DoorDef,
  DoorKind,
  FixtureDef,
  FloorDef,
  FurnitureDef,
  LayoutDef,
  Rect,
  RoomDef,
  RoomType,
  Side,
  Zone,
} from './types';

/** Interior wall thickness, 4.5" (2x4 stud + drywall). */
export const WALL_INT = 4.5 / 12;
/** Exterior wall thickness, 7". Its inside face lines up with interior walls. */
export const WALL_EXT = 7 / 12;
/** Distance from a wall centerline to its inside face. */
export const WALL_HALF = WALL_INT / 2;

export const ZONE_OF: Record<RoomType, Zone> = {
  living: 'public',
  family: 'public',
  dining: 'public',
  kitchen: 'public',
  office: 'public',
  flex: 'public',
  great: 'public',
  studio: 'public',
  workshop: 'service',
  'open-below': 'circulation',
  powder: 'public',
  entry: 'circulation',
  hall: 'circulation',
  stair: 'circulation',
  bedroom: 'private',
  primary: 'private',
  bath: 'private',
  closet: 'private',
  walkin: 'private',
  laundry: 'service',
  mudroom: 'service',
  pantry: 'service',
  utility: 'service',
  garage: 'service',
  porch: 'outdoor',
  deck: 'outdoor',
};

export const WET_TYPES: RoomType[] = ['kitchen', 'bath', 'powder', 'laundry'];
export const OUTDOOR_TYPES: RoomType[] = ['porch', 'deck'];
export const UNCONDITIONED_TYPES: RoomType[] = ['garage', 'porch', 'deck', 'open-below'];

export interface RRoom {
  id: string;
  name: string;
  type: RoomType;
  zone: Zone;
  wet: boolean;
  outdoor: boolean;
  conditioned: boolean;
  rects: Rect[];
  bbox: Rect;
  area: number;
  boundary: Seg[];
  /** Where the label goes: center of the largest rect. */
  labelAt: Pt;
  /** Size of the largest rect, for the "12'0" x 14'0"" label. */
  dims: [number, number];
  shaped: boolean;
  note?: string;
}

export interface RDoor {
  id: string;
  a: string;
  b: string;
  kind: DoorKind;
  /** The opening itself, as a segment on the wall line. */
  seg: Seg;
  width: number;
  /** Room the leaf swings into, or '' for kinds without a swing. */
  swingRoom: string;
  /** +1 / -1: the swing goes toward greater / smaller coordinate across the wall. */
  dir: 1 | -1;
  hinge: 'start' | 'end';
  main: boolean;
  /** Full open edge (no wall at all between the rooms). */
  full: boolean;
  /** Convex polygons swept by the door leaf (empty for slides, pockets, openings). */
  swingPolys: Pt[][];
  /** Space just in front of and behind the opening that should stay clear. */
  approach: Rect[];
}

export interface RWindow {
  room: string;
  seg: Seg;
  /** Direction from the room toward outside across the wall. */
  out: 1 | -1;
}

export interface RWall {
  seg: Seg;
  kind: 'ext' | 'int';
  /** For exterior walls: which way is outside (+1 / -1 across the wall). */
  out?: 1 | -1;
  capStart: boolean;
  capEnd: boolean;
}

export interface RFixture {
  id: string;
  def: FurnitureDef;
  room: string;
  cx: number;
  cy: number;
  /** Feet. */
  w: number;
  d: number;
  rot: number;
}

export interface RFloor {
  id: string;
  name: string;
  rooms: RRoom[];
  roomById: Map<string, RRoom>;
  doors: RDoor[];
  windows: RWindow[];
  walls: RWall[];
  fixtures: RFixture[];
  bbox: Rect;
  /** Conditioned (heated) area in sq ft. */
  area: number;
  issues: string[];
}

export interface RLayout {
  def: LayoutDef;
  floors: RFloor[];
  area: number;
  garageArea: number;
  outdoorArea: number;
  issues: string[];
}

const DOOR_INT = 32 / 12;
const DOOR_EXT = 3;
const CORNER = 4 / 12;
const APPROACH = 1.5;

export function roomRects(r: RoomDef): Rect[] {
  if (r.rects?.length) return r.rects;
  if (r.rect) return [r.rect];
  return [];
}

function resolveRoom(def: RoomDef): RRoom {
  const rects = roomRects(def);
  const largest = rects.reduce((m, r) => (rectArea(r) > rectArea(m) ? r : m), rects[0] ?? [0, 0, 0, 0]);
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    zone: ZONE_OF[def.type],
    wet: WET_TYPES.includes(def.type),
    outdoor: OUTDOOR_TYPES.includes(def.type),
    conditioned: !UNCONDITIONED_TYPES.includes(def.type),
    rects,
    bbox: rects.length ? bbox(rects) : [0, 0, 0, 0],
    area: rects.reduce((s, r) => s + rectArea(r), 0),
    boundary: unionBoundary(rects),
    labelAt: { x: largest[0] + largest[2] / 2, y: largest[1] + largest[3] / 2 },
    dims: [largest[2], largest[3]],
    shaped: rects.length > 1,
    note: def.note,
  };
}

interface SharedSeg extends Seg {
  /** Side of the first room relative to the segment. */
  sideA: 1 | -1;
}

const lineKey = (o: string, c: number) => `${o}:${Math.round(c * 1000)}`;

/** Wall segments where room A touches room B. */
export function sharedSegments(A: RRoom, B: RRoom): SharedSeg[] {
  const out: SharedSeg[] = [];
  for (const sa of A.boundary) {
    for (const sb of B.boundary) {
      if (sa.o !== sb.o || !near(sa.c, sb.c)) continue;
      const a0 = Math.max(sa.a0, sb.a0),
        a1 = Math.min(sa.a1, sb.a1);
      if (a1 - a0 > EPS) out.push({ o: sa.o, c: sa.c, a0, a1, sideA: sideOf(sa, A.rects) });
    }
  }
  return out;
}

/** Parts of a room's outline with no indoor room on the other side. */
export function exteriorSegments(A: RRoom, rooms: RRoom[]): SharedSeg[] {
  const others = rooms.filter((r) => r.id !== A.id && !r.outdoor);
  const out: SharedSeg[] = [];
  for (const s of A.boundary) {
    const cuts: [number, number][] = [];
    for (const B of others) {
      for (const t of B.boundary) {
        if (t.o === s.o && near(t.c, s.c)) cuts.push([Math.max(s.a0, t.a0), Math.min(s.a1, t.a1)]);
      }
    }
    for (const [a0, a1] of subtractIntervals(
      s.a0,
      s.a1,
      cuts.filter(([x, y]) => y - x > EPS),
    )) {
      if (a1 - a0 > EPS) out.push({ o: s.o, c: s.c, a0, a1, sideA: sideOf(s, A.rects) });
    }
  }
  return out;
}

function matchesSide(s: SharedSeg, side: Side): boolean {
  if (side === 'N') return s.o === 'h' && s.sideA === 1;
  if (side === 'S') return s.o === 'h' && s.sideA === -1;
  if (side === 'W') return s.o === 'v' && s.sideA === 1;
  return s.o === 'v' && s.sideA === -1;
}

const longest = <T extends Seg>(segs: T[]) =>
  segs.reduce<T | undefined>((m, s) => (!m || s.a1 - s.a0 > m.a1 - m.a0 ? s : m), undefined);

function sector(h: Pt, from: Pt, to: Pt, r: number, steps = 8): Pt[] {
  const a0 = Math.atan2(from.y, from.x),
    a1 = Math.atan2(to.y, to.x);
  let da = a1 - a0;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  const pts: Pt[] = [h];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (da * i) / steps;
    pts.push({ x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r });
  }
  return pts;
}

/** A point on a segment line at `along`, pushed `across` toward +c. */
export const segPt = (s: Seg, along: number, across = 0): Pt =>
  s.o === 'h' ? { x: along, y: s.c + across } : { x: s.c + across, y: along };

function doorGeometry(seg: Seg, kind: DoorKind, dir: 1 | -1, hinge: 'start' | 'end'): Pt[][] {
  const w = seg.a1 - seg.a0;
  const n = seg.o === 'h' ? { x: 0, y: dir } : { x: dir, y: 0 };
  const along = seg.o === 'h' ? { x: 1, y: 0 } : { x: 0, y: 1 };
  const leaf = (hingeAt: number, toward: 1 | -1, len: number) => {
    const h = segPt(seg, hingeAt);
    return sector(h, { x: along.x * toward, y: along.y * toward }, n, len);
  };
  if (kind === 'swing') {
    return [hinge === 'start' ? leaf(seg.a0, 1, w) : leaf(seg.a1, -1, w)];
  }
  if (kind === 'double') return [leaf(seg.a0, 1, w / 2), leaf(seg.a1, -1, w / 2)];
  if (kind === 'bifold') {
    const p0 = segPt(seg, seg.a0),
      p1 = segPt(seg, seg.a1);
    const q = w / 4;
    return [[p0, p1, { x: p1.x + n.x * q, y: p1.y + n.y * q }, { x: p0.x + n.x * q, y: p0.y + n.y * q }]];
  }
  return [];
}

function approachRects(seg: Seg, depth: number, sides: (1 | -1)[]): Rect[] {
  return sides.map((s) => {
    const c0 = s === 1 ? seg.c : seg.c - depth;
    return seg.o === 'h' ? [seg.a0, c0, seg.a1 - seg.a0, depth] : [c0, seg.a0, depth, seg.a1 - seg.a0];
  });
}

function resolveDoor(def: DoorDef, i: number, floor: RFloor, issues: string[]): RDoor | null {
  const [aId, bId] = def.between;
  const label = `door ${i + 1} (${aId} -> ${bId})`;
  const A = floor.roomById.get(aId);
  const outside = bId === 'outside';
  const B = outside ? undefined : floor.roomById.get(bId);
  if (!A || (!outside && !B)) {
    issues.push(`${label}: unknown room id`);
    return null;
  }
  const kind: DoorKind = def.kind ?? 'swing';
  let cands: SharedSeg[] = outside ? exteriorSegments(A, floor.rooms) : sharedSegments(A, B!);
  if (def.side) cands = cands.filter((s) => matchesSide(s, def.side!));
  if (outside && !def.side) issues.push(`${label}: exterior doors need a 'side'`);
  const seg = longest(cands);
  if (!seg) {
    issues.push(`${label}: the rooms don't share a wall${def.side ? ` on side ${def.side}` : ''}`);
    return null;
  }
  const len = seg.a1 - seg.a0;
  const full = kind === 'open' && def.width === undefined;
  const width = full ? len : (def.width ?? (outside ? DOOR_EXT : DOOR_INT));
  let start: number;
  if (full) start = seg.a0;
  else if (def.at === 'start') start = seg.a0 + CORNER;
  else if (def.at === 'end') start = seg.a1 - CORNER - width;
  else if (typeof def.at === 'number') start = seg.a0 + def.at;
  else start = seg.a0 + (len - width) / 2;
  if (start < seg.a0 - EPS || start + width > seg.a1 + EPS) {
    issues.push(`${label}: a ${width.toFixed(2)}' opening doesn't fit on the ${len.toFixed(2)}' shared wall`);
  }
  const opening: Seg = { o: seg.o, c: seg.c, a0: start, a1: start + width };
  const swingRoom = def.swing ?? (outside ? aId : bId);
  if (swingRoom !== aId && swingRoom !== bId) issues.push(`${label}: swing room must be one of the two rooms`);
  const dir: 1 | -1 = swingRoom === aId ? seg.sideA : ((-seg.sideA) as 1 | -1);
  const hinge = def.hinge ?? 'start';
  const sides: (1 | -1)[] = outside ? [seg.sideA] : [1, -1];
  return {
    id: `d${i}`,
    a: aId,
    b: bId,
    kind,
    seg: opening,
    width,
    swingRoom: ['swing', 'double', 'bifold'].includes(kind) ? swingRoom : '',
    dir,
    hinge,
    main: !!def.main,
    full,
    swingPolys: doorGeometry(opening, kind, dir, hinge),
    approach: full ? [] : approachRects(opening, APPROACH, sides),
  };
}

function resolveWalls(floor: RFloor): RWall[] {
  type Tagged = Seg & { room: string; side: 1 | -1 };
  const lines = new Map<string, Tagged[]>();
  for (const r of floor.rooms) {
    if (r.outdoor) continue;
    for (const s of r.boundary) {
      const k = lineKey(s.o, s.c);
      if (!lines.has(k)) lines.set(k, []);
      lines.get(k)!.push({ ...s, room: r.id, side: sideOf(s, r.rects) });
    }
  }
  const openPairs = floor.doors.filter((d) => d.full);
  const isOpen = (x: string, y: string, o: string, c: number, p: number, q: number) =>
    openPairs.some(
      (d) =>
        ((d.a === x && d.b === y) || (d.a === y && d.b === x)) &&
        d.seg.o === o &&
        near(d.seg.c, c) &&
        d.seg.a0 <= p + EPS &&
        d.seg.a1 >= q - EPS,
    );
  const walls: RWall[] = [];
  for (const segs of lines.values()) {
    const { o, c } = segs[0];
    const pts = [...new Set(segs.flatMap((s) => [s.a0, s.a1]).map((v) => Math.round(v * 1e4) / 1e4))].sort(
      (a, b) => a - b,
    );
    const openings = floor.doors
      .filter((d) => !d.full && d.seg.o === o && near(d.seg.c, c))
      .map((d) => [d.seg.a0, d.seg.a1] as [number, number]);
    type Piece = { a0: number; a1: number; kind: 'ext' | 'int'; out?: 1 | -1 };
    const pieces: Piece[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i],
        q = pts[i + 1];
      if (q - p < EPS) continue;
      const covering = segs.filter((s) => s.a0 <= p + EPS && s.a1 >= q - EPS);
      const plus = covering.find((s) => s.side === 1);
      const minus = covering.find((s) => s.side === -1);
      if (!plus && !minus) continue;
      let piece: Piece;
      if (plus && minus) {
        if (plus.room === minus.room || isOpen(plus.room, minus.room, o, c, p, q)) continue;
        piece = { a0: p, a1: q, kind: 'int' };
      } else {
        piece = { a0: p, a1: q, kind: 'ext', out: plus ? -1 : 1 };
      }
      for (const [a0, a1] of subtractIntervals(p, q, openings)) {
        if (a1 - a0 > EPS) pieces.push({ ...piece, a0, a1 });
      }
    }
    // merge touching pieces of the same kind
    pieces.sort((x, y) => x.a0 - y.a0);
    const merged: Piece[] = [];
    for (const pc of pieces) {
      const last = merged[merged.length - 1];
      if (last && near(last.a1, pc.a0) && last.kind === pc.kind && last.out === pc.out) last.a1 = pc.a1;
      else merged.push({ ...pc });
    }
    const atOpening = (v: number) => openings.some(([a0, a1]) => near(v, a0) || near(v, a1));
    for (const pc of merged) {
      walls.push({
        seg: { o, c, a0: pc.a0, a1: pc.a1 },
        kind: pc.kind,
        out: pc.out,
        capStart: !atOpening(pc.a0),
        capEnd: !atOpening(pc.a1),
      });
    }
  }
  return walls;
}

function resolveWindow(def: { room: string; side: Side; width?: number; at?: number }, floor: RFloor, issues: string[]) {
  const R = floor.roomById.get(def.room);
  if (!R) {
    issues.push(`window in ${def.room}: unknown room`);
    return null;
  }
  const seg = longest(exteriorSegments(R, floor.rooms).filter((s) => matchesSide(s, def.side)));
  if (!seg) {
    issues.push(`window in ${def.room} (${def.side}): no exterior wall on that side`);
    return null;
  }
  const w = def.width ?? 3;
  const len = seg.a1 - seg.a0;
  const start = def.at !== undefined ? seg.a0 + def.at : seg.a0 + (len - w) / 2;
  if (start < seg.a0 - EPS || start + w > seg.a1 + EPS) {
    issues.push(`window in ${def.room} (${def.side}): ${w}' window doesn't fit on ${len.toFixed(2)}' of wall`);
  }
  const ws: Seg = { o: seg.o, c: seg.c, a0: start, a1: start + w };
  const clash = floor.doors.find(
    (d) => d.seg.o === ws.o && near(d.seg.c, ws.c) && d.seg.a0 < ws.a1 - EPS && ws.a0 < d.seg.a1 - EPS,
  );
  if (clash) issues.push(`window in ${def.room} (${def.side}) overlaps a door opening`);
  return { room: def.room, seg: ws, out: (-seg.sideA) as 1 | -1 };
}

export function placeFixture(def: FixtureDef, room: RRoom, fdef: FurnitureDef): Omit<RFixture, 'id'> {
  const w = (def.w ?? fdef.w) / 12;
  const d = (def.d ?? fdef.d) / 12;
  const [bx, by, bw, bh] = room.bbox;
  const at = def.at ?? 0;
  let cx: number, cy: number, rot: number;
  switch (def.wall) {
    case 'N':
      rot = 0;
      cx = bx + WALL_HALF + at + w / 2;
      cy = by + WALL_HALF + d / 2;
      break;
    case 'S':
      rot = 180;
      cx = bx + WALL_HALF + at + w / 2;
      cy = by + bh - WALL_HALF - d / 2;
      break;
    case 'W':
      rot = 270;
      cx = bx + WALL_HALF + d / 2;
      cy = by + WALL_HALF + at + w / 2;
      break;
    case 'E':
      rot = 90;
      cx = bx + bw - WALL_HALF - d / 2;
      cy = by + WALL_HALF + at + w / 2;
      break;
    default:
      rot = def.rot ?? 0;
      cx = bx + (def.x ?? bw / 2);
      cy = by + (def.y ?? bh / 2);
  }
  return { def: fdef, room: room.id, cx, cy, w, d, rot };
}

export function resolveFloor(def: FloorDef): RFloor {
  const issues: string[] = [];
  const rooms = def.rooms.map(resolveRoom);
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  if (roomById.size !== rooms.length) issues.push('duplicate room ids');
  for (const r of rooms) if (!r.rects.length) issues.push(`room ${r.id} has no rect`);
  const floor: RFloor = {
    id: def.id,
    name: def.name,
    rooms,
    roomById,
    doors: [],
    windows: [],
    walls: [],
    fixtures: [],
    bbox: bbox(rooms.flatMap((r) => r.rects)),
    area: rooms.filter((r) => r.conditioned).reduce((s, r) => s + r.area, 0),
    issues,
  };
  floor.doors = def.doors.map((d, i) => resolveDoor(d, i, floor, issues)).filter((d): d is RDoor => !!d);
  floor.walls = resolveWalls(floor);
  floor.windows = def.windows.map((w) => resolveWindow(w, floor, issues)).filter((w): w is RWindow => !!w);
  floor.fixtures = (def.fixtures ?? []).flatMap((f, i) => {
    const room = roomById.get(f.room);
    const fdef = getFurniture(f.item);
    if (!room || !fdef) {
      issues.push(`fixture ${i + 1} (${f.item} in ${f.room}): unknown ${room ? 'item' : 'room'}`);
      return [];
    }
    return [{ id: `${def.id}-fx${i}`, ...placeFixture(f, room, fdef) }];
  });
  return floor;
}

export function resolveLayout(def: LayoutDef): RLayout {
  const floors = def.floors.map(resolveFloor);
  const all = floors.flatMap((f) => f.rooms);
  return {
    def,
    floors,
    area: floors.reduce((s, f) => s + f.area, 0),
    garageArea: all.filter((r) => r.type === 'garage').reduce((s, r) => s + r.area, 0),
    outdoorArea: all.filter((r) => r.outdoor).reduce((s, r) => s + r.area, 0),
    issues: floors.flatMap((f) => f.issues.map((m) => `${f.name}: ${m}`)),
  };
}

/** Corner points of a fixture or placed item. */
export const itemCorners = (it: { cx: number; cy: number; w: number; d: number; rot: number }) =>
  boxCorners(it.cx, it.cy, it.w, it.d, it.rot);

/** Is a point inside any of the room's rects? */
export const inRoom = (p: Pt, r: RRoom, eps = 1e-3) => r.rects.some((q) => pointInRect(p, q, eps));
