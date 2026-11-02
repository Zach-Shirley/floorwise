import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getFurniture } from '../data/furniture';
import { ftIn, sqft } from '../engine/format';
import {
  carryRiders,
  clearanceZones,
  itemBox,
  itemPolys,
  ridersOf,
  snapToWallMount,
  snapToWalls,
  type FitWarning,
  type PlacedItem,
  type Stack,
} from '../engine/furniture';
import { bbox as rectsBBox, convexOverlap, type Pt } from '../engine/geometry';
import { WALL_EXT, WALL_HALF, segPt, type RFloor, type RLayout } from '../engine/resolve';
import { circulationTree } from '../engine/rules';
import { wallDrawRect } from '../engine/scene';
import type { Rect } from '../engine/types';
import { SymbolShape } from './symbols';

export interface ViewOpts {
  dims: boolean;
  zones: boolean;
  flow: boolean;
  furniture: boolean;
  grid: boolean;
}

export type Selection =
  | { kind: 'room'; id: string }
  | { kind: 'item'; uid: string }
  | { kind: 'fixture'; id: string }
  | null;

export interface PlanHandle {
  zoomBy: (f: number) => void;
  fit: () => void;
  /** World point at the center of the visible canvas. */
  center: () => Pt;
}

interface Props {
  L: RLayout;
  floor: RFloor;
  items: PlacedItem[];
  fit: Map<string, FitWarning[]>;
  stacks: Map<string, Stack>;
  sel: Selection;
  opts: ViewOpts;
  highlight: string[];
  onSelect: (s: Selection) => void;
  onBeginEdit: () => void;
  /** Live move/rotate of a piece plus anything resting on it (no undo step). */
  onMoveMany: (ups: { uid: string; x: number; y: number; rot: number }[]) => void;
  onDropItem: (item: string, x: number, y: number) => void;
  onScale: (s: number) => void;
}

const NS = { vectorEffect: 'non-scaling-stroke' as const };
const pts = (p: Pt[]) => p.map((q) => `${q.x},${q.y}`).join(' ');

export const PlanView = forwardRef<PlanHandle, Props>(function PlanView(p, ref) {
  const { L, floor, items, fit, stacks, sel, opts, highlight } = p;
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [vp, setVp] = useState({ s: 20, tx: 0, ty: 0 });
  const [hoverRoom, setHoverRoom] = useState<string | null>(null);
  const [cursor, setCursor] = useState<Pt | null>(null);
  const drag = useRef<
    | null
    | {
        mode: 'pan' | 'item' | 'rotate';
        sx: number;
        sy: number;
        moved: boolean;
        target?: string;
        ox?: number;
        oy?: number;
        tx: number;
        ty: number;
        /** Pieces resting on the dragged one, as they were when the drag started. */
        riders?: PlacedItem[];
        from?: { x: number; y: number; rot: number };
      }
  >(null);

  const extent = useMemo(() => rectsBBox(L.floors.flatMap((f) => f.rooms.flatMap((r) => r.rects))), [L]);

  const fitView = useCallback(() => {
    const [x, y, w, h] = extent;
    const padX = 150,
      padY = 150; // screen px kept clear for the dimension strings, HUD and footer
    const s = Math.min((size.w - padX) / w, (size.h - padY) / h);
    setVp({ s, tx: size.w / 2 - (x + w / 2) * s + 6, ty: size.h / 2 - (y + h / 2) * s - 6 });
  }, [extent, size]);

  useLayoutEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Fit when the layout changes, and keep fitting on resize until the user pans or zooms.
  const touched = useRef(false);
  const fittedFor = useRef('');
  useEffect(() => {
    if (size.w < 50) return;
    if (fittedFor.current !== L.def.id) {
      fittedFor.current = L.def.id;
      touched.current = false;
    }
    if (!touched.current) fitView();
  }, [L, size, fitView]);

  useEffect(() => p.onScale(vp.s), [vp.s]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoomAt = useCallback((f: number, sx: number, sy: number) => {
    touched.current = true;
    setVp((v) => {
      const s = Math.min(160, Math.max(4, v.s * f));
      const k = s / v.s;
      return { s, tx: sx - (sx - v.tx) * k, ty: sy - (sy - v.ty) * k };
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (f) => zoomAt(f, size.w / 2, size.h / 2),
      fit: () => {
        touched.current = false;
        fitView();
      },
      center: () => ({ x: (size.w / 2 - vp.tx) / vp.s, y: (size.h / 2 - vp.ty) / vp.s }),
    }),
    [zoomAt, fitView, size, vp],
  );

  useEffect(() => {
    const el = wrap.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const toWorld = (clientX: number, clientY: number): Pt => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: (clientX - r.left - vp.tx) / vp.s, y: (clientY - r.top - vp.ty) / vp.s };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const t = e.target as Element;
    const itemEl = t.closest('[data-item]');
    const rotEl = t.closest('[data-rot]');
    const base = { sx: e.clientX, sy: e.clientY, moved: false, tx: vp.tx, ty: vp.ty };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (e.button === 0 && rotEl) {
      p.onBeginEdit();
      const uid = rotEl.getAttribute('data-rot')!;
      const it = items.find((i) => i.uid === uid)!;
      drag.current = { ...base, mode: 'rotate', target: uid, riders: ridersOf(floor, items, uid), from: { x: it.x, y: it.y, rot: it.rot } };
      return;
    }
    if (e.button === 0 && itemEl && opts.furniture) {
      const w = toWorld(e.clientX, e.clientY);
      const uid = pickItem(w) ?? itemEl.getAttribute('data-item')!;
      const it = items.find((i) => i.uid === uid)!;
      p.onSelect({ kind: 'item', uid });
      p.onBeginEdit();
      drag.current = {
        ...base,
        mode: 'item',
        target: uid,
        ox: w.x - it.x,
        oy: w.y - it.y,
        riders: ridersOf(floor, items, uid),
        from: { x: it.x, y: it.y, rot: it.rot },
      };
      return;
    }
    const fx = t.closest('[data-fixture]')?.getAttribute('data-fixture');
    const room = t.closest('[data-room]')?.getAttribute('data-room');
    drag.current = { ...base, mode: 'pan', target: fx ? `fx:${fx}` : room ? `room:${room}` : undefined };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const w = toWorld(e.clientX, e.clientY);
    setCursor(w);
    const d = drag.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 3) d.moved = true;
    if (d.mode === 'pan') {
      if (d.moved) touched.current = true;
      if (d.moved) setVp((v) => ({ ...v, tx: d.tx + e.clientX - d.sx, ty: d.ty + e.clientY - d.sy }));
    } else if (d.mode === 'item' && d.moved) {
      const it = items.find((i) => i.uid === d.target);
      const def = it && getFurniture(it.item);
      if (!it || !def) return;
      const inch = 1 / 12;
      let x = Math.round((w.x - d.ox!) / inch) * inch;
      let y = Math.round((w.y - d.oy!) / inch) * inch;
      let rot = it.rot;
      if (!e.altKey && def.mount === 'wall') ({ x, y, rot } = snapToWallMount(floor, itemBox({ ...it, x, y }, def)));
      else if (!e.altKey) ({ x, y } = snapToWalls(floor, itemBox({ ...it, x, y }, def)));
      const to = { x, y, rot };
      p.onMoveMany([{ uid: it.uid, ...to }, ...carryRiders(d.riders ?? [], d.from!, to)]);
    } else if (d.mode === 'rotate') {
      const it = items.find((i) => i.uid === d.target);
      if (!it) return;
      let a = (Math.atan2(w.y - it.y, w.x - it.x) * 180) / Math.PI + 90;
      a = e.shiftKey ? Math.round(a) : Math.round(a / 15) * 15;
      const to = { x: it.x, y: it.y, rot: ((a % 360) + 360) % 360 };
      p.onMoveMany([{ uid: it.uid, ...to }, ...carryRiders(d.riders ?? [], d.from!, to)]);
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || d.mode !== 'pan') return;
    if (d.target?.startsWith('fx:')) p.onSelect({ kind: 'fixture', id: d.target.slice(3) });
    else if (d.target?.startsWith('room:')) p.onSelect({ kind: 'room', id: d.target.slice(5) });
    else p.onSelect(null);
  };

  const k = 1 / vp.s; // world units per screen pixel
  const px = (n: number) => n * k;
  const tree = useMemo(() => (opts.flow ? circulationTree(L) : null), [L, opts.flow]);
  const hl = new Set([...highlight, ...(hoverRoom ? [hoverRoom] : [])]);
  const selRoom = sel?.kind === 'room' ? sel.id : null;
  const [ex, ey, ew, eh] = extent;

  // Furniture draw order, and which pieces end up hidden under something else.
  const drawOrder = useMemo(() => {
    const list = items.flatMap((it) => {
      const def = getFurniture(it.item);
      const st = stacks.get(it.uid);
      if (!def || !st) return [];
      const b = itemBox(it, def);
      return [{ it, def, b, st, polys: itemPolys(b, def) }];
    });
    const rank = (x: (typeof list)[number]) => (x.def.flat ? -1 : x.st.band[0] + x.st.band[1] / 1000);
    return list.sort((a, b) => rank(a) - rank(b));
  }, [items, stacks]);
  const isOverhead = (x: (typeof drawOrder)[number]) => x.st.band[0] >= 48 || x.def.mount === 'ceiling';
  const hidden = useMemo(
    () =>
      drawOrder.filter(
        (a, i) =>
          !a.def.flat &&
          drawOrder
            .slice(i + 1)
            .some((b) => !b.def.flat && !isOverhead(b) && a.polys.some((p) => b.polys.some((q) => convexOverlap(p, q, 0.05) > 0))),
      ),
    [drawOrder], // eslint-disable-line react-hooks/exhaustive-deps
  );
  /** With pieces stacked, a click picks the smallest one under the cursor (ceiling pieces last). */
  function pickItem(w: Pt): string | undefined {
    const dot = [w, { x: w.x + 0.01, y: w.y }, { x: w.x, y: w.y + 0.01 }];
    let best: { uid: string; score: number } | undefined;
    for (const x of drawOrder) {
      if (!x.polys.some((p) => convexOverlap(p, dot, 0) > 0)) continue;
      const score = x.b.w * x.b.d * (x.def.mount === 'ceiling' ? 6 : 1) * (x.def.flat ? 50 : 1);
      if (!best || score < best.score) best = { uid: x.it.uid, score };
    }
    return best?.uid;
  }
  const selItem = sel?.kind === 'item' ? drawOrder.find((x) => x.it.uid === sel.uid) : undefined;

  // circulation polylines: room center -> door -> room center
  const flowLines: Pt[][] = [];
  if (tree) {
    const center = (fid: string, rid: string) => L.floors.find((f) => f.id === fid)?.roomById.get(rid)?.labelAt;
    for (const [child, parent] of tree) {
      if (!parent) continue;
      const [cf, cr] = child.split('/'),
        [pf, pr] = parent.split('/');
      if (cf !== floor.id || pf !== floor.id) continue;
      const door = floor.doors.find((d) => (d.a === cr && d.b === pr) || (d.a === pr && d.b === cr));
      const a = center(pf, pr),
        b = center(cf, cr);
      if (!a || !b) continue;
      const mid = door ? segPt(door.seg, (door.seg.a0 + door.seg.a1) / 2) : null;
      flowLines.push(mid ? [a, mid, b] : [a, b]);
    }
  }
  const mainDoor = floor.doors.find((d) => d.main);

  return (
    <div
      ref={wrap}
      className="plan"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/floorwise-item');
        if (!id) return;
        const w = toWorld(e.clientX, e.clientY);
        p.onDropItem(id, w.x, w.y);
      }}
    >
      <svg
        width={size.w}
        height={size.h}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setCursor(null)}
        className={drag.current?.mode === 'pan' && drag.current.moved ? 'panning' : ''}
      >
        <defs>
          <pattern id="grid1" width={1} height={1} patternUnits="userSpaceOnUse">
            <path d="M1 0H0V1" className="grid-minor" fill="none" strokeWidth={px(1)} />
          </pattern>
          <pattern id="grid5" width={5} height={5} patternUnits="userSpaceOnUse">
            <rect width={5} height={5} fill="url(#grid1)" />
            <path d="M5 0H0V5" className="grid-major" fill="none" strokeWidth={px(1)} />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="strokeWidth">
            <path d="M0 0L10 5L0 10z" className="arrow-head" />
          </marker>
          <pattern id="hatch" width={0.5} height={0.5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={0.5} className="hatch" strokeWidth={px(1)} />
          </pattern>
        </defs>
        <g transform={`translate(${vp.tx} ${vp.ty}) scale(${vp.s})`}>
          {opts.grid && vp.s > 6 && <rect x={ex - 60} y={ey - 60} width={ew + 120} height={eh + 120} fill="url(#grid5)" />}

          {/* room fills */}
          {floor.rooms.map((r) => (
            <g
              key={r.id}
              data-room={r.id}
              className={`room t-${r.type} z-${r.zone} ${opts.zones ? 'zoned' : ''} ${r.outdoor ? 'outdoor' : ''} ${hl.has(r.id) ? 'hl' : ''} ${selRoom === r.id ? 'sel' : ''}`}
              onPointerEnter={() => setHoverRoom(r.id)}
              onPointerLeave={() => setHoverRoom((h) => (h === r.id ? null : h))}
            >
              {r.rects.map((q, i) => (
                <rect key={i} x={q[0]} y={q[1]} width={q[2]} height={q[3]} />
              ))}
              {r.type === 'open-below' &&
                r.rects.map((q, i) => (
                  <g key={`v${i}`} className="void-x">
                    <line x1={q[0]} y1={q[1]} x2={q[0] + q[2]} y2={q[1] + q[3]} {...NS} />
                    <line x1={q[0] + q[2]} y1={q[1]} x2={q[0]} y2={q[1] + q[3]} {...NS} />
                  </g>
                ))}
              {r.outdoor &&
                r.boundary.map((s, i) => {
                  const a = segPt(s, s.a0),
                    b = segPt(s, s.a1);
                  return <line key={`b${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="outdoor-edge" {...NS} />;
                })}
            </g>
          ))}

          {/* stairs: treads every 10", arrow toward the top of the run */}
          {floor.rooms
            .filter((r) => r.type === 'stair')
            .map((r) => {
              const [x, y, w, h] = r.bbox;
              const vertical = h >= w;
              const len = vertical ? h : w;
              const n = Math.max(2, Math.floor(len / (10 / 12)));
              const fi = L.floors.indexOf(floor);
              const up = !(fi > 0 && L.floors[fi - 1].rooms.some((q) => q.type === 'stair'));
              return (
                <g key={`st-${r.id}`} className="stair">
                  {Array.from({ length: n - 1 }, (_, i) => {
                    const t = ((i + 1) * len) / n;
                    return vertical ? (
                      <line key={i} x1={x + 0.15} y1={y + t} x2={x + w - 0.15} y2={y + t} {...NS} />
                    ) : (
                      <line key={i} x1={x + t} y1={y + 0.15} x2={x + t} y2={y + h - 0.15} {...NS} />
                    );
                  })}
                  {vertical ? (
                    <polyline points={`${x + w / 2},${y + h - 0.6} ${x + w / 2},${y + 0.6}`} className="stair-run" markerEnd="url(#arrow)" {...NS} />
                  ) : (
                    <polyline points={`${x + 0.6},${y + h / 2} ${x + w - 0.6},${y + h / 2}`} className="stair-run" markerEnd="url(#arrow)" {...NS} />
                  )}
                  <text x={x + w / 2} y={y + h / 2} fontSize={px(10)} className="stair-tag" transform={vertical ? `rotate(-90 ${x + w / 2} ${y + h / 2})` : undefined} dy={px(-6)}>
                    {up ? 'UP' : 'DN'}
                  </text>
                </g>
              );
            })}

          {/* open edges between rooms */}
          {floor.doors
            .filter((d) => d.full)
            .map((d) => {
              const a = segPt(d.seg, d.seg.a0),
                b = segPt(d.seg, d.seg.a1);
              return <line key={d.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="open-edge" {...NS} />;
            })}

          {/* fixtures */}
          {floor.fixtures.map((f) => (
            <g
              key={f.id}
              data-fixture={f.id}
              className={`fixture ${sel?.kind === 'fixture' && sel.id === f.id ? 'sel' : ''}`}
              transform={`translate(${f.cx} ${f.cy}) rotate(${f.rot})`}
            >
              <SymbolShape symbol={f.def.symbol} w={f.w} d={f.d} round={f.def.round} flip={f.def.flip} />
            </g>
          ))}

          {/* walls */}
          <g className="walls">
            {floor.walls.map((w, i) => {
              const r = wallDrawRect(w, floor);
              return <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} className={`wall ${w.kind}`} />;
            })}
          </g>

          {/* windows */}
          {floor.windows.map((w, i) => {
            const t0 = w.out === 1 ? -WALL_HALF : -(WALL_EXT - WALL_HALF);
            const t1 = t0 + WALL_EXT;
            const r: Rect =
              w.seg.o === 'h'
                ? [w.seg.a0, w.seg.c + t0, w.seg.a1 - w.seg.a0, WALL_EXT]
                : [w.seg.c + t0, w.seg.a0, WALL_EXT, w.seg.a1 - w.seg.a0];
            const mid = (t0 + t1) / 2;
            const l1a = segPt(w.seg, w.seg.a0, mid - 0.06),
              l1b = segPt(w.seg, w.seg.a1, mid - 0.06);
            const l2a = segPt(w.seg, w.seg.a0, mid + 0.06),
              l2b = segPt(w.seg, w.seg.a1, mid + 0.06);
            return (
              <g key={i} className="window">
                <rect x={r[0]} y={r[1]} width={r[2]} height={r[3]} />
                <line x1={l1a.x} y1={l1a.y} x2={l1b.x} y2={l1b.y} {...NS} />
                <line x1={l2a.x} y1={l2a.y} x2={l2b.x} y2={l2b.y} {...NS} />
              </g>
            );
          })}

          {/* doors */}
          {floor.doors
            .filter((d) => !d.full)
            .map((d) => {
              const { seg } = d;
              const a = segPt(seg, seg.a0),
                b = segPt(seg, seg.a1);
              const n = d.dir;
              const jamb = (q: Pt) => {
                const u = segPt({ ...seg, c: seg.c }, seg.o === 'h' ? q.x : q.y, -WALL_HALF);
                const v = segPt({ ...seg, c: seg.c }, seg.o === 'h' ? q.x : q.y, WALL_HALF);
                return <line x1={u.x} y1={u.y} x2={v.x} y2={v.y} className="jamb" {...NS} />;
              };
              let body: React.ReactNode = null;
              if (d.kind === 'swing' || d.kind === 'double') {
                body = d.swingPolys.map((poly, i) => {
                  const h = poly[0],
                    end = poly[poly.length - 1];
                  return (
                    <g key={i}>
                      <polyline points={pts(poly.slice(1))} className="door-arc" {...NS} />
                      <line x1={h.x} y1={h.y} x2={end.x} y2={end.y} className="door-leaf" {...NS} />
                    </g>
                  );
                });
              } else if (d.kind === 'bifold') {
                const q = d.width / 4;
                const z = [0, 0.25, 0.5, 0.75, 1].map((t, i) => segPt(seg, seg.a0 + (seg.a1 - seg.a0) * t, i % 2 ? n * q * 0.8 : 0));
                body = <polyline points={pts(z)} className="door-leaf" {...NS} />;
              } else if (d.kind === 'slide') {
                const w = seg.a1 - seg.a0;
                const p1 = segPt(seg, seg.a0, -0.07),
                  p2 = segPt(seg, seg.a0 + w * 0.55, -0.07);
                const p3 = segPt(seg, seg.a1 - w * 0.55, 0.07),
                  p4 = segPt(seg, seg.a1, 0.07);
                body = (
                  <>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="door-leaf" {...NS} />
                    <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} className="door-leaf" {...NS} />
                  </>
                );
              } else if (d.kind === 'pocket') {
                const w = seg.a1 - seg.a0;
                const p1 = segPt(seg, seg.a0 - w * 0.9),
                  p2 = segPt(seg, seg.a0 + w * 0.15);
                body = <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="door-leaf pocket" {...NS} />;
              } else if (d.kind === 'garage') {
                body = <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="door-garage" {...NS} />;
              }
              return (
                <g key={d.id} className={`door k-${d.kind}`}>
                  {jamb(a)}
                  {jamb(b)}
                  {body}
                </g>
              );
            })}

          {mainDoor && (
            <g className="entry-mark">
              {(() => {
                const s = mainDoor.seg;
                const out = -mainDoor.dir;
                const c = segPt(s, (s.a0 + s.a1) / 2, out * (WALL_EXT + px(14)));
                return (
                  <>
                    <circle cx={c.x} cy={c.y} r={px(9)} />
                    <text x={c.x} y={c.y + px(3.5)} fontSize={px(10)}>
                      IN
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* circulation */}
          {opts.flow && (
            <g className="flow">
              {flowLines.map((l, i) => (
                <polyline key={i} points={pts(l)} {...NS} />
              ))}
            </g>
          )}

          {/* labels */}
          <g className="labels" strokeWidth={px(3)}>
            {floor.rooms.map((r) => {
              const [w, h] = r.dims;
              const charW = 0.58;
              const rotate = h > w * 1.3 && r.name.length * 11 * charW > w * vp.s - 8;
              const along = (rotate ? h : w) * vp.s,
                across = (rotate ? w : h) * vp.s;
              if (across < 16) return null;
              let fs = Math.min(13, Math.max(10, across / 7));
              const fitName = (along - 8) / (r.name.length * charW);
              if (fitName < fs) fs = fitName;
              if (fs < 8) return null;
              const dimText = r.shaped ? sqft(r.area) : `${ftIn(w)} × ${ftIn(h)} · ${Math.round(r.area)} ft²`;
              const showDims =
                opts.dims &&
                across > 44 &&
                dimText.length * fs * 0.82 * 0.55 < along - 8 &&
                !(opts.furniture && items.length > 0 && across < 70);
              return (
                <g key={r.id} transform={`translate(${r.labelAt.x} ${r.labelAt.y})${rotate ? ' rotate(-90)' : ''}`}>
                  <text y={showDims ? px(-fs * 0.45) : px(fs * 0.35)} fontSize={px(fs)} className="lbl-name">
                    {r.name}
                  </text>
                  {showDims && (
                    <text y={px(fs * 0.95)} fontSize={px(fs * 0.82)} className="lbl-dim">
                      {dimText}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* furniture, drawn bottom-up: rugs, floor pieces, things on top, then wall and ceiling pieces */}
          {opts.furniture && (
            <g className="furniture">
              {drawOrder.map(({ it, def, b, st }) => {
                const warns = fit.get(it.uid);
                const level = warns?.some((w) => w.level === 'block') ? 'block' : warns ? 'tight' : 'ok';
                const isSel = sel?.kind === 'item' && sel.uid === it.uid;
                const mount = def.mount ?? 'floor';
                const overhead = st.band[0] >= 48 || mount === 'ceiling';
                return (
                  <g
                    key={it.uid}
                    className={`item lvl-${level} ${isSel ? 'sel' : ''} ${def.flat ? 'flat' : ''} ${overhead ? 'overhead' : ''} m-${mount}`}
                  >
                    {isSel &&
                      clearanceZones(b, def).map((z, i) => <polygon key={i} points={pts(z.poly)} className="clear-zone" {...NS} />)}
                    <g data-item={it.uid} transform={`translate(${it.x} ${it.y}) rotate(${it.rot})`}>
                      <SymbolShape symbol={def.symbol} w={b.w} d={b.d} round={def.round} flip={def.flip} />
                      {level === 'block' && <rect x={-b.w / 2} y={-b.d / 2} width={b.w} height={b.d} fill="url(#hatch)" className="block-hatch" />}
                    </g>
                  </g>
                );
              })}
              {/* pieces hidden under something taller: a dashed outline you can still click */}
              {hidden.map(({ it, polys }) => (
                <g key={`h-${it.uid}`} className={`hidden-item ${sel?.kind === 'item' && sel.uid === it.uid ? 'sel' : ''}`}>
                  {polys.map((poly, i) => (
                    <polygon key={i} points={pts(poly)} {...NS} />
                  ))}
                </g>
              ))}
              {selItem && (
                <g transform={`translate(${selItem.it.x} ${selItem.it.y}) rotate(${selItem.it.rot})`}>
                  <rect
                    x={-selItem.b.w / 2 - px(3)}
                    y={-selItem.b.d / 2 - px(3)}
                    width={selItem.b.w + px(6)}
                    height={selItem.b.d + px(6)}
                    className="sel-box"
                    {...NS}
                  />
                  <line x1={0} y1={-selItem.b.d / 2 - px(3)} x2={0} y2={-selItem.b.d / 2 - px(22)} className="sel-box" {...NS} />
                  <circle data-rot={selItem.it.uid} cx={0} cy={-selItem.b.d / 2 - px(28)} r={px(7)} className="rot-handle" {...NS} />
                  <path
                    d={`M${-px(5)} ${selItem.b.d / 2 + px(9)} L0 ${selItem.b.d / 2 + px(14)} L${px(5)} ${selItem.b.d / 2 + px(9)}`}
                    className="front-mark"
                    fill="none"
                    {...NS}
                  />
                </g>
              )}
            </g>
          )}

          {/* overall dimensions */}
          {opts.dims && (
            <g className="overall" strokeWidth={px(1)}>
              {(() => {
                const [x, y, w, h] = floor.bbox;
                const off = WALL_EXT + px(26);
                const tick = px(5);
                return (
                  <>
                    <line x1={x} y1={y - off} x2={x + w} y2={y - off} {...NS} />
                    <line x1={x} y1={y - off - tick} x2={x} y2={y - off + tick} {...NS} />
                    <line x1={x + w} y1={y - off - tick} x2={x + w} y2={y - off + tick} {...NS} />
                    <text x={x + w / 2} y={y - off - px(6)} fontSize={px(11)}>
                      {ftIn(w)}
                    </text>
                    <line x1={x - off} y1={y} x2={x - off} y2={y + h} {...NS} />
                    <line x1={x - off - tick} y1={y} x2={x - off + tick} y2={y} {...NS} />
                    <line x1={x - off - tick} y1={y + h} x2={x - off + tick} y2={y + h} {...NS} />
                    <text x={x - off - px(6)} y={y + h / 2} fontSize={px(11)} transform={`rotate(-90 ${x - off - px(6)} ${y + h / 2})`}>
                      {ftIn(h)}
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </g>
      </svg>

      <div className="plan-hud">
        <div className="compass" title="North is up">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M12 3l4 9h-8z" className="needle" />
            <path d="M12 21l-4-9h8z" className="needle-s" />
          </svg>
          <span>N</span>
        </div>
        <ScaleBar s={vp.s} />
        {cursor && (
          <div className="coords">
            {ftIn(Math.max(0, cursor.x - floor.bbox[0]))}, {ftIn(Math.max(0, cursor.y - floor.bbox[1]))}
          </div>
        )}
      </div>
    </div>
  );
});

function ScaleBar({ s }: { s: number }) {
  const choices = [1, 2, 5, 10, 20, 50];
  const ft = choices.find((c) => c * s >= 70) ?? 50;
  return (
    <div className="scalebar">
      <div className="bar" style={{ width: ft * s }} />
      <span>{ft} ft</span>
    </div>
  );
}
