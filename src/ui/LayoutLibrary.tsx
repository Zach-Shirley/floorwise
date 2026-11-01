import { useMemo, useState } from 'react';
import { bathsLabel, bedsLabel } from '../engine/format';
import { resolveLayout, type RLayout } from '../engine/resolve';
import type { LayoutDef, LayoutStyle } from '../engine/types';

const STYLE_LABEL: Record<LayoutStyle, string> = {
  'open-concept': 'Open concept',
  'split-bedroom': 'Split bedroom',
  traditional: 'Traditional',
  'l-shaped': 'L-shaped',
  courtyard: 'Courtyard',
  cottage: 'Cottage',
  apartment: 'Apartment',
  townhouse: 'Townhouse',
  'two-story': 'Two-story',
  ranch: 'Ranch',
  'narrow-lot': 'Narrow lot',
  accessible: 'Accessible',
};
export const styleLabel = (s: LayoutStyle) => STYLE_LABEL[s] ?? s;

const SIZES = [
  { id: 'all', label: 'Any size', min: 0, max: Infinity },
  { id: 's', label: '< 800', min: 0, max: 800 },
  { id: 'm', label: '800–1,500', min: 800, max: 1500 },
  { id: 'l', label: '1,500–2,500', min: 1500, max: 2500 },
  { id: 'xl', label: '2,500+', min: 2500, max: Infinity },
];
const BEDS = [
  { id: -1, label: 'Any' },
  { id: 0, label: 'Studio' },
  { id: 1, label: '1' },
  { id: 2, label: '2' },
  { id: 3, label: '3' },
  { id: 4, label: '4+' },
];

export function Thumbnail({ L }: { L: RLayout }) {
  const gap = 4;
  let ox = 0;
  const parts = L.floors.map((f) => {
    const [x, y, w, h] = f.bbox;
    const g = { f, dx: ox - x, dy: -y, w, h };
    ox += w + gap;
    return g;
  });
  const W = ox - gap,
    H = Math.max(...parts.map((p) => p.h));
  return (
    <svg className="thumb" viewBox={`-2 -2 ${W + 4} ${H + 4}`} preserveAspectRatio="xMidYMid meet">
      {parts.map(({ f, dx, dy }) => (
        <g key={f.id} transform={`translate(${dx} ${dy})`}>
          {f.rooms.map((r) =>
            r.rects.map((q, i) => (
              <rect key={`${r.id}${i}`} x={q[0]} y={q[1]} width={q[2]} height={q[3]} className={`th z-${r.zone} ${r.outdoor ? 'outdoor' : ''}`} />
            )),
          )}
        </g>
      ))}
    </svg>
  );
}

export function LayoutLibrary({
  layouts,
  activeId,
  onPick,
}: {
  layouts: LayoutDef[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  const resolved = useMemo(() => layouts.map((d) => resolveLayout(d)), [layouts]);
  const [q, setQ] = useState('');
  const [size, setSize] = useState('all');
  const [beds, setBeds] = useState(-1);
  const [style, setStyle] = useState<LayoutStyle | ''>('');
  const styles = useMemo(() => [...new Set(layouts.flatMap((l) => l.styles))].sort(), [layouts]);
  const range = SIZES.find((s) => s.id === size)!;
  const shown = resolved.filter((L) => {
    const d = L.def;
    if (L.area < range.min || L.area >= range.max) return false;
    if (beds >= 0 && (beds === 4 ? d.beds < 4 : d.beds !== beds)) return false;
    if (style && !d.styles.includes(style)) return false;
    if (q && !`${d.name} ${d.summary} ${d.styles.join(' ')}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="library">
      <input className="search" placeholder="Search plans" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="filter-row" role="group" aria-label="Bedrooms">
        <span className="filter-label">Beds</span>
        {BEDS.map((b) => (
          <button key={b.id} className={`chip ${beds === b.id ? 'on' : ''}`} onClick={() => setBeds(b.id)}>
            {b.label}
          </button>
        ))}
      </div>
      <div className="filter-row" role="group" aria-label="Size">
        <span className="filter-label">Sq ft</span>
        {SIZES.map((s) => (
          <button key={s.id} className={`chip ${size === s.id ? 'on' : ''}`} onClick={() => setSize(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="filter-row" role="group" aria-label="Style">
        <span className="filter-label">Style</span>
        <button className={`chip ${style === '' ? 'on' : ''}`} onClick={() => setStyle('')}>
          All
        </button>
        {styles.map((s) => (
          <button key={s} className={`chip ${style === s ? 'on' : ''}`} onClick={() => setStyle(s)}>
            {styleLabel(s)}
          </button>
        ))}
      </div>
      <div className="count">
        {shown.length} of {layouts.length} plans
      </div>
      <div className="cards">
        {shown.map((L) => (
          <button key={L.def.id} className={`card ${L.def.id === activeId ? 'active' : ''}`} onClick={() => onPick(L.def.id)}>
            <Thumbnail L={L} />
            <div className="card-body">
              <div className="card-title">{L.def.name}</div>
              <div className="card-meta">
                {Math.round(L.area).toLocaleString()} ft² · {bedsLabel(L.def.beds)} · {bathsLabel(L.def.baths)}
                {L.floors.length > 1 ? ` · ${L.floors.length} floors` : ''}
              </div>
              <div className="card-tags">
                {L.def.styles.slice(0, 3).map((s) => (
                  <span key={s} className="tag">
                    {styleLabel(s)}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
        {!shown.length && <div className="empty">No plans match. Loosen a filter.</div>}
      </div>
    </div>
  );
}
