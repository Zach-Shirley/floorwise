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

export interface Box3 {
  /** Plan rectangle [x, y, w, d] in feet. */
  rect: Rect;
  /** Bottom and top height in feet. */
  y0: number;
  y1: number;
  kind: 'wall' | 'glass' | 'header';
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

/** Can a walker of radius `r` stand at (x, y)? Inside some room and clear of every wall piece. */
export function canStand(floor: RFloor, walls: Rect[], x: number, y: number, r: number): boolean {
  if (!floor.rooms.some((rm) => rm.type !== 'open-below' && inRoom({ x, y }, rm, 0))) return false;
  for (const w of walls) {
    const dx = Math.max(w[0] - x, 0, x - (w[0] + w[2]));
    const dy = Math.max(w[1] - y, 0, y - (w[1] + w[3]));
    if (dx * dx + dy * dy < r * r) return false;
  }
  return true;
}
