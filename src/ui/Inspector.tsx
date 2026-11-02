import { useMemo } from 'react';
import { getFurniture } from '../data/furniture';
import { bathsLabel, bedsLabel, ftIn, sqft } from '../engine/format';
import { CEILING, type FitWarning, type PlacedItem, type Stack } from '../engine/furniture';
import { inRoom, type RFloor, type RLayout, type RRoom } from '../engine/resolve';
import { kitchenTriangle, runChecks } from '../engine/rules';
import type { RoomType, Zone } from '../engine/types';
import { styleLabel } from './LayoutLibrary';
import type { Selection } from './PlanView';
import { SideView } from './SideView';

const TYPE_LABEL: Record<RoomType, string> = {
  living: 'Living room',
  family: 'Family room',
  dining: 'Dining',
  kitchen: 'Kitchen',
  entry: 'Entry / foyer',
  hall: 'Hall',
  bedroom: 'Bedroom',
  primary: 'Primary bedroom',
  bath: 'Full bath',
  powder: 'Powder room (half bath)',
  closet: 'Closet',
  walkin: 'Walk-in closet',
  laundry: 'Laundry',
  mudroom: 'Mudroom',
  pantry: 'Pantry',
  office: 'Office',
  utility: 'Utility / mechanical',
  stair: 'Stair',
  garage: 'Garage',
  porch: 'Porch',
  deck: 'Deck / patio',
  flex: 'Flex room',
  great: 'Great room',
  workshop: 'Workshop',
  studio: 'Studio',
  'open-below': 'Open to below',
};

export const ZONE_INFO: Record<Zone, { label: string; text: string }> = {
  public: { label: 'Public', text: 'Shared and guest-facing. Usually close to the entry.' },
  private: { label: 'Private', text: 'Sleeping and bathing. Kept away from the front door and noise.' },
  service: { label: 'Service', text: 'Work spaces: laundry, storage, garage. Best near the kitchen or a side door.' },
  circulation: { label: 'Circulation', text: 'Space for moving between rooms. Useful, but every foot of hall is a foot not lived in.' },
  outdoor: { label: 'Outdoor', text: 'Not heated or cooled, so it is left out of the square footage.' },
};

const WALL_NAME = { N: 'north', S: 'south', E: 'east', W: 'west' } as const;

interface Props {
  L: RLayout;
  floor: RFloor;
  sel: Selection;
  items: PlacedItem[];
  fit: Map<string, FitWarning[]>;
  stacks: Map<string, Stack>;
  /** Your height in inches (side view figure). */
  person: number;
  onPerson: (inches: number) => void;
  onElev: (uid: string, inches: number) => void;
  onSelect: (s: Selection) => void;
  onHighlight: (rooms: string[]) => void;
  onRotate: (uid: string, delta: number) => void;
  onRemove: (uid: string) => void;
  onDuplicate: (uid: string) => void;
}

export function Inspector(p: Props) {
  const { sel, floor } = p;
  if (sel?.kind === 'room') {
    const room = floor.roomById.get(sel.id);
    if (room) return <RoomPanel {...p} room={room} />;
  }
  if (sel?.kind === 'item') {
    const it = p.items.find((i) => i.uid === sel.uid);
    if (it) return <ItemPanel {...p} it={it} />;
  }
  if (sel?.kind === 'fixture') {
    const fx = floor.fixtures.find((f) => f.id === sel.id);
    if (fx)
      return (
        <div className="insp">
          <Back onClick={() => p.onSelect(null)} />
          <div className="eyebrow">Built-in fixture · {floor.roomById.get(fx.room)?.name}</div>
          <h2>{fx.def.name}</h2>
          <div className="kv">
            <span>Size</span>
            <b>
              {Math.round(fx.w * 12)}" × {Math.round(fx.d * 12)}" ({ftIn(fx.w)} × {ftIn(fx.d)})
            </b>
          </div>
          {fx.def.tip && <p className="tip">{fx.def.tip}</p>}
          <p className="muted">Fixtures come with the layout and stay put. To try a different arrangement, add the same piece from the Furniture tab.</p>
        </div>
      );
  }
  return <LayoutPanel {...p} />;
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button className="back" onClick={onClick}>
      <svg viewBox="0 0 12 12" width="12" height="12">
        <path d="M7.5 3l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      About this layout
    </button>
  );
}

function LayoutPanel({ L, floor, onSelect, onHighlight }: Props) {
  const d = L.def;
  const checks = useMemo(() => runChecks(L), [L]);
  const passed = checks.filter((c) => !c.problems.length).length;
  const tri = kitchenTriangle(floor);
  const hallArea = L.floors.flatMap((f) => f.rooms).filter((r) => r.type === 'hall').reduce((s, r) => s + r.area, 0);
  return (
    <div className="insp">
      <div className="eyebrow">{d.styles.map(styleLabel).join(' · ')}</div>
      <h2>{d.name}</h2>
      <p className="summary">{d.summary}</p>
      <div className="stats">
        <div><b>{Math.round(L.area).toLocaleString()}</b><span>sq ft</span></div>
        <div><b>{bedsLabel(d.beds).replace(' bd', '')}</b><span>{d.beds === 0 ? 'layout' : 'beds'}</span></div>
        <div><b>{bathsLabel(d.baths).replace(' ba', '')}</b><span>baths</span></div>
        <div><b>{L.floors.length}</b><span>{L.floors.length > 1 ? 'floors' : 'floor'}</span></div>
      </div>
      {(L.garageArea > 0 || L.outdoorArea > 0) && (
        <div className="muted small">
          Plus {[L.garageArea && `${sqft(L.garageArea)} garage`, L.outdoorArea && `${sqft(L.outdoorArea)} porch/deck`].filter(Boolean).join(' and ')} (not counted).
        </div>
      )}

      <h3>Why it's arranged this way</h3>
      <div className="notes">
        {d.notes.map((n, i) => (
          <div key={i} className="note" onMouseEnter={() => onHighlight(n.rooms ?? [])} onMouseLeave={() => onHighlight([])}>
            <div className="note-title">{n.title}</div>
            <p>{n.body}</p>
          </div>
        ))}
      </div>

      <h3>
        Plan check <span className={`pill ${passed === checks.length ? 'good' : 'warn'}`}>{passed}/{checks.length}</span>
      </h3>
      <ul className="checks">
        {checks.map((c) => (
          <li key={c.id} className={c.problems.length ? 'bad' : 'ok'} title={c.why}>
            <span className="mark">{c.problems.length ? '!' : '✓'}</span>
            <div>
              <div>{c.label}</div>
              <div className="why">{c.problems.length ? c.problems.slice(0, 3).join('; ') : c.why}</div>
            </div>
          </li>
        ))}
      </ul>
      {(tri || hallArea > 0) && (
        <div className="metrics">
          {tri && (
            <div className="kv">
              <span>Work triangle</span>
              <b>{tri.total.toFixed(1)}'</b>
            </div>
          )}
          {hallArea > 0 && (
            <div className="kv">
              <span>Hallways</span>
              <b>{((hallArea / L.area) * 100).toFixed(0)}% of floor area</b>
            </div>
          )}
        </div>
      )}

      <h3>Rooms{L.floors.length > 1 ? ` · ${floor.name}` : ''}</h3>
      <table className="schedule">
        <tbody>
          {floor.rooms
            .filter((r) => r.type !== 'closet')
            .map((r) => (
              <tr key={r.id} onClick={() => onSelect({ kind: 'room', id: r.id })} onMouseEnter={() => onHighlight([r.id])} onMouseLeave={() => onHighlight([])}>
                <td>
                  <span className={`dot z-${r.zone}`} />
                  {r.name}
                </td>
                <td>{r.shaped ? 'L-shape' : `${ftIn(r.dims[0])} × ${ftIn(r.dims[1])}`}</td>
                <td>{Math.round(r.area)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function RoomPanel({ L, floor, room, items, onSelect }: Props & { room: RRoom }) {
  const links = floor.doors
    .filter((d) => d.a === room.id || d.b === room.id)
    .map((d) => ({ d, other: d.a === room.id ? d.b : d.a }));
  const wins = floor.windows.filter((w) => w.room === room.id);
  const sides = [...new Set(wins.map((w) => (w.seg.o === 'h' ? (w.out === -1 ? 'N' : 'S') : w.out === -1 ? 'W' : 'E')))];
  const fixtures = floor.fixtures.filter((f) => f.room === room.id);
  const pieces = items.filter((i) => inRoom({ x: i.x, y: i.y }, room, 0));
  const zone = ZONE_INFO[room.zone];
  const kindName = (k: string) => ({ swing: 'door', double: 'double door', slide: 'sliding door', pocket: 'pocket door', bifold: 'bifold door', open: 'opening', garage: 'garage door' })[k] ?? k;
  return (
    <div className="insp">
      <Back onClick={() => onSelect(null)} />
      <div className="eyebrow">{TYPE_LABEL[room.type]}</div>
      <h2>{room.name}</h2>
      <div className="stats two">
        <div>
          <b>{room.shaped ? 'L-shape' : `${ftIn(room.dims[0])} × ${ftIn(room.dims[1])}`}</b>
          <span>width × depth</span>
        </div>
        <div>
          <b>{Math.round(room.area)}</b>
          <span>sq ft{room.conditioned ? ` · ${((room.area / L.area) * 100).toFixed(1)}% of home` : ''}</span>
        </div>
      </div>
      <div className={`zone-card z-${room.zone}`}>
        <span className={`dot z-${room.zone}`} />
        <div>
          <b>{zone.label} zone</b>
          <p>{zone.text}</p>
        </div>
      </div>
      {room.note && <p className="tip">{room.note}</p>}
      <h3>Connects to</h3>
      <ul className="links">
        {links.map(({ d, other }) => (
          <li key={d.id}>
            {other === 'outside' ? (
              <span>Outside{d.main ? ' (front door)' : ''}</span>
            ) : (
              <button className="link" onClick={() => onSelect({ kind: 'room', id: other })}>
                {floor.roomById.get(other)?.name ?? other}
              </button>
            )}
            <span className="muted">
              {' '}
              via {d.full ? 'open plan, no wall' : `${Math.round(d.width * 12)}" ${kindName(d.kind)}`}
            </span>
          </li>
        ))}
        {!links.length && room.type === 'stair' && <li className="muted">Connects to the other floor</li>}
      </ul>
      <div className="kv">
        <span>Windows</span>
        <b>{wins.length ? `${wins.length} (${sides.map((s) => WALL_NAME[s as keyof typeof WALL_NAME]).join(', ')})` : 'None'}</b>
      </div>
      {fixtures.length > 0 && (
        <div className="kv">
          <span>Fixtures</span>
          <b>{fixtures.map((f) => f.def.name).join(', ')}</b>
        </div>
      )}
      <div className="kv">
        <span>Your furniture here</span>
        <b>{pieces.length ? pieces.map((i) => getFurniture(i.item)?.name).join(', ') : 'None yet'}</b>
      </div>
    </div>
  );
}

function ItemPanel({ it, fit, stacks, items, person, onPerson, onElev, onRotate, onRemove, onDuplicate, onSelect, floor }: Props & { it: PlacedItem }) {
  const def = getFurniture(it.item)!;
  const warns = fit.get(it.uid) ?? [];
  const room = floor.rooms.find((r) => inRoom({ x: it.x, y: it.y }, r, 0));
  const st = stacks.get(it.uid);
  const mount = def.mount ?? 'floor';
  const elev = st?.elev ?? 0;
  return (
    <div className="insp">
      <Back onClick={() => onSelect(null)} />
      <div className="eyebrow">
        {def.category}
        {room ? ` · in ${room.name}` : ''}
      </div>
      <h2>{def.name}</h2>
      <div className="kv">
        <span>Size</span>
        <b>
          {def.w}" × {def.d}" ({ftIn(def.w / 12)} × {ftIn(def.d / 12)})
        </b>
      </div>
      {def.detail && (
        <div className="kv">
          <span>Detail</span>
          <b>{def.detail}</b>
        </div>
      )}
      <div className="kv">
        <span>Height</span>
        <b>
          {def.h}"{def.clearUnder ? ` · ${def.clearUnder}" open underneath` : ''}
        </b>
      </div>
      <div className="kv">
        <span>{mount === 'wall' ? 'Hangs at' : 'Sits'}</span>
        {mount === 'wall' ? (
          <span className="elev">
            <button onClick={() => onElev(it.uid, Math.max(0, elev - 2))} title="Lower 2 inches">−</button>
            <input
              type="number"
              min={0}
              max={CEILING - def.h}
              value={Math.round(elev)}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) onElev(it.uid, Math.min(CEILING - def.h, Math.max(0, v)));
              }}
              aria-label="Height of the bottom edge above the floor, inches"
            />
            <span className="muted">" up</span>
            <button onClick={() => onElev(it.uid, Math.min(CEILING - def.h, elev + 2))} title="Raise 2 inches">+</button>
          </span>
        ) : (
          <b>
            {mount === 'ceiling'
              ? `From the ceiling, bottom at ${Math.round(elev)}"`
              : mount === 'surface'
                ? st?.on
                  ? `On the ${st.on.name.toLowerCase()}, at ${Math.round(elev)}"`
                  : 'On the floor'
                : 'On the floor'}
          </b>
        )}
      </div>
      <div className="kv">
        <span>Rotation</span>
        <b>{Math.round(it.rot)}°</b>
      </div>
      <div className="fit">
        {warns.length === 0 ? (
          <div className="fit-row ok">Fits with room to spare</div>
        ) : (
          warns.map((w, i) => (
            <div key={i} className={`fit-row ${w.level}`}>
              {w.msg}
            </div>
          ))
        )}
      </div>
      <div className="btns">
        <button onClick={() => onRotate(it.uid, -90)} title="Rotate left (Shift+R)">⟲ 90°</button>
        <button onClick={() => onRotate(it.uid, 90)} title="Rotate right (R)">⟳ 90°</button>
        <button onClick={() => onRotate(it.uid, 15)} title="Rotate 15° (E)">+15°</button>
        <button onClick={() => onDuplicate(it.uid)} title="Duplicate (Ctrl+D)">Duplicate</button>
        <button className="danger" onClick={() => onRemove(it.uid)} title="Delete (Del)">Remove</button>
      </div>
      {st && <SideView it={it} floor={floor} items={items} stacks={stacks} person={person} />}
      <div className="person-row">
        <span className="muted small">Figure height</span>
        <button onClick={() => onPerson(person - 1)} title="Shorter">−</button>
        <b>{ftIn(person / 12)}</b>
        <button onClick={() => onPerson(person + 1)} title="Taller">+</button>
      </div>
      {def.tip && <p className="tip">{def.tip}</p>}
      {mount === 'surface' && <p className="muted small">Surface pieces rest on whatever is under their center, and travel with it when you move it.</p>}
      {mount === 'wall' && <p className="muted small">Wall pieces snap to the nearest wall and turn to face the room. Set the height above.</p>}
      {def.clearance && <p className="muted small">The faint zone shows recommended clear space. Hold Alt while dragging to turn off wall snapping.</p>}
    </div>
  );
}
