/**
 * First-person 3D view of one floor. The whole floor is built at once, so
 * walking between rooms never loads anything. You can only edit furniture in
 * the room you are standing in: aim at a piece, click to pick it up, click to
 * put it down. Click a door to open or close it; click the stairs to change
 * floors. Everything here edits the same PlacedItem data as the plan.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { getFurniture } from '../data/furniture';
import { CEILING, carryRiders, itemBox, ridersOf, snapToWallMount, snapToWalls, type FitWarning, type PlacedItem, type Stack } from '../engine/furniture';
import { inRoom, type RDoor, type RFloor, type RRoom } from '../engine/resolve';
import type { Finishes, FloorFinish } from '../engine/finishes';
import { CEILING_FT, DOOR_HEAD_FT, STORY_FT, baseboards, canStand, doorLeaves, doorOpening, paintPanels, stairRun, wallBoxes, type Leaf } from '../engine/scene';
import type { Rect, RoomType } from '../engine/types';
import { ItemModel, material } from './models3d';
import { useSoftEnvironment } from './envMap';
import { Outdoors } from './Outdoors';
import { TILE, surfaceMaterial, worldBox, worldPlane, type Surface } from './textures';

export interface MoveUpdate {
  uid: string;
  x: number;
  y: number;
  rot: number;
  elev?: number;
}

export interface FloorLink {
  id: string;
  name: string;
  rooms: { id: string; type: RoomType; bbox: Rect }[];
}

interface Props {
  floor: RFloor;
  /** The floor underneath (drawn below so stairwells and windows look right). */
  below?: RFloor;
  /** All floors, bottom first, so the stairs know where they lead. */
  floors: FloorLink[];
  items: PlacedItem[];
  fit: Map<string, FitWarning[]>;
  stacks: Map<string, Stack>;
  selUid: string | null;
  /** Viewer height, inches. */
  person: number;
  spawnRoom: string | null;
  /** Exact arrival spot (after taking the stairs), plan feet + yaw degrees. */
  spawnAt: { x: number; y: number; yaw: number } | null;
  /** Saves open/closed doors per layout floor. */
  doorKey: string;
  /** Wall paint and floor finish per room (`${floorId}/${roomId}`). */
  finishes: Finishes;
  /** A piece just added from the palette: pick it up as soon as you click back in. */
  grabUid: string | null;
  onGrabbed: () => void;
  onRoom: (id: string) => void;
  onSelect: (uid: string | null) => void;
  onBeginEdit: () => void;
  onMoveMany: (ups: MoveUpdate[]) => void;
  onFloor: (floorId: string, at: { x: number; y: number; yaw: number }) => void;
}

const RADIUS = 0.75; // feet, how close you can get to a wall
const WALK = 4.5; // feet per second
const REACH = 30; // feet, how far you can pick things
const HOLD_MAX = 16; // feet, farthest a held piece goes when you look past the floor
const SENS_KEY = 'floorwise:v1:mouse';

const FLOOR_SURFACE: Partial<Record<RoomType, Surface>> = {
  kitchen: 'tile',
  bath: 'tile',
  powder: 'tile',
  laundry: 'tile',
  mudroom: 'tile',
  entry: 'tile',
  pantry: 'tile',
  garage: 'concrete',
  workshop: 'concrete',
  utility: 'concrete',
  porch: 'deck',
  deck: 'deck',
};

const FINISH_SURFACE: Record<FloorFinish, { s: Surface; tint?: string }> = {
  wood: { s: 'wood' },
  walnut: { s: 'wood', tint: '#86644a' },
  carpet: { s: 'carpet' },
  tile: { s: 'tile' },
  concrete: { s: 'concrete' },
};

export const roomAt = (floor: RFloor, x: number, y: number): RRoom | undefined =>
  floor.rooms.find((r) => r.type !== 'open-below' && inRoom({ x, y }, r, 0));

type Hover = { kind: 'item'; id: string } | { kind: 'door'; id: string } | { kind: 'stair'; id: string } | null;

function loadDoors(key: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

export default function Walk3D(p: Props) {
  const [locked, setLocked] = useState(false);
  /** Fallback when pointer lock isn't available: drag to look, click to pick. */
  const [free, setFree] = useState(false);
  const active = locked || free;
  const [room, setRoom] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [held, setHeld] = useState<string | null>(null);
  const [flash, setFlash] = useState('');
  const [sens, setSens] = useState(() => Number(localStorage.getItem(SENS_KEY)) || 1);
  /** Doors that are CLOSED (default: everything open), saved per floor. */
  const [doors, setDoors] = useState(() => ({ key: p.doorKey, map: loadDoors(p.doorKey) }));
  if (doors.key !== p.doorKey) setDoors({ key: p.doorKey, map: loadDoors(p.doorKey) });
  const closed = doors.key === p.doorKey ? doors.map : {};
  const lockRef = useRef<{ request: () => void } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(doors.key, JSON.stringify(doors.map));
    } catch {
      /* ignore */
    }
  }, [doors]);
  useEffect(() => {
    try {
      localStorage.setItem(SENS_KEY, String(sens));
    } catch {
      /* ignore */
    }
  }, [sens]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 2200);
    return () => clearTimeout(t);
  }, [flash]);

  const roomName = (id: string | null) => (id ? p.floor.roomById.get(id)?.name ?? '' : '');
  const fi = p.floors.findIndex((f) => f.id === p.floor.id);
  const stairTarget = (rid: string) => {
    const r = p.floor.roomById.get(rid);
    if (!r) return null;
    const match = (f: FloorLink | undefined) => f?.rooms.some((q) => q.type === 'stair' && Math.abs(q.bbox[0] - r.bbox[0]) < 0.6 && Math.abs(q.bbox[1] - r.bbox[1]) < 0.6);
    if (match(p.floors[fi + 1])) return { floor: p.floors[fi + 1], up: true };
    if (match(p.floors[fi - 1])) return { floor: p.floors[fi - 1], up: false };
    return null;
  };

  let aim: { title: string; hint: string } | null = null;
  if (active && hover && !held) {
    if (hover.kind === 'item') {
      const it = p.items.find((i) => i.uid === hover.id);
      const def = it && getFurniture(it.item);
      const r = it && roomAt(p.floor, it.x, it.y);
      if (def) aim = { title: def.name, hint: r?.id === room ? 'Click to pick up' : `In ${r?.name ?? 'another room'}: walk in to edit` };
    } else if (hover.kind === 'door') aim = { title: 'Door', hint: closed[hover.id] ? 'Click to open' : 'Click to close' };
    else {
      const t = stairTarget(hover.id);
      aim = { title: 'Stairs', hint: t ? `Click to go ${t.up ? 'up' : 'down'} to the ${t.floor.name.toLowerCase()}` : 'These stairs lead nowhere in this plan' };
    }
  }
  const heldDef = held ? getFurniture(p.items.find((i) => i.uid === held)?.item ?? '') : undefined;
  const focus = held ?? p.selUid;
  const warns = focus ? p.fit.get(focus) ?? [] : [];

  return (
    <div className="walk">
      <Canvas camera={{ fov: 72, near: 0.05, far: 2000 }}>
        <Scene
          {...p}
          room={room}
          held={held}
          closed={closed}
          sens={sens}
          lockRef={lockRef}
          setLocked={setLocked}
          free={free}
          setFree={setFree}
          setRoom={(id) => {
            setRoom(id);
            setPending(null);
            p.onRoom(id);
          }}
          setPending={setPending}
          setHover={setHover}
          setHeld={setHeld}
          setFlash={setFlash}
          toggleDoor={(id) => setDoors((s) => ({ ...s, map: { ...s.map, [id]: !s.map[id] } }))}
          stairTarget={stairTarget}
        />
      </Canvas>
      {active && <div className="crosshair" />}
      <div className="walk-hud">
        <div className="walk-chip">
          {pending ? (
            <>Entering {roomName(pending)}…</>
          ) : (
            <>
              In <b>{roomName(room)}</b>
              <span className="muted"> · you can edit this room</span>
            </>
          )}
        </div>
        {aim && (
          <div className="walk-aim">
            <b>{aim.title}</b>
            <span>{aim.hint}</span>
          </div>
        )}
        {held && heldDef && (
          <div className="walk-aim held">
            <b>Holding {heldDef.name}</b>
            <span>
              Click to put down · R / Shift+R turn 90° · Q / E turn 15° · Del remove · Alt no snapping
              {heldDef.mount === 'wall' ? ' · aim higher or lower to change its height' : ''}
            </span>
          </div>
        )}
        {warns.length > 0 && (
          <div className="walk-warns">
            {warns.map((w, i) => (
              <span key={i} className={`fit-row ${w.level}`}>
                {w.msg}
              </span>
            ))}
          </div>
        )}
        {flash && <div className="walk-flash">{flash}</div>}
      </div>
      {free && <div className="walk-free-hint">Drag to look · click to pick up / put down · Esc to stop</div>}
      {!active && (
        <div className="walk-start" onClick={() => lockRef.current?.request()}>
          <div className="walk-card" onClick={(e) => e.stopPropagation()}>
            <h3>Walk through {p.floor.name.toLowerCase()}</h3>
            <p>
              <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to walk, <kbd>Shift</kbd> to hurry, the mouse to look.
            </p>
            <p>Aim at furniture in the room you're standing in and click to pick it up, then click again to put it down. Click doors to open or close them, and stairs to change floors.</p>
            <label className="sens">
              Mouse speed
              <input type="range" min={0.3} max={2.5} step={0.1} value={sens} onChange={(e) => setSens(Number(e.target.value))} />
              <span>{sens.toFixed(1)}×</span>
            </label>
            <button className="walk-go" onClick={() => lockRef.current?.request()}>
              Start walking
            </button>
            <p className="muted">
              <kbd>Esc</kbd> gives the cursor back, so you can use the furniture palette and inspector.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface SceneProps extends Props {
  room: string | null;
  held: string | null;
  closed: Record<string, boolean>;
  sens: number;
  lockRef: React.MutableRefObject<{ request: () => void } | null>;
  setLocked: (b: boolean) => void;
  free: boolean;
  setFree: (b: boolean) => void;
  setRoom: (id: string) => void;
  setPending: (id: string | null) => void;
  setHover: (h: Hover) => void;
  setHeld: (uid: string | null) => void;
  setFlash: (s: string) => void;
  toggleDoor: (id: string) => void;
  stairTarget: (rid: string) => { floor: FloorLink; up: boolean } | null;
}

interface Grab {
  uid: string;
  /** Offset from the aim point to the piece's center (plan feet). */
  ox: number;
  oy: number;
  /** Height of the plane the piece slides on (world feet). */
  planeY: number;
  /** Wall pieces: piece bottom minus the aimed height (feet). */
  dy: number;
  riders: PlacedItem[];
  from: { x: number; y: number; rot: number };
  last: string;
}

function Scene(p: SceneProps) {
  const { camera, gl } = useThree();
  useSoftEnvironment(0.3);
  const { floor } = p;
  const boxes = useMemo(() => wallBoxes(floor), [floor]);
  const fi = p.floors.findIndex((f) => f.id === floor.id);
  // stair rooms on this floor that are holes (the flight comes up from below)
  const stairHoles = useMemo(() => floor.rooms.filter((r) => r.type === 'stair' && p.stairTarget(r.id)?.up === false).map((r) => r.id), [floor]); // eslint-disable-line react-hooks/exhaustive-deps
  const wallRects = useMemo(() => boxes.filter((b) => b.y0 === 0 && b.kind === 'wall').map((b) => b.rect), [boxes]);
  const closedRects = useMemo(() => floor.doors.filter((d) => p.closed[d.id] && d.kind !== 'open' && !d.full).map((d) => doorOpening(d, floor)), [floor, p.closed]);
  const solid = useMemo(() => [...wallRects, ...closedRects], [wallRects, closedRects]);
  const itemsGroup = useRef<THREE.Group>(null);
  const doorsGroup = useRef<THREE.Group>(null);
  const stairsGroup = useRef<THREE.Group>(null);
  const wallsGroup = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const live = useRef(p); // latest props for event handlers and the frame loop
  live.current = p;
  const roomTimer = useRef<{ id: string; t: number } | null>(null);
  const grab = useRef<Grab | null>(null);
  const look = useRef({ yaw: 0, pitch: 0, skip: 0, avg: 0 });
  const eye = (p.person - 4.5) / 12;
  const lockedNow = () => document.pointerLockElement === gl.domElement;
  const isActive = () => lockedNow() || live.current.free;
  const can = (x: number, y: number) => canStand(live.current.floor, solidRef.current, x, y, RADIUS, stairHoles);
  const solidRef = useRef(solid);
  solidRef.current = solid;

  // Spawn: an exact spot after taking the stairs, else the middle of the chosen room (or the biggest one).
  useEffect(() => {
    let x: number, y: number, yaw = 0;
    if (p.spawnAt) ({ x, y, yaw } = p.spawnAt);
    else {
      const start =
        (p.spawnRoom && floor.roomById.get(p.spawnRoom)) || [...floor.rooms].filter((r) => !r.outdoor && r.type !== 'open-below').sort((a, b) => b.area - a.area)[0];
      ({ x, y } = start.labelAt);
    }
    if (!can(x, y)) {
      outer: for (let r = 0.5; r < 8; r += 0.5)
        for (let a = 0; a < 12; a++) {
          const tx = x + Math.cos((a * Math.PI) / 6) * r,
            ty = y + Math.sin((a * Math.PI) / 6) * r;
          if (can(tx, ty)) {
            [x, y] = [tx, ty];
            break outer;
          }
        }
    }
    const cam = new URLSearchParams(location.search).get('cam')?.split(',').map(Number);
    if (cam && cam.length >= 2 && cam.every(Number.isFinite)) [x, y, yaw] = [cam[0], cam[1], cam[2] ?? 0];
    camera.position.set(x, eye, y);
    look.current.yaw = (-yaw * Math.PI) / 180;
    look.current.pitch = cam?.[3] !== undefined ? (cam[3] * Math.PI) / 180 : 0;
    const r = roomAt(floor, x, y);
    if (r) p.setRoom(r.id);
  }, [floor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    camera.position.y = eye;
  }, [eye, camera]);

  // Mouse look with pointer lock. Our own handler (not three's PointerLockControls) so we can
  // drop the bogus giant mouse deltas some browsers report, which used to spin the view.
  useEffect(() => {
    const el = gl.domElement;
    let timer = 0;
    let lastUnlock = 0;
    let retried = false;
    const request = () => {
      // Browsers refuse a new lock for about a second after Esc: wait it out instead of failing.
      const wait = 1300 - (performance.now() - lastUnlock);
      if (wait > 0) {
        clearTimeout(timer);
        timer = window.setTimeout(request, wait);
        return;
      }
      const refused = (err?: { name?: string }) => {
        if (err?.name === 'NotSupportedError' || err?.name === 'WrongDocumentError' || !el.requestPointerLock) return fallback();
        if (!retried) {
          retried = true;
          clearTimeout(timer);
          timer = window.setTimeout(request, 1200);
        } else fallback();
      };
      const plain = () => (el.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(refused);
      try {
        // raw mouse input avoids OS acceleration (and the worst of the spikes) where supported
        const r = (el.requestPointerLock as (o?: object) => Promise<void> | undefined)({ unadjustedMovement: true });
        r?.catch?.(() => plain());
      } catch {
        plain();
      }
      // Some browsers refuse pointer lock without saying so; cancelled as soon as the lock arrives.
      clearTimeout(timer);
      timer = window.setTimeout(() => !lockedNow() && fallback(), 2000);
    };
    const fallback = () => {
      if (lockedNow() || live.current.free) return;
      live.current.setFree(true);
      onStart();
    };
    p.lockRef.current = { request };
    const onStart = () => {
      look.current.skip = 2; // the first deltas after locking are often garbage
      const g = live.current.grabUid;
      if (g) {
        live.current.onGrabbed();
        const it = live.current.items.find((i) => i.uid === g);
        if (it) startHold(it, null);
      }
    };
    const onChange = () => {
      const on = lockedNow();
      clearTimeout(timer);
      p.setLocked(on);
      if (on) {
        retried = false;
        live.current.setFree(false);
        onStart();
      } else {
        lastUnlock = performance.now();
        endHold();
      }
    };
    const onMove = (e: MouseEvent) => {
      if (!lockedNow()) return;
      if (look.current.skip > 0) {
        look.current.skip--;
        return;
      }
      const dx = e.movementX,
        dy = e.movementY;
      // Some browsers occasionally report a huge bogus jump. A real flick ramps up over a few
      // events, so only drop a delta that is far bigger than the recent average.
      const mag = Math.max(Math.abs(dx), Math.abs(dy));
      const lim = Math.max(250, look.current.avg * 4);
      look.current.avg = look.current.avg * 0.7 + Math.min(mag, lim) * 0.3;
      if (mag > lim) return;
      turn(dx, dy);
    };
    document.addEventListener('pointerlockchange', onChange);
    document.addEventListener('mousemove', onMove);
    return () => {
      document.removeEventListener('pointerlockchange', onChange);
      document.removeEventListener('mousemove', onMove);
      clearTimeout(timer);
      if (lockedNow()) document.exitPointerLock();
    };
  }, [camera, gl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dev-only test hook: lets the end-to-end script read where you are and what you hold.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __walk: object }).__walk = {
      cam: () => ({ x: camera.position.x, y: camera.position.z, yaw: look.current.yaw, pitch: look.current.pitch }),
      held: () => grab.current?.uid ?? null,
      pick: () => pick()?.hover ?? null,
      active: () => isActive(),
      setLook: (yawDeg: number, pitchDeg: number) => {
        look.current.yaw = (-yawDeg * Math.PI) / 180;
        look.current.pitch = (pitchDeg * Math.PI) / 180;
      },
      setPos: (x: number, y: number) => camera.position.set(x, camera.position.y, y),
    };
  }, [camera]);

  function turn(dx: number, dy: number) {
    const k = 0.0022 * live.current.sens;
    look.current.yaw -= dx * k;
    look.current.pitch = Math.max(-1.5, Math.min(1.5, look.current.pitch - dy * k));
  }

  // Keys for walking. (R, Q, E, Delete are handled by the app and act on the selected piece.)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keys.current.add(e.code);
      if (e.code === 'Delete' || e.code === 'Backspace') endHold();
      if (e.code === 'Escape' && live.current.free) {
        endHold();
        live.current.setFree(false);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ray = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const aimRay = () => {
    ray.setFromCamera(center, camera);
    return ray.ray;
  };

  /** Point where the aim ray meets the horizontal plane y (world), capped at HOLD_MAX horizontally. */
  function aimOnPlane(y: number): { x: number; y: number } {
    const { origin: o, direction: d } = aimRay();
    const h = Math.hypot(d.x, d.z) || 1e-6;
    let t = Math.abs(d.y) > 1e-4 ? (y - o.y) / d.y : Infinity;
    if (!(t > 0) || t * h > HOLD_MAX) t = HOLD_MAX / h;
    return { x: o.x + d.x * t, y: o.z + d.z * t };
  }

  /** Where the aim ray first meets a wall: plan point just in front of it, and the height there (world feet). */
  function aimWall(): { x: number; y: number; h: number } | null {
    const { origin: o, direction: dir } = aimRay();
    const h = Math.hypot(dir.x, dir.z);
    if (h < 1e-4) return null;
    const dx = dir.x / h,
      dz = dir.z / h;
    let best = REACH;
    for (const [x, y, w, d] of wallRects) {
      const tx1 = (x - o.x) / dx,
        tx2 = (x + w - o.x) / dx;
      const tz1 = (y - o.z) / dz,
        tz2 = (y + d - o.z) / dz;
      const t0 = Math.max(Math.min(tx1, tx2), Math.min(tz1, tz2));
      const t1 = Math.min(Math.max(tx1, tx2), Math.max(tz1, tz2));
      if (t1 >= Math.max(t0, 0) && t0 > 0 && t0 < best) best = t0;
    }
    if (best >= REACH) return null;
    return { x: o.x + dx * (best - 0.05), y: o.z + dz * (best - 0.05), h: o.y + (dir.y / h) * best };
  }

  /** What's under the crosshair: the nearest piece, door or stair. */
  function pick(): { hover: Hover; point: THREE.Vector3 } | null {
    aimRay();
    ray.far = REACH;
    // walls are in the list too, so you can't aim through them
    const groups = [itemsGroup.current, doorsGroup.current, stairsGroup.current, wallsGroup.current].filter((g): g is THREE.Group => !!g);
    const hits = ray.intersectObjects(groups, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.pick && !o.userData.wall) o = o.parent;
      if (!o || o.userData.wall) return null;
      return { hover: o.userData.pick as Hover, point: h.point };
    }
    return null;
  }

  function startHold(it: PlacedItem, point: THREE.Vector3 | null) {
    const L = live.current;
    const def = getFurniture(it.item);
    const st = L.stacks.get(it.uid);
    if (!def || !st) return;
    const base = st.elev / 12;
    L.onBeginEdit();
    L.onSelect(it.uid);
    // wall pieces follow where you aim on the wall behind them, so measure the offset there
    const w = def.mount === 'wall' && point ? aimWall() : null;
    const ref = w ? { x: w.x, y: w.y, h: w.h } : point ? { x: point.x, y: point.z, h: point.y } : null;
    grab.current = {
      uid: it.uid,
      ox: ref ? it.x - ref.x : 0,
      oy: ref ? it.y - ref.y : 0,
      planeY: point ? point.y : base,
      dy: ref ? base - ref.h : -def.h / 24,
      riders: ridersOf(L.floor, L.items, it.uid),
      from: { x: it.x, y: it.y, rot: it.rot },
      last: '',
    };
    L.setHeld(it.uid);
  }
  function endHold() {
    grab.current = null;
    live.current.setHeld(null);
  }

  // Click while walking: pick up / put down, open a door, take the stairs.
  function clickAction() {
    const L = live.current;
    if (grab.current) return endHold();
    const hit = pick();
    if (!hit?.hover) return;
    const h = hit.hover;
    if (h.kind === 'door') {
      const d = L.floor.doors.find((x) => x.id === h.id);
      if (d && !L.closed[d.id]) {
        const [x, y, w, dd] = doorOpening(d, L.floor);
        const dx = Math.max(x - camera.position.x, 0, camera.position.x - (x + w));
        const dz = Math.max(y - camera.position.z, 0, camera.position.z - (y + dd));
        if (Math.hypot(dx, dz) < RADIUS + 0.1) return L.setFlash('Step out of the doorway to close it.');
      }
      return L.toggleDoor(h.id);
    }
    if (h.kind === 'stair') {
      const t = L.stairTarget(h.id);
      const r = L.floor.roomById.get(h.id);
      if (!t || !r) return;
      const run = stairRun(r);
      const [x, y, w, d] = r.bbox;
      // arrive just past the top (going up) or the bottom (going down) of the flight
      const out = 1.6;
      const at = t.up
        ? run.uy
          ? { x: x + w / 2, y: y - out, yaw: 0 }
          : { x: x + w + out, y: y + d / 2, yaw: 90 }
        : run.uy
          ? { x: x + w / 2, y: y + d + out, yaw: 180 }
          : { x: x - out, y: y + d / 2, yaw: 270 };
      endHold();
      return L.onFloor(t.floor.id, at);
    }
    const it = L.items.find((i) => i.uid === h.id);
    if (!it) return;
    const r = roomAt(L.floor, it.x, it.y);
    if (r?.id !== L.room) {
      L.setFlash(`That's in the ${r?.name ?? 'next room'}. Walk in there to edit it.`);
      return;
    }
    startHold(it, hit.point);
  }
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button === 0 && lockedNow()) clickAction();
    };
    document.addEventListener('mousedown', onDown);
    // drag-to-look fallback
    const el = gl.domElement;
    let start: { x: number; y: number; lx: number; ly: number; moved: boolean } | null = null;
    const pd = (e: PointerEvent) => {
      if (!live.current.free || e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
      el.setPointerCapture(e.pointerId);
    };
    const pm = (e: PointerEvent) => {
      if (!start || !live.current.free) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) start.moved = true;
      turn(e.clientX - start.lx, e.clientY - start.ly);
      start.lx = e.clientX;
      start.ly = e.clientY;
    };
    const pu = () => {
      if (start && !start.moved && live.current.free) clickAction();
      start = null;
    };
    el.addEventListener('pointerdown', pd);
    el.addEventListener('pointermove', pm);
    el.addEventListener('pointerup', pu);
    return () => {
      document.removeEventListener('mousedown', onDown);
      el.removeEventListener('pointerdown', pd);
      el.removeEventListener('pointermove', pm);
      el.removeEventListener('pointerup', pu);
    };
  }, [gl, camera]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Keep a point inside the room being edited (nearest point, slightly inset). */
  function clampToRoom(room: RRoom, x: number, y: number): { x: number; y: number } {
    if (inRoom({ x, y }, room, 0)) return { x, y };
    let best = { x, y, d: Infinity };
    for (const [rx, ry, rw, rh] of room.rects) {
      const m = 0.3;
      const cx = Math.min(Math.max(x, rx + m), rx + rw - m),
        cy = Math.min(Math.max(y, ry + m), ry + rh - m);
      const d = Math.hypot(cx - x, cy - y);
      if (d < best.d) best = { x: cx, y: cy, d };
    }
    return { x: best.x, y: best.y };
  }

  const fwd = useMemo(() => new THREE.Vector3(), []);
  const frame = useRef(0);
  const hoverRef = useRef('');
  useFrame((_, dtRaw) => {
    const L = live.current;
    const dt = Math.min(dtRaw, 0.05);
    const on = isActive();
    camera.rotation.set(look.current.pitch, look.current.yaw, 0, 'YXZ');
    camera.updateMatrixWorld();

    // walk
    if (on) {
      const k = keys.current;
      const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      const s = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      if (f || s) {
        camera.getWorldDirection(fwd);
        fwd.y = 0;
        fwd.normalize();
        const speed = WALK * (k.has('ShiftLeft') || k.has('ShiftRight') ? 2 : 1) * dt;
        const len = Math.hypot(f, s);
        const dx = ((fwd.x * f - fwd.z * s) / len) * speed;
        const dz = ((fwd.z * f + fwd.x * s) / len) * speed;
        const { x, z } = camera.position;
        // if you're somehow stuck (a door closed on you), let any move inside the house through
        const ok = can(x, z) ? can : (px: number, py: number) => canStand(L.floor, [], px, py, 0.05, stairHoles);
        if (ok(x + dx, z + dz)) camera.position.set(x + dx, camera.position.y, z + dz);
        else if (ok(x + dx, z)) camera.position.x = x + dx;
        else if (ok(x, z + dz)) camera.position.z = z + dz;
        camera.updateMatrixWorld();
      }
    }

    // which room am I in? switch editing after a short settle so doorway wobble doesn't flip it
    const here = roomAt(L.floor, camera.position.x, camera.position.z);
    if (here && here.id !== L.room) {
      const now = performance.now();
      if (!roomTimer.current || roomTimer.current.id !== here.id) {
        roomTimer.current = { id: here.id, t: now };
        L.setPending(here.id);
      } else if (now - roomTimer.current.t > 400) {
        roomTimer.current = null;
        endHold();
        L.setRoom(here.id);
      }
    } else if (roomTimer.current && here?.id === L.room) {
      roomTimer.current = null;
      L.setPending(null);
    }

    // move what you're holding: it stays exactly under the spot you grabbed it by
    const g = grab.current;
    if (g && on) {
      const it = L.items.find((i) => i.uid === g.uid);
      const def = it && getFurniture(it.item);
      const editRoom = L.room ? L.floor.roomById.get(L.room) : undefined;
      if (!it || !def || !editRoom) return endHold();
      const alt = keys.current.has('AltLeft') || keys.current.has('AltRight');
      const inch = 1 / 12;
      let x: number,
        y: number,
        rot = it.rot,
        elev: number | undefined;
      if (def.mount === 'wall') {
        const w = aimWall();
        if (!w) return;
        ({ x, y } = clampToRoom(editRoom, w.x + g.ox, w.y + g.oy));
        elev = Math.round(Math.min(CEILING - def.h, Math.max(0, (w.h + g.dy) * 12)));
        if (!alt) ({ x, y, rot } = snapToWallMount(L.floor, itemBox({ ...it, x, y }, def)));
      } else {
        const a = aimOnPlane(g.planeY);
        ({ x, y } = clampToRoom(editRoom, a.x + g.ox, a.y + g.oy));
        if (!alt) ({ x, y } = snapToWalls(L.floor, itemBox({ ...it, x, y }, def)));
      }
      x = Math.round(x / inch) * inch;
      y = Math.round(y / inch) * inch;
      const sig = `${x.toFixed(3)},${y.toFixed(3)},${rot},${elev ?? ''}`;
      if (sig !== g.last) {
        g.last = sig;
        const to = { x, y, rot };
        L.onMoveMany([{ uid: it.uid, ...to, ...(elev !== undefined ? { elev } : {}) }, ...carryRiders(g.riders, g.from, to)]);
      }
    }

    // what am I looking at (every few frames is plenty)
    if (on && ++frame.current % 4 === 0) {
      const h = g ? null : pick()?.hover ?? null;
      const key = h ? `${h.kind}:${h.id}` : '';
      if (key !== hoverRef.current) {
        hoverRef.current = key;
        L.setHover(h);
      }
    }
  });

  // --- static geometry (built once per floor) ---------------------------------
  const geo = useMemo(() => {
    const walls = boxes.filter((b) => b.kind === 'wall' || b.kind === 'header').map((b) => worldBox(b.rect[0], b.y0, b.rect[1], b.rect[2], b.y1 - b.y0, b.rect[3], TILE.plaster));
    const trims = boxes.filter((b) => b.kind === 'trim').map((b) => worldBox(b.rect[0], b.y0, b.rect[1], b.rect[2], b.y1 - b.y0, b.rect[3], 4));
    const glass = boxes.filter((b) => b.kind === 'glass');
    const base = baseboards(floor, boxes).map((r) => worldBox(r[0], 0, r[1], r[2], 4 / 12, r[3], 4));
    const panels = paintPanels(floor, boxes).map((pn) => ({ room: pn.room, g: worldBox(pn.rect[0], pn.y0, pn.rect[1], pn.rect[2], pn.y1 - pn.y0, pn.rect[3], TILE.plaster) }));
    const floors: { g: THREE.BufferGeometry; s: Surface; room: string }[] = [];
    const ceilings: THREE.BufferGeometry[] = [];
    for (const r of floor.rooms) {
      if (r.type === 'open-below' || stairHoles.includes(r.id)) continue;
      const s = FLOOR_SURFACE[r.type] ?? 'wood';
      const goesUp = r.type === 'stair' && !stairHoles.includes(r.id);
      for (const q of r.rects) {
        floors.push({ g: worldBox(q[0], -0.1, q[1], q[2], 0.1, q[3], TILE[s]), s, room: r.id });
        if (!r.outdoor && !goesUp) ceilings.push(worldPlane(q[0], q[1], q[2], q[3], CEILING_FT, TILE.ceiling, true));
      }
    }
    return { walls, trims, glass, base, floors, ceilings, panels };
  }, [boxes, floor, stairHoles]);
  // free the GPU buffers when the floor changes (taking the stairs rebuilds everything)
  useEffect(
    () => () => disposeAll([...geo.walls, ...geo.trims, ...geo.base, ...geo.ceilings, ...geo.floors.map((f) => f.g), ...geo.panels.map((x) => x.g)]),
    [geo],
  );

  const plaster = surfaceMaterial('plaster');
  const trimMat = material('#f4f2ee', '', 'gloss');

  return (
    <>
      {/* neutral studio lighting: enough contrast to read corners, no real light sources yet */}
      <hemisphereLight args={['#ffffff', '#8f877d', 0.9]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[30, 45, 18]} intensity={1.0} />
      <directionalLight position={[-25, 20, -30]} intensity={0.35} />

      <Outdoors floor={p.below ?? floor} groundY={-fi * STORY_FT} />
      {p.below && <LowerFloor floor={p.below} />}

      {geo.floors.map((f, i) => {
        const fin = p.finishes[`${floor.id}/${f.room}`]?.floor;
        const look = fin ? FINISH_SURFACE[fin] : { s: f.s };
        // the geometry's UVs were made for the default surface's tile size; re-tile when the finish changes it
        const g = fin && TILE[look.s] !== TILE[f.s] ? retile(f.g, TILE[f.s] / TILE[look.s]) : f.g;
        return <mesh key={`f${i}`} geometry={g} material={surfaceMaterial(look.s, { tint: look.tint })} />;
      })}
      {geo.panels.map((pn, i) => {
        const paint = p.finishes[`${floor.id}/${pn.room}`]?.paint;
        return <mesh key={`p${i}`} geometry={pn.g} material={paint ? surfaceMaterial('paint', { tint: paint }) : plaster} />;
      })}
      {geo.ceilings.map((g, i) => (
        <mesh key={`c${i}`} geometry={g} material={surfaceMaterial('ceiling')} />
      ))}
      <group ref={wallsGroup} userData={{ wall: true }}>
        {geo.walls.map((g, i) => (
          <mesh key={`w${i}`} geometry={g} material={plaster} />
        ))}
      </group>
      {geo.trims.map((g, i) => (
        <mesh key={`t${i}`} geometry={g} material={trimMat} />
      ))}
      {geo.base.map((g, i) => (
        <mesh key={`b${i}`} geometry={g} material={trimMat} />
      ))}
      {geo.glass.map((b, i) => (
        <mesh key={`g${i}`} position={[b.rect[0] + b.rect[2] / 2, (b.y0 + b.y1) / 2, b.rect[1] + b.rect[3] / 2]} scale={[b.rect[2], b.y1 - b.y0, b.rect[3]]} material={material('#cfe3ef', '', 'glass')}>
          <boxGeometry />
        </mesh>
      ))}

      {/* stairs: the flight on the floor it starts from; a hole on the floor it reaches */}
      <group ref={stairsGroup}>
        {floor.rooms
          .filter((r) => r.type === 'stair')
          .map((r) => (
            <Stairs key={r.id} room={r} down={stairHoles.includes(r.id)} />
          ))}
      </group>

      {/* doors */}
      <group ref={doorsGroup}>
        {floor.doors.map((d) => (
          <Door key={d.id} d={d} floor={floor} closed={!!p.closed[d.id]} />
        ))}
      </group>

      {/* built-in fixtures */}
      {floor.fixtures.map((f) => (
        <group key={f.id} position={[f.cx, 0, f.cy]} rotation={[0, (-f.rot * Math.PI) / 180, 0]}>
          <ItemModel def={f.def} w={f.w * 12} d={f.d * 12} />
        </group>
      ))}

      {/* furniture */}
      <group ref={itemsGroup}>
        {p.items.map((it) => {
          const def = getFurniture(it.item);
          const st = p.stacks.get(it.uid);
          if (!def || !st) return null;
          const warns = p.fit.get(it.uid);
          const inRoomNow = roomAt(floor, it.x, it.y)?.id === p.room;
          const tint =
            it.uid === p.held
              ? warns?.some((w) => w.level === 'block')
                ? '#ff3b30'
                : warns
                  ? '#f5a524'
                  : '#4cc38a'
              : inRoomNow && warns?.some((w) => w.level === 'block')
                ? '#7a1f1c'
                : it.uid === p.selUid
                  ? '#e5484d'
                  : '';
          return (
            <group key={it.uid} userData={{ pick: { kind: 'item', id: it.uid } }} position={[it.x, st.elev / 12, it.y]} rotation={[0, (-it.rot * Math.PI) / 180, 0]}>
              <ItemModel def={def} w={def.w} d={def.d} tint={tint} color={it.color} />
            </group>
          );
        })}
      </group>
    </>
  );
}

const retiled = new WeakMap<THREE.BufferGeometry, Map<number, THREE.BufferGeometry>>();

/** Dispose geometries (and any re-tiled copies made from them). */
function disposeAll(list: THREE.BufferGeometry[]) {
  for (const g of list) {
    retiled.get(g)?.forEach((c) => c.dispose());
    retiled.delete(g);
    g.dispose();
  }
}
/** A copy of a geometry with its UVs scaled (cached). */
function retile(g: THREE.BufferGeometry, k: number): THREE.BufferGeometry {
  let m = retiled.get(g);
  if (!m) retiled.set(g, (m = new Map()));
  let out = m.get(k);
  if (!out) {
    out = g.clone();
    const uv = out.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
    uv.needsUpdate = true;
    m.set(k, out);
  }
  return out;
}

/** The floor underneath, drawn one story down without furniture: floors, walls and window glass. */
function LowerFloor({ floor }: { floor: RFloor }) {
  const geo = useMemo(() => {
    const boxes = wallBoxes(floor);
    const walls = boxes.filter((b) => b.kind !== 'glass').map((b) => worldBox(b.rect[0], b.y0 - STORY_FT, b.rect[1], b.rect[2], b.y1 - b.y0, b.rect[3], TILE.plaster));
    // floor slabs, plus the structure between the stories under the upper floor
    const floors = floor.rooms
      .filter((r) => r.type !== 'open-below')
      .flatMap((r) => r.rects.map((q) => ({ g: worldBox(q[0], -STORY_FT - 0.1, q[1], q[2], 0.1, q[3], TILE[FLOOR_SURFACE[r.type] ?? 'wood']), s: FLOOR_SURFACE[r.type] ?? ('wood' as Surface) })));
    return { walls, floors };
  }, [floor]);
  useEffect(() => () => disposeAll([...geo.walls, ...geo.floors.map((f) => f.g)]), [geo]);
  return (
    <group>
      {geo.walls.map((g, i) => (
        <mesh key={i} geometry={g} material={surfaceMaterial('plaster')} />
      ))}
      {geo.floors.map((f, i) => (
        <mesh key={`f${i}`} geometry={f.g} material={surfaceMaterial(f.s)} />
      ))}
    </group>
  );
}

/** A flight of stairs: solid steps climbing STORY_FT; drawn below the floor when this is the top floor. */
function Stairs({ room, down }: { room: RRoom; down: boolean }) {
  const run = stairRun(room);
  const [x, y, w, d] = room.bbox;
  const len = run.uy ? d : w;
  const n = run.steps;
  const tread = len / n,
    rise = STORY_FT / n;
  const y0 = down ? -STORY_FT : 0;
  const steps = Array.from({ length: n }, (_, k) => {
    // climbing north (uy = -1): step k sits k treads up from the south end
    const along = k * tread;
    const top = y0 + (k + 1) * rise;
    const rect: Rect = run.uy ? [x + 0.1, y + d - along - tread, w - 0.2, tread] : [x + along, y + 0.1, tread, d - 0.2];
    return { rect, top };
  });
  return (
    <group userData={{ pick: { kind: 'stair', id: room.id } }}>
      {down && (
        // the stairwell opening at floor level is clickable too, so you don't have to aim down the flight
        <mesh position={[x + w / 2, 0, y + d / 2]} scale={[w, 0.1, d]} material={HIDDEN}>
          <boxGeometry />
        </mesh>
      )}
      {steps.map((s, i) => (
        <group key={i}>
          <mesh position={[s.rect[0] + s.rect[2] / 2, (y0 + s.top) / 2, s.rect[1] + s.rect[3] / 2]} scale={[s.rect[2], s.top - y0, s.rect[3]]} material={material('#efece6', '', 'paper')}>
            <boxGeometry />
          </mesh>
          <mesh position={[s.rect[0] + s.rect[2] / 2, s.top + 0.02, s.rect[1] + s.rect[3] / 2]} scale={[s.rect[2] + 0.04, 0.06, s.rect[3] + 0.04]} material={material('#a47b55', '', 'wood')}>
            <boxGeometry />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const HIDDEN = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });

/** One door: swing leaves animate around their hinges, sliders slide, garage doors roll up. */
function Door({ d, floor, closed }: { d: RDoor; floor: RFloor; closed: boolean }) {
  const leaves = useMemo(() => doorLeaves(d), [d]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const slide = useRef<THREE.Group | null>(null);
  const opening = useMemo(() => doorOpening(d, floor), [d, floor]);
  const exterior = d.a === 'outside' || d.b === 'outside';
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 7);
    leaves.forEach((lf, i) => {
      const g = refs.current[i];
      if (!g) return;
      const target = closed ? lf.closed : lf.open;
      let diff = target - g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      g.rotation.y += diff * k;
    });
    if (slide.current) {
      const t = closed ? 0 : 1;
      slide.current.userData.t = (slide.current.userData.t ?? t) + (t - (slide.current.userData.t ?? t)) * k;
      const u = slide.current.userData.t as number;
      if (d.kind === 'garage') {
        slide.current.position.y = u * (DOOR_HEAD_FT + 0.6 - 0.3);
        slide.current.scale.y = 1 - u * 0.92;
      } else {
        const off = u * (d.width - 0.4) * (d.kind === 'pocket' ? 1 : 0.92);
        if (d.seg.o === 'h') slide.current.position.x = off;
        else slide.current.position.z = off;
      }
    }
  });
  if (d.kind === 'open') return null;
  const pickData = { pick: { kind: 'door', id: d.id } };
  // an invisible target filling the doorway, so an open door (seen edge-on) is still easy to click,
  // plus a painted casing around the opening
  const [ox, oy, ow, od] = opening;
  const alongH = d.seg.o === 'h';
  const headY = d.kind === 'garage' ? 84 / 12 : DOOR_HEAD_FT;
  const cas = 3 / 12,
    lip = 0.06;
  const casing = (
    <>
      {[0, 1].map((end) => {
        const a = end ? (alongH ? ox + ow : oy + od) : alongH ? ox : oy;
        const sgn = end ? 1 : -1;
        const [px, pz] = alongH ? [a + (sgn * cas) / 2 - sgn * 0.02, oy + od / 2] : [ox + ow / 2, a + (sgn * cas) / 2 - sgn * 0.02];
        const [sx, sz] = alongH ? [cas, od + lip] : [ow + lip, cas];
        return (
          <mesh key={end} position={[px, headY / 2, pz]} scale={[sx, headY, sz]} material={material('#f4f2ee', '', 'gloss')}>
            <boxGeometry />
          </mesh>
        );
      })}
      <mesh position={[ox + ow / 2, headY + cas / 2, oy + od / 2]} scale={alongH ? [ow + 2 * cas, cas, od + lip] : [ow + lip, cas, od + 2 * cas]} material={material('#f4f2ee', '', 'gloss')}>
        <boxGeometry />
      </mesh>
    </>
  );
  const target = (
    <mesh position={[ox + ow / 2, headY / 2, oy + od / 2]} scale={[ow, headY, od]} material={HIDDEN}>
      <boxGeometry />
    </mesh>
  );
  if (leaves.length) {
    const thick = 1.4 / 12;
    return (
      <group userData={pickData}>
        {casing}
        {target}
        {leaves.map((lf: Leaf, i) => (
          <group key={i} ref={(el) => (refs.current[i] = el)} position={[lf.hx, 0, lf.hy]} rotation={[0, lf.open, 0]}>
            <mesh position={[lf.len / 2, DOOR_HEAD_FT / 2, 0]} scale={[lf.len - 0.04, DOOR_HEAD_FT - 0.04, thick]} material={material(exterior ? '#6b4a33' : '#f1eee8', '', exterior ? 'wood' : 'gloss')}>
              <boxGeometry />
            </mesh>
            {/* knob on both faces */}
            <mesh position={[lf.len - 0.25, 3, 0]} scale={[0.18, 0.18, thick + 0.18]} material={material('#b8b2a6', '', 'metal')}>
              <sphereGeometry args={[0.5, 12, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  // sliding, pocket, garage
  const [x, y, w, dd] = opening;
  const along = d.seg.o === 'h';
  const panelH = d.kind === 'garage' ? 84 / 12 : DOOR_HEAD_FT;
  const glass = exterior && d.kind === 'slide';
  return (
    <group userData={pickData}>
      {casing}
      {target}
      <group ref={slide}>
        <mesh
          position={[x + w / 2, panelH / 2, y + dd / 2]}
          scale={[along ? w - 0.05 : Math.min(w, 0.15), panelH - 0.05, along ? Math.min(dd, 0.15) : dd - 0.05]}
          material={material(glass ? '#cfe3ef' : d.kind === 'garage' ? '#e7e4dd' : '#f1eee8', '', glass ? 'glass' : 'gloss')}
        >
          <boxGeometry />
        </mesh>
      </group>
    </group>
  );
}
