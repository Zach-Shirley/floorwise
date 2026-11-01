import type { Rect } from './types';

export const EPS = 1e-6;

export interface Pt {
  x: number;
  y: number;
}

/** An axis-aligned segment. 'h' = horizontal (constant y), 'v' = vertical (constant x). */
export interface Seg {
  o: 'h' | 'v';
  /** The constant coordinate (y for 'h', x for 'v'). */
  c: number;
  /** Start and end along the other axis, a0 < a1. */
  a0: number;
  a1: number;
}

export const rectArea = (r: Rect) => r[2] * r[3];

/** Positive-area overlap between two rects (touching edges do not count). */
export function rectsOverlap(a: Rect, b: Rect, eps = EPS): boolean {
  return (
    a[0] < b[0] + b[2] - eps &&
    b[0] < a[0] + a[2] - eps &&
    a[1] < b[1] + b[3] - eps &&
    b[1] < a[1] + a[3] - eps
  );
}

export function pointInRect(p: Pt, r: Rect, eps = EPS): boolean {
  return p.x >= r[0] - eps && p.x <= r[0] + r[2] + eps && p.y >= r[1] - eps && p.y <= r[1] + r[3] + eps;
}

export function bbox(rects: Rect[]): Rect {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r[0]);
    y0 = Math.min(y0, r[1]);
    x1 = Math.max(x1, r[0] + r[2]);
    y1 = Math.max(y1, r[1] + r[3]);
  }
  return [x0, y0, x1 - x0, y1 - y0];
}

export function rectEdges(r: Rect): Seg[] {
  const [x, y, w, h] = r;
  return [
    { o: 'h', c: y, a0: x, a1: x + w },
    { o: 'h', c: y + h, a0: x, a1: x + w },
    { o: 'v', c: x, a0: y, a1: y + h },
    { o: 'v', c: x + w, a0: y, a1: y + h },
  ];
}

/** Subtract a set of intervals from [a0, a1]. */
export function subtractIntervals(a0: number, a1: number, cuts: [number, number][]): [number, number][] {
  let parts: [number, number][] = [[a0, a1]];
  for (const [c0, c1] of cuts) {
    const next: [number, number][] = [];
    for (const [p0, p1] of parts) {
      if (c1 <= p0 + EPS || c0 >= p1 - EPS) {
        next.push([p0, p1]);
        continue;
      }
      if (c0 > p0 + EPS) next.push([p0, c0]);
      if (c1 < p1 - EPS) next.push([c1, p1]);
    }
    parts = next;
  }
  return parts;
}

export const near = (a: number, b: number, eps = 1e-4) => Math.abs(a - b) < eps;

/**
 * The outline segments of a union of non-overlapping rects: every rect edge,
 * minus the parts shared with another rect of the same set.
 */
export function unionBoundary(rects: Rect[]): Seg[] {
  const out: Seg[] = [];
  rects.forEach((r, i) => {
    for (const e of rectEdges(r)) {
      const cuts: [number, number][] = [];
      rects.forEach((q, j) => {
        if (i === j) return;
        for (const f of rectEdges(q)) {
          if (f.o === e.o && near(f.c, e.c)) cuts.push([Math.max(e.a0, f.a0), Math.min(e.a1, f.a1)]);
        }
      });
      for (const [a0, a1] of subtractIntervals(e.a0, e.a1, cuts.filter(([a, b]) => b - a > EPS))) {
        if (a1 - a0 > EPS) out.push({ o: e.o, c: e.c, a0, a1 });
      }
    }
  });
  return mergeCollinear(out, rects);
}

/** Join boundary pieces that continue each other on the same line and face the same way. */
function mergeCollinear(segs: Seg[], rects: Rect[]): Seg[] {
  const tagged = segs
    .map((s) => ({ ...s, side: sideOf(s, rects) }))
    .sort((a, b) => (a.o === b.o ? (near(a.c, b.c) ? a.a0 - b.a0 : a.c - b.c) : a.o < b.o ? -1 : 1));
  const out: (Seg & { side: number })[] = [];
  for (const s of tagged) {
    const last = out[out.length - 1];
    if (last && last.o === s.o && near(last.c, s.c) && last.side === s.side && near(last.a1, s.a0)) last.a1 = s.a1;
    else out.push({ ...s });
  }
  return out.map(({ o, c, a0, a1 }) => ({ o, c, a0, a1 }));
}

/** Which side of a boundary segment a rect set lies on: +1 = greater coordinate, -1 = smaller. */
export function sideOf(seg: Seg, rects: Rect[]): 1 | -1 {
  const mid = (seg.a0 + seg.a1) / 2;
  const d = 0.01;
  const probe: Pt = seg.o === 'h' ? { x: mid, y: seg.c + d } : { x: seg.c + d, y: mid };
  return rects.some((r) => pointInRect(probe, r, 0)) ? 1 : -1;
}

/** Closest distance between two rects (0 if touching or overlapping). */
export function rectDistance(a: Rect, b: Rect): number {
  const dx = Math.max(0, b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2]));
  const dy = Math.max(0, b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3]));
  return Math.hypot(dx, dy);
}

// ---------------------------------------------------------------------------
// Oriented boxes and convex polygons (furniture collision)

export function rotatePt(p: Pt, deg: number): Pt {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t),
    s = Math.sin(t);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** Corners of a w x d box centered at (cx, cy), rotated clockwise by `rot` degrees. */
export function boxCorners(cx: number, cy: number, w: number, d: number, rot: number): Pt[] {
  return [
    { x: -w / 2, y: -d / 2 },
    { x: w / 2, y: -d / 2 },
    { x: w / 2, y: d / 2 },
    { x: -w / 2, y: d / 2 },
  ].map((p) => {
    const q = rotatePt(p, rot);
    return { x: q.x + cx, y: q.y + cy };
  });
}

export function rectPoly(r: Rect): Pt[] {
  return [
    { x: r[0], y: r[1] },
    { x: r[0] + r[2], y: r[1] },
    { x: r[0] + r[2], y: r[1] + r[3] },
    { x: r[0], y: r[1] + r[3] },
  ];
}

function project(poly: Pt[], ax: Pt): [number, number] {
  let lo = Infinity,
    hi = -Infinity;
  for (const p of poly) {
    const v = p.x * ax.x + p.y * ax.y;
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return [lo, hi];
}

/**
 * Separating-axis test for two convex polygons. Returns the penetration depth
 * along the best axis (0 when separated or merely touching within `tol`).
 */
export function convexOverlap(a: Pt[], b: Pt[], tol = 0): number {
  let min = Infinity;
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i],
        q = poly[(i + 1) % poly.length];
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      if (len < EPS) continue;
      const ax = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
      const [a0, a1] = project(a, ax);
      const [b0, b1] = project(b, ax);
      const o = Math.min(a1, b1) - Math.max(a0, b0);
      if (o <= tol) return 0;
      min = Math.min(min, o);
    }
  }
  return min;
}

export function polyBBox(poly: Pt[]): Rect {
  const xs = poly.map((p) => p.x),
    ys = poly.map((p) => p.y);
  const x0 = Math.min(...xs),
    y0 = Math.min(...ys);
  return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0];
}

/** Grow a rect outward by `m` on every side. */
export const inflate = (r: Rect, m: number): Rect => [r[0] - m, r[1] - m, r[2] + 2 * m, r[3] + 2 * m];
