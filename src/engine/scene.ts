/**
 * 3D geometry for a floor: solid wall pieces with door headers and window
 * openings cut out, plus glass panes. Pure data (feet), no three.js, so it can
 * be tested. The 3D view turns each box into a mesh.
 *
 * Plan x stays x, plan y becomes depth (z in 3D), and heights are y.
 */
import { near, subtractIntervals, type Seg } from './geometry';
import { CEILING, wallRect } from './furniture';
import { WALL_EXT, WALL_HALF, inRoom, segPt, type RDoor, type RFloor, type RWall } from './resolve';
import type { Rect } from './types';

/** Feet. */
export const CEILING_FT = CEILING / 12;
export const DOOR_HEAD_FT = 80 / 12;
export const WINDOW_SILL_FT = 36 / 12;
export const WINDOW_HEAD_FT = 84 / 12;
/** Floor-to-floor height: ceiling plus about a foot of floor structure. */
export const STORY_FT = CEILING_FT + 1;

export interface Box3 {
  /** Plan rectangle [x, y, w, d] in feet. */
  rect: Rect;
  /** Bottom and top height in feet. */
  y0: number;
  y1: number;
  kind: 'wall' | 'glass' | 'header' | 'trim';
}

/** Wall rectangle with its ends extended so corners close cleanly (shared by the 2D and 3D views). */
export function wallDrawRect(w: RWall, floor: RFloor): Rect {
  const r = wallRect(w);
  const { seg } = w;
  const ext = (end: 'start' | 'end') => {
    if (end === 'start' ? !w.capStart : !w.capEnd) return 0;
    if (w.kind === 'int') return WALL_HALF;
    const t = end === 'start' ? -1 : 1;
    const at = end === 'start' ? seg.a0 : seg.a1;
    const inward = -(w.out ?? 1);
    const probe = segPt(seg, at + t * 0.05, inward * 0.05);
    const concave = floor.rooms.some((rm) => !rm.outdoor && inRoom(probe, rm, 0));
    return concave ? WALL_HALF : WALL_EXT - WALL_HALF;
  };
  const e0 = ext('start'),
    e1 = ext('end');
  return seg.o === 'h' ? [r[0] - e0, r[1], r[2] + e0 + e1, r[3]] : [r[0], r[1] - e0, r[2], r[3] + e0 + e1];
}

/** Slice a wall rect along its length: [a0, a1] along the wall axis. */
function slice(r: Rect, o: Seg['o'], a0: number, a1: number): Rect {
  return o === 'h' ? [a0, r[1], a1 - a0, r[3]] : [r[0], a0, r[2], a1 - a0];
}

/** The wall thickness band across a door opening (exterior doors use the exterior wall band). */
function doorBand(d: RDoor, floor: RFloor): [number, number] {
  const { seg } = d;
  if (d.b !== 'outside' && d.a !== 'outside') return [seg.c - WALL_HALF, seg.c + WALL_HALF];
  const inside = d.a === 'outside' ? d.b : d.a;
  const room = floor.roomById.get(inside);
  const probe = segPt(seg, (seg.a0 + seg.a1) / 2, 0.05);
  const insidePositive = room ? inRoom(probe, room, 0) : true;
  return insidePositive ? [seg.c - (WALL_EXT - WALL_HALF), seg.c + WALL_HALF] : [seg.c - WALL_HALF, seg.c + (WALL_EXT - WALL_HALF)];
}

export function wallBoxes(floor: RFloor): Box3[] {
  const out: Box3[] = [];
  for (const w of floor.walls) {
    const r = wallDrawRect(w, floor);
    const o = w.seg.o;
    const [lo, hi] = o === 'h' ? [r[0], r[0] + r[2]] : [r[1], r[1] + r[3]];
    const wins = floor.windows
      .filter((win) => win.seg.o === o && near(win.seg.c, w.seg.c, 0.05) && win.seg.a1 > lo + 1e-6 && win.seg.a0 < hi - 1e-6)
      .map((win) => [Math.max(lo, win.seg.a0), Math.min(hi, win.seg.a1)] as [number, number]);
    for (const [a0, a1] of subtractIntervals(lo, hi, wins)) out.push({ rect: slice(r, o, a0, a1), y0: 0, y1: CEILING_FT, kind: 'wall' });
    for (const [a0, a1] of wins) {
      const s = slice(r, o, a0, a1);
      out.push({ rect: s, y0: 0, y1: WINDOW_SILL_FT, kind: 'wall' });
      out.push({ rect: s, y0: WINDOW_HEAD_FT, y1: CEILING_FT, kind: 'wall' });
      // a thin pane in the middle of the wall
      const thin: Rect = o === 'h' ? [s[0], w.seg.c - 0.02, s[2], 0.04] : [w.seg.c - 0.02, s[1], 0.04, s[3]];
      out.push({ rect: thin, y0: WINDOW_SILL_FT, y1: WINDOW_HEAD_FT, kind: 'glass' });
      // frame: jambs at both ends, a head and a sill ledge that sticks out a little on the inside
      const f = 1.5 / 12;
      const jamb = (a: number): Rect => slice(r, o, a, a + f);
      out.push({ rect: jamb(a0), y0: WINDOW_SILL_FT, y1: WINDOW_HEAD_FT, kind: 'trim' }, { rect: jamb(a1 - f), y0: WINDOW_SILL_FT, y1: WINDOW_HEAD_FT, kind: 'trim' });
      out.push({ rect: s, y0: WINDOW_HEAD_FT - f, y1: WINDOW_HEAD_FT, kind: 'trim' });
      const win = floor.windows.find((wn) => wn.seg.o === o && near(wn.seg.c, w.seg.c, 0.05) && wn.seg.a0 < a1 && wn.seg.a1 > a0);
      const inward = -(win?.out ?? 1);
      const lip = 1.25 / 12;
      const sill: Rect =
        o === 'h'
          ? [s[0] - f, inward > 0 ? s[1] : s[1] - lip, s[2] + 2 * f, s[3] + lip]
          : [inward > 0 ? s[0] : s[0] - lip, s[1] - f, s[2] + lip, s[3] + 2 * f];
      out.push({ rect: sill, y0: WINDOW_SILL_FT - 0.75 / 12, y1: WINDOW_SILL_FT + 0.05, kind: 'trim' });
    }
  }
  // headers over door openings (not over fully open walls)
  for (const d of floor.doors) {
    if (d.full) continue;
    const [b0, b1] = doorBand(d, floor);
    const rect: Rect = d.seg.o === 'h' ? [d.seg.a0, b0, d.seg.a1 - d.seg.a0, b1 - b0] : [b0, d.seg.a0, b1 - b0, d.seg.a1 - d.seg.a0];
    const head = d.kind === 'garage' ? 84 / 12 : DOOR_HEAD_FT;
    out.push({ rect, y0: head, y1: CEILING_FT, kind: 'header' });
  }
  return out;
}

/** Baseboards: 4" strips along every wall face that faces a room. */
export function baseboards(floor: RFloor, boxes: Box3[]): Rect[] {
  const out: Rect[] = [];
  const t = 0.6 / 12;
  const roomy = (x: number, y: number) => floor.rooms.some((rm) => !rm.outdoor && rm.type !== 'open-below' && inRoom({ x, y }, rm, 0));
  for (const b of boxes) {
    if (b.kind !== 'wall' || b.y0 !== 0) continue;
    const [x, y, w, d] = b.rect;
    if (w >= d) {
      if (roomy(x + w / 2, y - 0.1)) out.push([x, y - t, w, t]);
      if (roomy(x + w / 2, y + d + 0.1)) out.push([x, y + d, w, t]);
    } else {
      if (roomy(x - 0.1, y + d / 2)) out.push([x - t, y, t, d]);
      if (roomy(x + w + 0.1, y + d / 2)) out.push([x + w, y, t, d]);
    }
  }
  return out;
}

export interface Panel {
  rect: Rect;
  y0: number;
  y1: number;
  /** The room this wall face looks into. */
  room: string;
}

/**
 * Thin "paint" skins on every wall face that looks into a room, tagged with
 * that room, so each room can have its own paint color.
 */
export function paintPanels(floor: RFloor, boxes: Box3[]): Panel[] {
  const out: Panel[] = [];
  const t = 0.02;
  const rooms = floor.rooms.filter((rm) => !rm.outdoor && rm.type !== 'open-below');
  const roomAtPt = (x: number, y: number) => rooms.find((rm) => inRoom({ x, y }, rm, 0))?.id;
  // every room edge along each axis: a wall face changes rooms only at these
  const xs = rooms.flatMap((r) => r.rects.flatMap((q) => [q[0], q[0] + q[2]]));
  const ys = rooms.flatMap((r) => r.rects.flatMap((q) => [q[1], q[1] + q[3]]));
  for (const b of boxes) {
    if (b.kind !== 'wall' && b.kind !== 'header') continue;
    const [x, y, w, d] = b.rect;
    const horiz = w >= d;
    const [a0, a1] = horiz ? [x, x + w] : [y, y + d];
    const cuts = [a0, ...(horiz ? xs : ys).filter((c) => c > a0 + 1e-6 && c < a1 - 1e-6), a1].sort((p, q) => p - q);
    for (const side of [-1, 1]) {
      // the face plane and a probe line just in front of it
      const face = horiz ? (side < 0 ? y - t : y + d) : side < 0 ? x - t : x + w;
      const probe = horiz ? (side < 0 ? y - 0.1 : y + d + 0.1) : side < 0 ? x - 0.1 : x + w + 0.1;
      let run: { room: string; s: number; e: number } | null = null;
      const flush = () => {
        if (!run) return;
        const rect: Rect = horiz ? [run.s, face, run.e - run.s, t] : [face, run.s, t, run.e - run.s];
        out.push({ rect, y0: b.y0, y1: b.y1, room: run.room });
        run = null;
      };
      for (let i = 0; i < cuts.length - 1; i++) {
        const m = (cuts[i] + cuts[i + 1]) / 2;
        const room = horiz ? roomAtPt(m, probe) : roomAtPt(probe, m);
        if (run && room === run.room) run.e = cuts[i + 1];
        else {
          flush();
          if (room) run = { room, s: cuts[i], e: cuts[i + 1] };
        }
      }
      flush();
    }
  }
  return out;
}

/** The footprint a door fills when closed (its opening across the wall). */
export function doorOpening(d: RDoor, floor: RFloor): Rect {
  const [b0, b1] = doorBand(d, floor);
  return d.seg.o === 'h' ? [d.seg.a0, b0, d.seg.a1 - d.seg.a0, b1 - b0] : [b0, d.seg.a0, b1 - b0, d.seg.a1 - d.seg.a0];
}

export interface Leaf {
  /** Hinge point (plan feet). */
  hx: number;
  hy: number;
  /** Leaf length, feet. */
  len: number;
  /** Yaw (radians, three.js convention: rotation about +y) when closed and when open. */
  closed: number;
  open: number;
}

/** Swing leaves of a door (one, or two for a double door), with closed and open angles. */
export function doorLeaves(d: RDoor): Leaf[] {
  if (d.kind !== 'swing' && d.kind !== 'double' && d.kind !== 'bifold') return [];
  const hinges: { at: 'start' | 'end'; len: number }[] =
    d.kind === 'swing' ? [{ at: d.hinge, len: d.width }] : [{ at: 'start', len: d.width / 2 }, { at: 'end', len: d.width / 2 }];
  return hinges.map(({ at, len }) => {
    const a = at === 'start' ? d.seg.a0 : d.seg.a1;
    const [hx, hy] = d.seg.o === 'h' ? [a, d.seg.c] : [d.seg.c, a];
    const along = at === 'start' ? 1 : -1;
    // closed: leaf lies along the wall from the hinge; open: points across the wall toward the swing room
    const [cx, cz] = d.seg.o === 'h' ? [along, 0] : [0, along];
    const [ox, oz] = d.seg.o === 'h' ? [0, d.dir] : [d.dir, 0];
    return { hx, hy, len, closed: Math.atan2(-cz, cx), open: Math.atan2(-oz, ox) };
  });
}

export interface StairRun {
  room: string;
  rect: Rect;
  /** Direction the stair climbs, as a unit step in plan coordinates. */
  ux: number;
  uy: number;
  steps: number;
}

/** Stairs climb toward the top of the plan (north) when the run is vertical, or east when horizontal (matching the plan arrow). */
export function stairRun(room: { id: string; bbox: Rect }): StairRun {
  const [, , w, h] = room.bbox;
  const vertical = h >= w;
  const len = vertical ? h : w;
  return { room: room.id, rect: room.bbox, ux: vertical ? 0 : 1, uy: vertical ? -1 : 0, steps: Math.max(8, Math.round((STORY_FT * 12) / 7.5)) * (len > 0 ? 1 : 0) };
}

/** Can a walker of radius `r` stand at (x, y)? Inside some room and clear of every wall piece. */
export function canStand(floor: RFloor, walls: Rect[], x: number, y: number, r: number, holes: string[] = []): boolean {
  if (!floor.rooms.some((rm) => rm.type !== 'open-below' && !holes.includes(rm.id) && inRoom({ x, y }, rm, 0))) return false;
  for (const w of walls) {
    const dx = Math.max(w[0] - x, 0, x - (w[0] + w[2]));
    const dy = Math.max(w[1] - y, 0, y - (w[1] + w[3]));
    if (dx * dx + dy * dy < r * r) return false;
  }
  return true;
}
