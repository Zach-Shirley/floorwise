/**
 * Design and data checks for a layout. The test suite runs these on every
 * layout; the app shows them in the "Plan check" card so you can see why a
 * hand-written layout is (or isn't) sensible.
 */
import { convexOverlap, near, rectDistance, rectPoly, rectsOverlap, type Pt } from './geometry';
import { inRoom, itemCorners, type RFloor, type RLayout, type RRoom } from './resolve';
import type { RoomType } from './types';

export interface Check {
  id: string;
  label: string;
  /** Plain-language explanation of why the rule exists. */
  why: string;
  problems: string[];
}

const BEDROOMS: RoomType[] = ['bedroom', 'primary'];
const NEEDS_WINDOW: RoomType[] = ['bedroom', 'primary', 'living', 'family', 'office', 'great', 'studio', 'workshop'];
/** Rooms that are fine to reach only through one other room. */
const DEPENDENT: RoomType[] = ['closet', 'walkin', 'bath', 'powder', 'pantry', 'utility', 'laundry'];

const OUT = 'outside';
const key = (floor: string, room: string) => `${floor}/${room}`;

/** Room adjacency through doors and openings, across floors via matching stair rooms. */
export function circulationGraph(L: RLayout): Map<string, Set<string>> {
  const g = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!g.has(a)) g.set(a, new Set());
    if (!g.has(b)) g.set(b, new Set());
    g.get(a)!.add(b);
    g.get(b)!.add(a);
  };
  link(OUT, OUT);
  for (const f of L.floors) {
    for (const r of f.rooms) {
      if (!g.has(key(f.id, r.id))) g.set(key(f.id, r.id), new Set());
      if (r.outdoor && f === L.floors[0]) link(key(f.id, r.id), OUT);
    }
    for (const d of f.doors) link(key(f.id, d.a), d.b === OUT ? OUT : key(f.id, d.b));
  }
  for (let i = 1; i < L.floors.length; i++) {
    const lower = L.floors[i - 1].rooms.filter((r) => r.type === 'stair');
    for (const up of L.floors[i].rooms.filter((r) => r.type === 'stair')) {
      const down = lower.find((s) => s.rects.some((a) => up.rects.some((b) => rectsOverlap(a, b))));
      if (down) link(key(L.floors[i - 1].id, down.id), key(L.floors[i].id, up.id));
    }
  }
  return g;
}

export function reachable(g: Map<string, Set<string>>, from: string, blocked?: string): Set<string> {
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const n = q.shift()!;
    for (const m of g.get(n) ?? []) {
      if (m === blocked || seen.has(m)) continue;
      seen.add(m);
      q.push(m);
    }
  }
  return seen;
}

/** Shortest door-to-door route from the front door to every room (for the circulation overlay). */
export function circulationTree(L: RLayout): Map<string, string | null> {
  const g = circulationGraph(L);
  const f0 = L.floors[0];
  const main = f0.doors.find((d) => d.main) ?? f0.doors.find((d) => d.b === OUT);
  const parent = new Map<string, string | null>();
  if (!main) return parent;
  const start = key(f0.id, main.a);
  parent.set(start, null);
  const q = [start];
  while (q.length) {
    const n = q.shift()!;
    for (const m of g.get(n) ?? []) {
      if (m === OUT || parent.has(m)) continue;
      parent.set(m, n);
      q.push(m);
    }
  }
  return parent;
}

function kitchenTriangle(f: RFloor) {
  const find = (sym: string) => f.fixtures.find((x) => x.def.symbol === sym);
  const sink = find('sink-kitchen'),
    range = find('range'),
    fridge = find('fridge');
  if (!sink || !range || !fridge) return null;
  const d = (a: { cx: number; cy: number }, b: { cx: number; cy: number }) => Math.hypot(a.cx - b.cx, a.cy - b.cy);
  const legs = [d(sink, range), d(range, fridge), d(fridge, sink)];
  return { sink, range, fridge, legs, total: legs[0] + legs[1] + legs[2] };
}
export { kitchenTriangle };

export function runChecks(L: RLayout): Check[] {
  const checks: Check[] = [];
  const add = (id: string, label: string, why: string, problems: string[]) =>
    checks.push({ id, label, why, problems });

  add('data', 'Data resolves', 'Every door, window and fixture lines up with a real wall or room.', [...L.issues]);

  // overlaps
  const overlaps: string[] = [];
  for (const f of L.floors) {
    const rs = f.rooms.flatMap((r) => r.rects.map((rect) => ({ r, rect })));
    for (let i = 0; i < rs.length; i++)
      for (let j = i + 1; j < rs.length; j++)
        if (rectsOverlap(rs[i].rect, rs[j].rect)) overlaps.push(`${f.name}: ${rs[i].r.name} overlaps ${rs[j].r.name}`);
  }
  add('overlap', 'No overlapping rooms', 'Two rooms cannot occupy the same floor area.', overlaps);

  // reachability
  const g = circulationGraph(L);
  const all = reachable(g, OUT);
  const unreached: string[] = [];
  for (const f of L.floors) for (const r of f.rooms) if (r.type !== 'open-below' && !all.has(key(f.id, r.id))) unreached.push(`${f.name}: ${r.name}`);
  const mains = L.floors[0].doors.filter((d) => d.main);
  if (mains.length !== 1) unreached.push(`expected exactly one front door (main: true), found ${mains.length}`);
  for (const d of mains) if (d.width < 3 - 1e-6) unreached.push('front door should be at least 3\' wide');
  add('reach', 'Every room is reachable', 'You can walk from the front door to every room without passing through a wall.', unreached);

  // pass-through bedrooms
  const pass: string[] = [];
  for (const f of L.floors)
    for (const bed of f.rooms.filter((r) => BEDROOMS.includes(r.type))) {
      const without = reachable(g, OUT, key(f.id, bed.id));
      for (const f2 of L.floors)
        for (const r of f2.rooms) {
          if (r === bed || DEPENDENT.includes(r.type)) continue;
          if (!without.has(key(f2.id, r.id))) pass.push(`${r.name} can only be reached through ${bed.name}`);
        }
    }
  add('private', 'Bedrooms are not hallways', 'Nobody should have to walk through a bedroom to reach another room.', pass);

  // wet rooms opening onto food rooms
  const wetFood: string[] = [];
  for (const f of L.floors)
    for (const d of f.doors) {
      const a = f.roomById.get(d.a),
        b = f.roomById.get(d.b);
      if (!a || !b) continue;
      const isBath = (r: RRoom) => r.type === 'bath' || r.type === 'powder';
      const isFood = (r: RRoom) => r.type === 'kitchen' || r.type === 'dining' || r.type === 'pantry';
      if ((isBath(a) && isFood(b)) || (isBath(b) && isFood(a))) wetFood.push(`${a.name} opens directly into ${b.name}`);
    }
  add('bath-kitchen', 'No bathroom opens onto food areas', 'Bathrooms open off a hall or bedroom, never straight into a kitchen or dining room.', wetFood);

  // bedrooms habitable
  const hab: string[] = [];
  for (const f of L.floors)
    for (const r of f.rooms.filter((x) => BEDROOMS.includes(x.type))) {
      if (r.area < 70) hab.push(`${r.name} is ${r.area.toFixed(0)} sq ft (code minimum 70)`);
      if (Math.min(...r.dims) < 7) hab.push(`${r.name} is under 7' in one direction`);
      const closet = f.doors.some((d) => {
        const other = d.a === r.id ? d.b : d.b === r.id ? d.a : null;
        const o = other ? f.roomById.get(other) : undefined;
        return o && (o.type === 'closet' || o.type === 'walkin');
      });
      if (!closet) hab.push(`${r.name} has no closet`);
    }
  add('bedrooms', 'Bedrooms meet basic standards', 'Bedrooms need at least 70 sq ft, 7\' in every direction, and a closet.', hab);

  // windows
  const win: string[] = [];
  for (const f of L.floors)
    for (const r of f.rooms.filter((x) => NEEDS_WINDOW.includes(x.type)))
      if (!f.windows.some((w) => w.room === r.id)) win.push(`${r.name} has no window`);
  add('light', 'Living spaces and bedrooms get daylight', 'Bedrooms need a window for light, air and emergency escape; living spaces feel dark without one.', win);

  // halls
  const halls: string[] = [];
  for (const f of L.floors)
    for (const r of f.rooms.filter((x) => x.type === 'hall'))
      for (const rect of r.rects) if (Math.min(rect[2], rect[3]) < 3 - 1e-6) halls.push(`${r.name} is narrower than 3'`);
  add('halls', "Halls are at least 3' wide", 'Code asks for 36" halls; 42" feels relaxed and moves furniture easily.', halls);

  // door swings
  const swings: string[] = [];
  for (const f of L.floors) {
    for (const d of f.doors) {
      if (!d.swingRoom) continue;
      const room = f.roomById.get(d.swingRoom)!;
      const pts: Pt[] = d.swingPolys.flat();
      if (pts.some((p) => !inRoom(p, room, 0.02))) swings.push(`${f.name}: door ${d.a} -> ${d.b} swings outside ${room.name}`);
    }
    for (let i = 0; i < f.doors.length; i++)
      for (let j = i + 1; j < f.doors.length; j++)
        for (const p of f.doors[i].swingPolys)
          for (const q of f.doors[j].swingPolys)
            if (convexOverlap(p, q, 0.05) > 0)
              swings.push(`${f.name}: doors ${f.doors[i].a}->${f.doors[i].b} and ${f.doors[j].a}->${f.doors[j].b} hit each other`);
  }
  add('swings', 'Doors swing freely', 'A door should open fully inside its room without hitting another door.', swings);

  // fixtures
  const fx: string[] = [];
  for (const f of L.floors) {
    for (const x of f.fixtures) {
      const room = f.roomById.get(x.room)!;
      const c = itemCorners(x);
      if (c.some((p) => !inRoom(p, room, 0.25))) fx.push(`${f.name}: ${x.def.name} sticks out of ${room.name}`);
      for (const d of f.doors) {
        for (const p of d.swingPolys)
          if (convexOverlap(c, p, 0.05) > 0) fx.push(`${f.name}: ${x.def.name} in ${room.name} blocks a door swing`);
        for (const a of d.approach)
          if (convexOverlap(c, rectPoly(a), 0.05) > 0) fx.push(`${f.name}: ${x.def.name} in ${room.name} crowds a doorway`);
      }
    }
    for (let i = 0; i < f.fixtures.length; i++)
      for (let j = i + 1; j < f.fixtures.length; j++)
        if (convexOverlap(itemCorners(f.fixtures[i]), itemCorners(f.fixtures[j]), 0.02) > 0)
          fx.push(`${f.name}: ${f.fixtures[i].def.name} overlaps ${f.fixtures[j].def.name}`);
  }
  add('fixtures', 'Fixtures fit', 'Built-in fixtures sit inside their room and stay out of doorways.', fx);

  // plumbing
  const wet: string[] = [];
  const wetRooms = L.floors.flatMap((f) => f.rooms.filter((r) => r.wet).map((r) => ({ f, r })));
  for (const { f, r } of wetRooms) {
    const nearby = wetRooms.some(
      (o) =>
        o.r !== r &&
        ((o.f === f && r.rects.some((a) => o.r.rects.some((b) => rectDistance(a, b) <= 10))) ||
          (o.f !== f && r.rects.some((a) => o.r.rects.some((b) => rectsOverlap(a, b) || rectDistance(a, b) <= 4)))),
    );
    if (!nearby && wetRooms.length > 1) wet.push(`${f.name}: ${r.name} is far from every other wet room`);
  }
  add('plumbing', 'Plumbing is clustered', 'Kitchens, baths and laundry near each other (or stacked) share drain and supply lines.', wet);

  // stairs
  const stairs: string[] = [];
  for (let i = 1; i < L.floors.length; i++) {
    const a = L.floors[i - 1].rooms.filter((r) => r.type === 'stair');
    const b = L.floors[i].rooms.filter((r) => r.type === 'stair');
    for (const s of b)
      if (!a.some((t) => t.rects.length === s.rects.length && t.rects.every((r, k) => r.every((v, n) => near(v, s.rects[k][n])))))
        stairs.push(`${L.floors[i].name}: ${s.name} doesn't line up with a stair below`);
    if (!b.length) stairs.push(`${L.floors[i].name} has no stair`);
  }
  add('stairs', 'Stairs line up between floors', 'A stair has to land in the same spot on both floors.', stairs);

  // kitchen triangle
  const tri: string[] = [];
  for (const f of L.floors) {
    const t = kitchenTriangle(f);
    if (!t) continue;
    if (t.total > 26) tri.push(`${f.name}: work triangle is ${t.total.toFixed(1)}' (aim for 26' or less)`);
    if (Math.min(...t.legs) < 3) tri.push(`${f.name}: two appliances are crammed within 3' of each other`);
  }
  add('triangle', 'Kitchen work triangle', 'Sink, stove and fridge within a few steps of each other: total of the three legs ideally 13-26\'.', tri);

  return checks;
}
