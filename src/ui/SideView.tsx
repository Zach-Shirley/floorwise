/**
 * A small front elevation of the selected piece: you stand in front of it and
 * look at it. Everything stacked on, under or above it is drawn at its real
 * height, next to a figure of your height for scale.
 */
import { getFurniture } from '../data/furniture';
import { ftIn } from '../engine/format';
import { CEILING, itemBox, itemPolys, type PlacedItem, type Stack } from '../engine/furniture';
import type { Pt } from '../engine/geometry';
import { itemCorners, type RFloor } from '../engine/resolve';
import type { FurnitureDef } from '../engine/types';

interface Props {
  it: PlacedItem;
  floor: RFloor;
  items: PlacedItem[];
  stacks: Map<string, Stack>;
  /** Viewer height in inches. */
  person: number;
}

interface Bar {
  key: string;
  name: string;
  x0: number;
  x1: number;
  band: [number, number];
  /** Bottom of the piece itself (before open space underneath). */
  base: number;
  sel: boolean;
  mount: FurnitureDef['mount'];
}

/** Inches, in the selected piece's frame: x to its right, y toward its front. */
function toLocal(p: Pt, o: PlacedItem): Pt {
  const t = (-o.rot * Math.PI) / 180;
  const dx = (p.x - o.x) * 12,
    dy = (p.y - o.y) * 12;
  return { x: dx * Math.cos(t) - dy * Math.sin(t), y: dx * Math.sin(t) + dy * Math.cos(t) };
}

export function SideView({ it, floor, items, stacks, person }: Props) {
  const def = getFurniture(it.item)!;
  // the slab of space in front of / around the piece that counts as "the same stack"
  const sx0 = -def.w / 2 - 18,
    sx1 = def.w / 2 + 18;
  const sy0 = -def.d / 2 - 2,
    sy1 = Math.max(def.d / 2, -def.d / 2 + 30);
  const bars: Bar[] = [];
  const consider = (key: string, name: string, polys: Pt[][], band: [number, number], base: number, mount: FurnitureDef['mount'], sel: boolean) => {
    const loc = polys.flat().map((p) => toLocal(p, it));
    const x0 = Math.min(...loc.map((p) => p.x)),
      x1 = Math.max(...loc.map((p) => p.x));
    const y0 = Math.min(...loc.map((p) => p.y)),
      y1 = Math.max(...loc.map((p) => p.y));
    if (!sel && (x1 <= sx0 || x0 >= sx1 || y1 <= sy0 || y0 >= sy1)) return;
    bars.push({ key, name, x0: Math.max(x0, sx0), x1: Math.min(x1, sx1), band, base, sel, mount });
  };
  for (const o of items) {
    const od = getFurniture(o.item);
    const st = stacks.get(o.uid);
    if (!od || !st || (od.flat && o.uid !== it.uid)) continue;
    consider(o.uid, od.name, itemPolys(itemBox(o, od), od), st.band, st.elev, od.mount, o.uid === it.uid);
  }
  for (const f of floor.fixtures) consider(f.id, f.def.name, [itemCorners(f)], [f.def.clearUnder ?? 0, f.def.h], 0, 'floor', false);

  // layout: x in inches -> px; figure stands to the right
  const W = 280,
    H = 190,
    pad = 22;
  const x0 = Math.min(sx0, ...bars.map((b) => b.x0)),
    x1 = Math.max(sx1, ...bars.map((b) => b.x1)) + 30; // room for the figure
  const top = Math.max(CEILING, person + 6);
  const k = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 1.4) / top);
  const X = (x: number) => pad + (x - x0) * k;
  const Y = (y: number) => H - pad * 0.6 - y * k;
  const fx = X(x1 - 14);
  const eye = person - 4.5;
  const selBar = bars.find((b) => b.sel);
  if (!selBar) return null;

  return (
    <figure className="sideview">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Side view of the ${def.name.toLowerCase()} and what is stacked with it`}>
        <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} className="sv-floor" />
        <line x1={0} x2={W} y1={Y(CEILING)} y2={Y(CEILING)} className="sv-ceiling" />
        <text x={4} y={Y(CEILING) - 3} className="sv-note">{CEILING / 12}' ceiling</text>
        <line x1={0} x2={W} y1={Y(eye)} y2={Y(eye)} className="sv-eye" />
        <text x={4} y={Y(eye) - 3} className="sv-note">your eyes {ftIn(eye / 12)}</text>
        {bars
          .sort((a, b) => Number(a.sel) - Number(b.sel))
          .map((b) => {
            const open = b.band[0] > b.base + 0.5; // open space underneath (desk, loft bed)
            const w = Math.max(1.5, X(b.x1) - X(b.x0));
            return (
              <g key={b.key} className={`sv-bar ${b.sel ? 'sel' : ''} sv-${b.mount ?? 'floor'}`}>
                <rect x={X(b.x0)} y={Y(b.band[1])} width={w} height={Math.max(1.5, (b.band[1] - b.band[0]) * k)} rx={1.5} />
                {open && b.base === 0 && (
                  <>
                    <line x1={X(b.x0) + 2} x2={X(b.x0) + 2} y1={Y(b.band[0])} y2={Y(0)} />
                    <line x1={X(b.x1) - 2} x2={X(b.x1) - 2} y1={Y(b.band[0])} y2={Y(0)} />
                  </>
                )}
                {w > 34 && (b.band[1] - b.band[0]) * k > 9 && (
                  <text x={X(b.x0) + w / 2} y={Y((b.band[0] + b.band[1]) / 2) + 3} className="sv-label">
                    {b.name.length > w / 5 ? b.name.slice(0, Math.max(3, Math.floor(w / 5) - 1)) + '…' : b.name}
                  </text>
                )}
              </g>
            );
          })}
        {/* height marks for the selected piece */}
        {[selBar.band[1], ...(selBar.band[0] > 0.5 ? [selBar.band[0]] : [])].map((y) => (
          <g key={y} className="sv-mark">
            <line x1={X(selBar.x1) + 2} x2={X(selBar.x1) + 9} y1={Y(y)} y2={Y(y)} />
            <text x={X(selBar.x1) + 11} y={Y(y) + 3}>{Math.round(y)}"</text>
          </g>
        ))}
        {/* you, for scale */}
        <g className="sv-person">
          <circle cx={fx} cy={Y(person - 4.5)} r={4.5 * k} />
          <path
            d={`M${fx - 7 * k} ${Y(person - 11)} h${14 * k} l${2 * k} ${26 * k} h${-4 * k} l${-2 * k} ${-18 * k} v${(person - 11 - 37) * k} l${2 * k} ${36 * k} h${-5 * k} l${-2 * k} ${-30 * k} l${-2 * k} ${30 * k} h${-5 * k} l${2 * k} ${-36 * k} v${-(person - 11 - 37) * k} l${-2 * k} ${18 * k} h${-4 * k} Z`}
          />
          <text x={fx} y={Y(person) - 4} className="sv-note" textAnchor="middle">
            {ftIn(person / 12)}
          </text>
        </g>
      </svg>
      <figcaption>Side view, standing in front of it. Pieces only collide when they overlap here AND on the plan.</figcaption>
    </figure>
  );
}
