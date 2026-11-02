import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { getFurniture } from '../data/furniture';
import { LAYOUTS, getLayout } from '../data/layouts';
import { bathsLabel, bedsLabel } from '../engine/format';
import { analyzeFit, carryRiders, findSpot, itemBox, resolveStacks, ridersOf, snapToWallMount, snapToWalls, type PlacedItem } from '../engine/furniture';
import { loadFinishes, saveFinishes, type Finishes, type RoomFinish } from '../engine/finishes';
import { inRoom } from '../engine/resolve';
import { resolveLayout } from '../engine/resolve';
import { autoFurnish } from '../engine/autofurnish';
import { ErrorBoundary } from './ErrorBoundary';
import { FurniturePalette } from './FurniturePalette';
import { Inspector } from './Inspector';
import { LayoutLibrary } from './LayoutLibrary';
import { LearnPanel } from './LearnPanel';
import { PlanView, type PlanHandle, type ViewOpts } from './PlanView';
import { isPlaced, usePlanner } from './usePlanner';

// three.js is only downloaded when you first open the 3D view.
const Walk3D = lazy(() => import('./Walk3D'));

const PREFS = 'floorwise:v1:prefs';
type Tab = 'plans' | 'furniture' | 'learn';
interface Prefs {
  layout: string;
  tab: Tab;
  opts: ViewOpts;
  /** Your height in inches, for the side view (default 6'2"). */
  person: number;
}

function loadPrefs(): Prefs {
  const def: Prefs = {
    layout: LAYOUTS.find((l) => l.beds === 2)?.id ?? LAYOUTS[0].id,
    tab: 'plans',
    opts: { dims: true, zones: false, flow: false, furniture: true, grid: true },
    person: 74,
  };
  let prefs = def;
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) ?? '{}');
    prefs = { ...def, ...p, layout: getLayout(p.layout) ? p.layout : def.layout, opts: { ...def.opts, ...p.opts } };
  } catch {
    /* use defaults */
  }
  // shareable links: ?layout=<id>&view=zones,flow
  const q = new URLSearchParams(location.search);
  const fromUrl = q.get('layout');
  if (fromUrl && getLayout(fromUrl)) prefs = { ...prefs, layout: fromUrl };
  const view = q.get('view');
  if (view !== null) {
    const on = new Set(view.split(','));
    prefs = { ...prefs, opts: Object.fromEntries(Object.keys(prefs.opts).map((k) => [k, on.has(k) || k === 'furniture'])) as unknown as ViewOpts };
  }
  return prefs;
}

const TOGGLES: { key: keyof ViewOpts; label: string; title: string }[] = [
  { key: 'dims', label: 'Dimensions', title: 'Room sizes and overall dimensions' },
  { key: 'zones', label: 'Zones', title: 'Color rooms by public / private / service' },
  { key: 'flow', label: 'Flow', title: 'Trace the route from the front door to each room' },
  { key: 'furniture', label: 'Furniture', title: 'Show your placed furniture' },
  { key: 'grid', label: 'Grid', title: '1 ft grid, darker every 5 ft' },
];

export function App() {
  const [prefs, setPrefs] = useState(loadPrefs);
  const startDef = getLayout(prefs.layout)!;
  const P = usePlanner(startDef.id, startDef.floors[0].id);
  const def = getLayout(P.layoutId)!;
  const L = useMemo(() => resolveLayout(def), [def]);
  const floor = L.floors.find((f) => f.id === P.floorId) ?? L.floors[0];
  const floorItems = useMemo(() => P.items.filter((i) => i.floor === floor.id), [P.items, floor.id]);
  const fit = useMemo(() => analyzeFit(floor, floorItems), [floor, floorItems]);
  const stacks = useMemo(() => resolveStacks(floor, floorItems), [floor, floorItems]);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [scale, setScale] = useState(20);
  const [drawer, setDrawer] = useState<'left' | 'right' | null>(null);
  const [toast, setToast] = useState('');
  const plan = useRef<PlanHandle>(null);
  const [mode, setMode] = useState<'plan' | 'walk'>(() => (new URLSearchParams(location.search).get('mode') === 'walk' ? 'walk' : 'plan'));
  const [spawn, setSpawn] = useState<string | null>(null);
  const [walkRoom, setWalkRoom] = useState<string | null>(null);
  const [grabUid, setGrabUid] = useState<string | null>(null);
  const [spawnAt, setSpawnAt] = useState<{ x: number; y: number; yaw: number } | null>(null);
  // wall paint and floor finishes, per layout
  const [fin, setFin] = useState(() => ({ layout: P.layoutId, map: loadFinishes(P.layoutId) }));
  if (fin.layout !== P.layoutId) setFin({ layout: P.layoutId, map: loadFinishes(P.layoutId) });
  const finishes: Finishes = fin.layout === P.layoutId ? fin.map : {};
  const setRoomFinish = (roomId: string, patch: RoomFinish) => {
    const key = `${floor.id}/${roomId}`;
    const map = { ...finishes, [key]: { ...finishes[key], ...patch } };
    setFin({ layout: P.layoutId, map });
    saveFinishes(P.layoutId, map);
  };
  const fileIn = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS, JSON.stringify({ ...prefs, layout: P.layoutId }));
    } catch {
      /* ignore */
    }
  }, [prefs, P.layoutId]);

  // ?furnish=1 fills an empty layout with starter furniture (used for demos)
  const wantFurnish = useRef(new URLSearchParams(location.search).get('furnish') === '1');
  useEffect(() => {
    if (!wantFurnish.current) return;
    wantFurnish.current = false;
    if (!P.items.length) furnishAll();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set('layout', P.layoutId);
    url.searchParams.delete('view');
    url.searchParams.delete('furnish');
    if (mode === 'walk') url.searchParams.set('mode', 'walk');
    else url.searchParams.delete('mode');
    history.replaceState(null, '', url);
  }, [P.layoutId, mode]);

  const roomOfItem = (uid: string) => {
    const it = P.items.find((i) => i.uid === uid);
    return it ? floor.rooms.find((r) => r.type !== 'open-below' && inRoom({ x: it.x, y: it.y }, r, 0)) : undefined;
  };

  /** Switch to the 3D walk-through, starting in the selected room (or the one in the middle of the plan view). */
  const enterWalk = () => {
    let room: string | undefined;
    if (P.sel?.kind === 'room') room = P.sel.id;
    else if (P.sel?.kind === 'item') room = roomOfItem(P.sel.uid)?.id;
    else {
      const c = plan.current?.center();
      room = c && floor.rooms.find((r) => !r.outdoor && r.type !== 'open-below' && inRoom(c, r, 0))?.id;
    }
    setSpawn(room ?? null);
    setSpawnAt(null);
    setMode('walk');
  };
  // Changing floors in 3D drops you at the stairs.
  const walkSpawn = spawn && floor.roomById.has(spawn) ? spawn : floor.rooms.find((r) => r.type === 'stair')?.id ?? null;
  const onWalkRoom = (id: string) => {
    setWalkRoom(id);
    // show the room you walked into (its paint and floor options), unless you're working on a piece there
    if (!(P.sel?.kind === 'item' && roomOfItem(P.sel.uid)?.id === id)) P.select({ kind: 'room', id });
  };


  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const pickLayout = (id: string) => {
    const d = getLayout(id)!;
    P.setLayout(id, d.floors[0].id);
    setDrawer(null);
  };

  const addAt = (item: string, x: number, y: number) => {
    const fdef = getFurniture(item);
    if (!fdef) return;
    const box = itemBox({ uid: '', item, floor: floor.id, x, y, rot: 0 }, fdef);
    if (fdef.mount === 'wall') {
      const m = snapToWallMount(floor, box);
      P.add(item, m.x, m.y, m.rot);
    } else {
      const snapped = snapToWalls(floor, box);
      P.add(item, snapped.x, snapped.y);
    }
    if (!prefs.opts.furniture) setPrefs((p) => ({ ...p, opts: { ...p.opts, furniture: true } }));
  };

  const addFromPalette = (item: string) => {
    const center = plan.current?.center() ?? { x: floor.bbox[0] + floor.bbox[2] / 2, y: floor.bbox[1] + floor.bbox[3] / 2 };
    const selRoom = P.sel?.kind === 'room' ? floor.roomById.get(P.sel.id) : undefined;
    const room =
      mode === 'walk' ? (walkRoom ? floor.roomById.get(walkRoom) : undefined) : selRoom ?? floor.rooms.find((r) => !r.outdoor && inRoom(center, r, 0));
    const spot = room && findSpot(floor, P.items, item, room);
    if (spot) {
      const uid = P.add(item, spot.x, spot.y, spot.rot);
      if (mode === 'walk') {
        setGrabUid(uid);
        setToast(`Added to ${room!.name}. Click the 3D view to pick it up.`);
      }
    } else if (mode === 'walk') {
      setToast(room ? `No clear spot in ${room.name}. Move something first.` : 'Walk into a room first');
    } else {
      const c = room ? room.labelAt : center;
      addAt(item, c.x, c.y);
      if (room) setToast(`No clear spot in ${room.name}: drag it where you want it`);
    }
    if (!prefs.opts.furniture) setPrefs((p) => ({ ...p, opts: { ...p.opts, furniture: true } }));
    setDrawer(null);
  };

  const furnishAll = () => {
    let items = P.items;
    for (const f of L.floors) items = [...items, ...autoFurnish(f, items.filter((i) => i.floor === f.id))];
    const added = items.length - P.items.length;
    P.replaceAll(items);
    setToast(added ? `Added ${added} starter pieces. Drag them around!` : 'No room for more furniture');
    if (!prefs.opts.furniture) setPrefs((p) => ({ ...p, opts: { ...p.opts, furniture: true } }));
  };

  /** Move or rotate a piece, carrying anything that rests on it (monitors on a desk). */
  const moveTo = (uid: string, to: { x: number; y: number; rot: number }) => {
    const it = P.items.find((i) => i.uid === uid);
    if (!it) return;
    const riders = ridersOf(floor, floorItems, uid);
    P.moveMany([{ uid, ...to }, ...carryRiders(riders, it, to)]);
  };

  const rotateBy = (uid: string, delta: number) => {
    const it = P.items.find((i) => i.uid === uid);
    if (it) moveTo(uid, { x: it.x, y: it.y, rot: (((it.rot + delta) % 360) + 360) % 360 });
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) P.redo();
        else P.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        P.redo();
        return;
      }
      if (e.key === 'Escape') return P.select(null);
      if (e.key === 'f' && !mod) return plan.current?.fit();
      if ((e.key === '=' || e.key === '+') && !mod) return plan.current?.zoomBy(1.25);
      if (e.key === '-' && !mod) return plan.current?.zoomBy(0.8);
      const uid = P.sel?.kind === 'item' ? P.sel.uid : null;
      if (!uid) return;
      const it = P.items.find((i) => i.uid === uid);
      if (!it) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        P.remove(uid);
      } else if (e.key.toLowerCase() === 'r' && !mod) rotateBy(uid, e.shiftKey ? -90 : 90);
      else if (e.key.toLowerCase() === 'e' && !mod) rotateBy(uid, 15);
      else if (e.key.toLowerCase() === 'q' && !mod) rotateBy(uid, -15);
      else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        P.duplicate(uid);
      } else if (e.key.startsWith('Arrow') && mode === 'plan') {
        e.preventDefault();
        const step = e.shiftKey ? 0.5 : 1 / 12;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        moveTo(uid, { x: it.x + dx, y: it.y + dy, rot: it.rot });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const exportJson = () => {
    const data = { app: 'floorwise', version: 1, layout: P.layoutId, items: P.items, finishes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `floorwise-${P.layoutId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const items: PlacedItem[] = (data.items ?? []).filter(isPlaced);
      const target = data.layout && getLayout(data.layout) ? data.layout : P.layoutId;
      if (target !== P.layoutId) pickLayout(target);
      if (data.finishes && typeof data.finishes === 'object') {
        saveFinishes(target, data.finishes);
        setFin({ layout: target, map: data.finishes });
      }
      setTimeout(() => P.replaceAll(items), 0);
      setToast(`Imported ${items.length} pieces`);
    } catch {
      setToast("That file isn't a Floorwise export");
    }
  };

  const blocked = [...fit.values()].filter((w) => w.some((x) => x.level === 'block')).length;
  const setOpt = (k: keyof ViewOpts) => setPrefs((p) => ({ ...p, opts: { ...p.opts, [k]: !p.opts[k] } }));
  const setTab = (tab: Tab) => setPrefs((p) => ({ ...p, tab }));

  return (
    <div className={`app ${drawer ? `drawer-${drawer}` : ''}`}>
      <header className="top">
        <div className="brand">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
            <path d="M6 26V12.5L16 5l10 7.5V26H18.5v-7.5h-5V26z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          </svg>
          <span>Floorwise</span>
        </div>
        <button className="icon-btn only-narrow" onClick={() => setDrawer(drawer === 'left' ? null : 'left')} aria-label="Plans and furniture">
          ☰
        </button>
        <div className="title">
          <div className="t-name">{def.name}</div>
          <div className="t-meta">
            {Math.round(L.area).toLocaleString()} sq ft · {bedsLabel(def.beds)} · {bathsLabel(def.baths)}
          </div>
        </div>
        {L.floors.length > 1 && (
          <div className="seg" role="tablist" aria-label="Floor">
            {L.floors.map((f) => (
              <button key={f.id} role="tab" aria-selected={f.id === floor.id} className={f.id === floor.id ? 'on' : ''} onClick={() => {
                setSpawnAt(null);
                P.setFloor(f.id);
              }}>
                {f.name}
              </button>
            ))}
          </div>
        )}
        <div className="seg mode" role="tablist" aria-label="View">
          <button role="tab" aria-selected={mode === 'plan'} className={mode === 'plan' ? 'on' : ''} onClick={() => setMode('plan')}>
            Plan
          </button>
          <button role="tab" aria-selected={mode === 'walk'} className={mode === 'walk' ? 'on' : ''} onClick={() => mode !== 'walk' && enterWalk()} title="Walk through the plan in 3D">
            3D walk
          </button>
        </div>
        <div className={`toggles ${mode === 'walk' ? 'hide' : ''}`}>
          {TOGGLES.map((t) => (
            <button key={t.key} className={`toggle ${prefs.opts[t.key] ? 'on' : ''}`} onClick={() => setOpt(t.key)} title={t.title} aria-pressed={prefs.opts[t.key]}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div className="tools">
          <button className="icon-btn" onClick={P.undo} disabled={!P.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
            ↶
          </button>
          <button className="icon-btn" onClick={P.redo} disabled={!P.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
            ↷
          </button>
          <div className={`zoom ${mode === 'walk' ? 'hide' : ''}`}>
            <button className="icon-btn" onClick={() => plan.current?.zoomBy(0.8)} aria-label="Zoom out">
              −
            </button>
            <button className="zoom-val" onClick={() => plan.current?.fit()} title="Fit to screen (F)">
              {Math.round((scale / 20) * 100)}%
            </button>
            <button className="icon-btn" onClick={() => plan.current?.zoomBy(1.25)} aria-label="Zoom in">
              +
            </button>
          </div>
          <details className="menu">
            <summary className="icon-btn" aria-label="More">
              ⋯
            </summary>
            <div className="menu-pop">
              <button onClick={furnishAll}>Auto-furnish (rough start)</button>
              <button onClick={() => window.open('?gallery=1', '_blank')}>Browse 3D models</button>
              <button onClick={exportJson}>Export furniture (JSON)</button>
              <button onClick={() => fileIn.current?.click()}>Import furniture…</button>
              <button
                disabled={!P.items.length}
                onClick={() => {
                  if (confirm(`Remove all ${P.items.length} placed pieces from ${def.name}?`)) P.replaceAll([]);
                }}
              >
                Clear furniture
              </button>
            </div>
          </details>
          <input ref={fileIn} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
        <button className="icon-btn only-narrow" onClick={() => setDrawer(drawer === 'right' ? null : 'right')} aria-label="Details">
          ⓘ
        </button>
      </header>

      <aside className="left">
        <nav className="tabs" role="tablist">
          {(['plans', 'furniture', 'learn'] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={prefs.tab === t} className={prefs.tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t === 'plans' ? 'Plans' : t === 'furniture' ? 'Furniture' : 'Learn'}
            </button>
          ))}
        </nav>
        <div className="panel-scroll">
          {prefs.tab === 'plans' && <LayoutLibrary layouts={LAYOUTS} activeId={P.layoutId} onPick={pickLayout} />}
          {prefs.tab === 'furniture' && <FurniturePalette onAdd={addFromPalette} />}
          {prefs.tab === 'learn' && <LearnPanel />}
        </div>
      </aside>

      <main className="stage">
        <ErrorBoundary label="view" resetKey={`${mode}/${P.layoutId}/${floor.id}`}>
        {mode === 'walk' ? (
          <Suspense fallback={<div className="walk-loading">Building the 3D view…</div>}>
            <Walk3D
              key={P.layoutId}
              floor={floor}
              items={floorItems}
              fit={fit}
              stacks={stacks}
              selUid={P.sel?.kind === 'item' ? P.sel.uid : null}
              person={prefs.person}
              spawnRoom={walkSpawn}
              spawnAt={spawnAt}
              below={L.floors[L.floors.indexOf(floor) - 1]}
              floors={L.floors.map((f) => ({ id: f.id, name: f.name, rooms: f.rooms.map((r) => ({ id: r.id, type: r.type, bbox: r.bbox })) }))}
              doorKey={`floorwise:v1:doors:${P.layoutId}:${floor.id}`}
              finishes={finishes}
              onFloor={(id, at) => {
                setSpawnAt(at);
                P.setFloor(id);
              }}
              grabUid={grabUid}
              onGrabbed={() => setGrabUid(null)}
              onRoom={onWalkRoom}
              onSelect={(uid) => P.select(uid ? { kind: 'item', uid } : null)}
              onBeginEdit={P.checkpoint}
              onMoveMany={(ups) => P.moveMany(ups, false)}
            />
          </Suspense>
        ) : (
          <PlanView
            ref={plan}
            L={L}
            floor={floor}
            items={floorItems}
            fit={fit}
            sel={P.sel}
            opts={prefs.opts}
            highlight={highlight}
            onSelect={(s) => {
              P.select(s);
              if (s && s.kind !== 'item') setDrawer(null);
            }}
            onBeginEdit={P.checkpoint}
            stacks={stacks}
            onMoveMany={(ups) => P.moveMany(ups, false)}
            onDropItem={addAt}
            onScale={setScale}
          />
        )}
        </ErrorBoundary>
        <div className="stage-foot">
          {floorItems.length === 0 && (
            <button className="badge cta" onClick={furnishAll}>
              Auto-furnish this plan
            </button>
          )}
          {floorItems.length > 0 && (
            <span className={`badge ${blocked ? 'warn' : 'good'}`}>
              {floorItems.length} piece{floorItems.length === 1 ? '' : 's'}
              {blocked ? ` · ${blocked} don't fit` : ' · all fit'}
            </span>
          )}
          <span className="keys">
            {mode === 'walk'
              ? 'WASD walk · mouse look · click to pick up / put down · R rotate · Del remove · Esc cursor'
              : 'Scroll to zoom · drag to pan · click a room for details · R rotate · Del remove · F fit'}
          </span>
        </div>
        {L.issues.length > 0 && (
          <div className="data-warn">
            <b>Layout data problems</b>
            {L.issues.slice(0, 5).map((m) => (
              <div key={m}>{m}</div>
            ))}
          </div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </main>

      <aside className="right">
        <div className="panel-scroll">
          <ErrorBoundary label="details panel" resetKey={JSON.stringify(P.sel)}>
            <Inspector
              L={L}
              floor={floor}
              sel={P.sel}
              items={floorItems}
              fit={fit}
              stacks={stacks}
              person={prefs.person}
              onPerson={(person) => setPrefs((p) => ({ ...p, person }))}
              onElev={(uid, elev) => P.edit(uid, { elev })}
              onColor={(uid, color) => P.edit(uid, { color })}
              finishes={finishes}
              onFinish={setRoomFinish}
              onSelect={P.select}
              onHighlight={setHighlight}
              onRotate={rotateBy}
              onRemove={P.remove}
              onDuplicate={P.duplicate}
            />
          </ErrorBoundary>
        </div>
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(null)} />}
    </div>
  );
}
