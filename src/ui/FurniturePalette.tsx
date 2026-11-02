import { useState } from 'react';
import { FURNITURE, FURNITURE_CATEGORIES } from '../data/furniture';
import type { FurnitureDef } from '../engine/types';
import { SymbolShape } from './symbols';

export function MiniSymbol({ def }: { def: FurnitureDef }) {
  const w = def.w / 12,
    d = def.d / 12;
  const pad = 0.6;
  const s = Math.max(w, d) + pad * 2;
  return (
    <svg className="mini" viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`}>
      <g className={`item lvl-ok ${def.flat ? 'flat' : ''}`}>
        <SymbolShape symbol={def.symbol} w={w} d={d} round={def.round} flip={def.flip} />
      </g>
    </svg>
  );
}

export function FurniturePalette({ onAdd }: { onAdd: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({ Beds: true });
  const match = (f: FurnitureDef) => !q || `${f.name} ${f.category}`.toLowerCase().includes(q.toLowerCase());
  return (
    <div className="palette">
      <input className="search" placeholder="Search furniture" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="hint">Drag onto the plan, or click to drop it in the selected room. Sizes are real-world inches. Wall pieces hang on walls; "on top" pieces sit on a desk, dresser or table.</p>
      {FURNITURE_CATEGORIES.map((cat) => {
        const list = FURNITURE.filter((f) => f.category === cat && match(f));
        if (!list.length) return null;
        const isOpen = !!q || open[cat];
        return (
          <section key={cat} className="cat">
            <button className="cat-head" onClick={() => setOpen((o) => ({ ...o, [cat]: !o[cat] }))} aria-expanded={isOpen}>
              <span>{cat}</span>
              <span className="cat-count">{list.length}</span>
              <svg className={`chev ${isOpen ? 'open' : ''}`} viewBox="0 0 12 12" width="12" height="12">
                <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            {isOpen && (
              <div className="grid">
                {list.map((f) => (
                  <button
                    key={f.id}
                    className="piece"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/floorwise-item', f.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => onAdd(f.id)}
                    title={f.detail ? `${f.name}: ${f.detail}` : f.name}
                  >
                    <MiniSymbol def={f} />
                    <span className="piece-name">{f.name}</span>
                    <span className="piece-dim">
                      {f.w}" × {f.d}"{f.mount === 'wall' ? ' · wall' : f.mount === 'surface' ? ' · on top' : f.mount === 'ceiling' ? ' · ceiling' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
