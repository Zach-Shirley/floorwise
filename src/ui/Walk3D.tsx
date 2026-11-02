/**
 * First-person 3D view of one floor. The whole floor is built at once, so
 * walking between rooms never loads anything. You can only edit furniture in
 * the room you are standing in: aim at a piece, click to pick it up, click to
 * put it down. Everything here edits the same PlacedItem data as the plan.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { getFurniture } from '../data/furniture';
import { carryRiders, itemBox, ridersOf, snapToWallMount, snapToWalls, type FitWarning, type PlacedItem, type Stack } from '../engine/furniture';
import { inRoom, type RFloor, type RRoom } from '../engine/resolve';
import { CEILING_FT, DOOR_HEAD_FT, canStand, wallBoxes } from '../engine/scene';
import type { RoomType } from '../engine/types';
import { ItemModel, material } from './models3d';

interface Props {
  floor: RFloor;
  items: PlacedItem[];
  fit: Map<string, FitWarning[]>;
  stacks: Map<string, Stack>;
  selUid: string | null;
  /** Viewer height, inches. */
  person: number;
  spawnRoom: string | null;
  /** A piece just added from the palette: pick it up as soon as you click back in. */
  grabUid: string | null;
  onGrabbed: () => void;
  onRoom: (id: string) => void;
  onSelect: (uid: string | null) => void;
  onBeginEdit: () => void;
  onMoveMany: (ups: { uid: string; x: number; y: number; rot: number }[]) => void;
}

const RADIUS = 0.75; // feet, how close you can get to a wall
const WALK = 4.5; // feet per second
const REACH = 30; // feet, how far you can pick things

const FLOOR_COLOR: Partial<Record<RoomType, string>> = {
  kitchen: '#cfcac1',
  bath: '#d9dcdc',
  powder: '#d9dcdc',
  laundry: '#cfcfcb',
  mudroom: '#a9a59d',
  garage: '#8f8d89',
  workshop: '#8f8d89',
  utility: '#a9a59d',
  porch: '#8a6f55',
  deck: '#8a6f55',
  entry: '#b9b2a6',
};
const WOOD_FLOOR = '#b08d68';

export const roomAt = (floor: RFloor, x: number, y: number): RRoom | undefined =>
  floor.rooms.find((r) => r.type !== 'open-below' && inRoom({ x, y }, r, 0));

export default function Walk3D(p: Props) {
  const [locked, setLocked] = useState(false);
  /** Fallback when pointer lock isn't available: drag to look, click to pick. */
  const [free, setFree] = useState(false);
  const active = locked || free;
  const [room, setRoom] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [held, setHeld] = useState<string | null>(null);
  const [flash, setFlash] = useState('');
  const lockRef = useRef<PointerLockControls | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 2200);
    return () => clearTimeout(t);
  }, [flash]);

  const roomName = (id: string | null) => (id ? p.floor.roomById.get(id)?.name ?? '' : '');
  const hoverItem = hover ? p.items.find((i) => i.uid === hover) : undefined;
  const hoverDef = hoverItem && getFurniture(hoverItem.item);
  const hoverRoom = hoverItem && roomAt(p.floor, hoverItem.x, hoverItem.y);
  const heldDef = held ? getFurniture(p.items.find((i) => i.uid === held)?.item ?? '') : undefined;
  const focus = held ?? p.selUid;
  const warns = focus ? p.fit.get(focus) ?? [] : [];

  return (
    <div className="walk">
      <Canvas camera={{ fov: 70, near: 0.05, far: 400 }}>
        <Scene
          {...p}
          room={room}
          held={held}
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
        {active && hoverDef && !held && (
          <div className="walk-aim">
            <b>{hoverDef.name}</b>
            <span>{hoverRoom?.id === room ? 'Click to pick up' : `In ${hoverRoom?.name ?? 'another room'}: walk in to edit`}</span>
          </div>
        )}
        {held && heldDef && (
          <div className="walk-aim held">
            <b>Holding {heldDef.name}</b>
            <span>Click to put down · R / Shift+R turn 90° · Q / E turn 15° · Del remove · Alt no snapping</span>
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
        <div
          className="walk-start"
          onClick={() => {
            const req = lockRef.current?.domElement?.requestPointerLock() as Promise<void> | undefined;
            req?.catch?.(() => {}); // refusal is handled by the fallback below
            // Some browsers refuse pointer lock without saying so: fall back after a moment.
            setTimeout(() => !document.pointerLockElement && document.dispatchEvent(new Event('pointerlockerror')), 700);
          }}
        >
          <div className="walk-card">
            <h3>Click to walk around</h3>
            <p>
              <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to walk, <kbd>Shift</kbd> to hurry, the mouse to look.
            </p>
            <p>Aim at furniture in the room you're standing in and click to pick it up, then click again to put it down.</p>
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
  lockRef: React.MutableRefObject<PointerLockControls | null>;
  setLocked: (b: boolean) => void;
  free: boolean;
  setFree: (b: boolean) => void;
  setRoom: (id: string) => void;
  setPending: (id: string | null) => void;
  setHover: (uid: string | null) => void;
  setHeld: (uid: string | null) => void;
  setFlash: (s: string) => void;
}

function Scene(p: SceneProps) {
  const { camera, gl, scene } = useThree();
  const { floor } = p;
  const boxes = useMemo(() => wallBoxes(floor), [floor]);
  const solid = useMemo(() => boxes.filter((b) => b.y0 === 0 && b.kind === 'wall').map((b) => b.rect), [boxes]);
  const itemsGroup = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const live = useRef(p); // latest props for event handlers and the frame loop
  live.current = p;
  const roomTimer = useRef<{ id: string; t: number } | null>(null);
  const grab = useRef<{ uid: string; ox: number; oy: number; riders: PlacedItem[]; from: { x: number; y: number; rot: number }; last: string } | null>(null);
  const eye = (p.person - 4.5) / 12;
  const isActive = () => !!p.lockRef.current?.isLocked || live.current.free;

  useEffect(() => {
    scene.background = new THREE.Color('#c7d0d8');
  }, [scene]);

  // Spawn in the middle of the chosen room (or the biggest one), facing north.
  useEffect(() => {
    const start = (p.spawnRoom && floor.roomById.get(p.spawnRoom)) || [...floor.rooms].filter((r) => !r.outdoor && r.type !== 'open-below').sort((a, b) => b.area - a.area)[0];
    let { x, y } = start.labelAt;
    if (!canStand(floor, solid, x, y, RADIUS)) {
      outer: for (let r = 0.5; r < 6; r += 0.5)
        for (let a = 0; a < 8; a++) {
          const tx = x + Math.cos((a * Math.PI) / 4) * r,
            ty = y + Math.sin((a * Math.PI) / 4) * r;
          if (canStand(floor, solid, tx, ty, RADIUS)) {
            [x, y] = [tx, ty];
            break outer;
          }
        }
    }
    let yaw = 0;
    const cam = new URLSearchParams(location.search).get('cam')?.split(',').map(Number);
    if (cam && cam.length >= 2 && cam.every(Number.isFinite)) [x, y, yaw] = [cam[0], cam[1], cam[2] ?? 0];
    camera.position.set(x, eye, y);
    camera.rotation.set(0, (-yaw * Math.PI) / 180, 0, 'YXZ');
    p.setRoom(start.id);
  }, [floor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    camera.position.y = eye;
  }, [eye, camera]);

  // Mouse look + pointer lock.
  useEffect(() => {
    const c = new PointerLockControls(camera, gl.domElement);
    p.lockRef.current = c;
    const onLock = () => {
      p.setLocked(true);
      const g = live.current.grabUid;
      if (g) {
        live.current.onGrabbed();
        const it = live.current.items.find((i) => i.uid === g);
        if (it) startHold(it, true);
      }
    };
    const onUnlock = () => {
      p.setLocked(false);
      endHold();
    };
    // No pointer lock (some browsers, embedded views): fall back to drag-to-look.
    const onLockError = () => {
      live.current.setFree(true);
      onLock();
      p.setLocked(false);
    };
    c.addEventListener('lock', onLock);
    c.addEventListener('unlock', onUnlock);
    document.addEventListener('pointerlockerror', onLockError);
    return () => {
      c.removeEventListener('lock', onLock);
      c.removeEventListener('unlock', onUnlock);
      document.removeEventListener('pointerlockerror', onLockError);
      c.unlock();
      c.dispose();
    };
  }, [camera, gl]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function startHold(it: PlacedItem, centered = false) {
    const L = live.current;
    const def = getFurniture(it.item);
    const hit = def?.mount === 'wall' ? null : aimPoint(planeY(it));
    L.onBeginEdit();
    L.onSelect(it.uid);
    grab.current = {
      uid: it.uid,
      ox: centered || !hit ? 0 : it.x - hit.x,
      oy: centered || !hit ? 0 : it.y - hit.y,
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

  // Height of the plane you slide a piece along: the floor, the top it rests on, or the middle of a wall piece.
  function planeY(it: PlacedItem): number {
    const def = getFurniture(it.item);
    const st = live.current.stacks.get(it.uid);
    if (!def || !st) return 0;
    if (def.mount === 'wall') return (st.elev + def.h / 2) / 12;
    return st.elev / 12;
  }

  const ray = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  function aimPoint(y: number): { x: number; y: number } | null {
    ray.setFromCamera(center, camera);
    const { origin, direction } = ray.ray;
    if (Math.abs(direction.y) < 1e-4) return null;
    const t = (y - origin.y) / direction.y;
    if (t <= 0 || t > REACH) return null;
    return { x: origin.x + direction.x * t, y: origin.z + direction.z * t };
  }

  // Click while walking: pick up or put down.
  function clickAction() {
    const L = live.current;
    if (grab.current) return endHold();
    const uid = pickUid();
    if (!uid) return;
    const it = L.items.find((i) => i.uid === uid);
    if (!it) return;
    const r = roomAt(L.floor, it.x, it.y);
    if (r?.id !== L.room) {
      L.setFlash(`That's in the ${r?.name ?? 'next room'}. Walk in there to edit it.`);
      return;
    }
    startHold(it);
  }
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button === 0 && p.lockRef.current?.isLocked) clickAction();
    };
    document.addEventListener('mousedown', onDown);
    // drag-to-look fallback
    const el = gl.domElement;
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    let start: { x: number; y: number; moved: boolean } | null = null;
    const pd = (e: PointerEvent) => {
      if (!live.current.free || e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, moved: false };
      el.setPointerCapture(e.pointerId);
    };
    const pm = (e: PointerEvent) => {
      if (!start || !live.current.free) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) start.moved = true;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= e.movementX * 0.005;
      euler.x = Math.max(-1.45, Math.min(1.45, euler.x - e.movementY * 0.005));
      camera.quaternion.setFromEuler(euler);
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

  /** Where the aim ray first meets a wall, in plan feet (for hanging wall pieces). */
  function aimWall(): { x: number; y: number } | null {
    ray.setFromCamera(center, camera);
    const { origin: o, direction: dir } = ray.ray;
    const h = Math.hypot(dir.x, dir.z);
    if (h < 1e-4) return null;
    const dx = dir.x / h,
      dz = dir.z / h;
    let best = REACH;
    for (const [x, y, w, d] of solid) {
      // slab test against the wall's footprint
      const tx1 = (x - o.x) / dx,
        tx2 = (x + w - o.x) / dx;
      const tz1 = (y - o.z) / dz,
        tz2 = (y + d - o.z) / dz;
      const t0 = Math.max(Math.min(tx1, tx2), Math.min(tz1, tz2));
      const t1 = Math.min(Math.max(tx1, tx2), Math.max(tz1, tz2));
      if (t1 >= Math.max(t0, 0) && t0 > 0 && t0 < best) best = t0;
    }
    return best < REACH ? { x: o.x + dx * (best - 0.05), y: o.z + dz * (best - 0.05) } : null;
  }

  function pickUid(): string | null {
    if (!itemsGroup.current) return null;
    ray.setFromCamera(center, camera);
    ray.far = REACH;
    const hits = ray.intersectObjects(itemsGroup.current.children, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.uid) o = o.parent;
      if (o) return o.userData.uid as string;
    }
    return null;
  }

  const fwd = useMemo(() => new THREE.Vector3(), []);
  const frame = useRef(0);
  useFrame((_, dtRaw) => {
    const L = live.current;
    const dt = Math.min(dtRaw, 0.05);
    const locked = isActive();

    // walk
    if (locked) {
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
        if (canStand(L.floor, solid, x + dx, z + dz, RADIUS)) camera.position.set(x + dx, camera.position.y, z + dz);
        else if (canStand(L.floor, solid, x + dx, z, RADIUS)) camera.position.x = x + dx;
        else if (canStand(L.floor, solid, x, z + dz, RADIUS)) camera.position.z = z + dz;
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

    // move what you're holding
    const g = grab.current;
    if (g && locked) {
      const it = L.items.find((i) => i.uid === g.uid);
      const def = it && getFurniture(it.item);
      if (!it || !def) return endHold();
      const hit = def.mount === 'wall' ? aimWall() : aimPoint(planeY(it));
      if (hit) {
        const inch = 1 / 12;
        let x = Math.round((hit.x + g.ox) / inch) * inch;
        let y = Math.round((hit.y + g.oy) / inch) * inch;
        let rot = it.rot;
        const editRoom = L.room ? L.floor.roomById.get(L.room) : undefined;
        if (editRoom && inRoom({ x, y }, editRoom, 0.3)) {
          const alt = keys.current.has('AltLeft') || keys.current.has('AltRight');
          if (!alt && def.mount === 'wall') ({ x, y, rot } = snapToWallMount(L.floor, itemBox({ ...it, x, y }, def)));
          else if (!alt) ({ x, y } = snapToWalls(L.floor, itemBox({ ...it, x, y }, def)));
          const sig = `${x.toFixed(3)},${y.toFixed(3)},${rot}`;
          if (sig !== g.last) {
            g.last = sig;
            const to = { x, y, rot };
            L.onMoveMany([{ uid: it.uid, ...to }, ...carryRiders(g.riders, g.from, to)]);
          }
        }
      }
    }

    // what am I looking at (every few frames is plenty)
    if (locked && ++frame.current % 4 === 0) {
      const uid = g ? null : pickUid();
      if (uid !== hoverRef.current) {
        hoverRef.current = uid;
        L.setHover(uid);
      }
    }
  });
  const hoverRef = useRef<string | null>(null);

  const wallMat = material('#ebe7e1');
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2f0ec', side: THREE.DoubleSide, roughness: 0.95 }), []);

  return (
    <>
      {/* neutral studio lighting: enough contrast to read corners, no real light sources yet */}
      <hemisphereLight args={['#ffffff', '#8f877d', 0.9]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[30, 45, 18]} intensity={1.05} />
      <directionalLight position={[-25, 20, -30]} intensity={0.35} />

      {/* floors and ceilings */}
      {floor.rooms.map((r) =>
        r.type === 'open-below'
          ? null
          : r.rects.map((q, i) => (
              <group key={`${r.id}-${i}`}>
                <mesh position={[q[0] + q[2] / 2, -0.05, q[1] + q[3] / 2]} scale={[q[2], 0.1, q[3]]} material={material(FLOOR_COLOR[r.type] ?? WOOD_FLOOR)}>
                  <boxGeometry />
                </mesh>
                {!r.outdoor && (
                  <mesh position={[q[0] + q[2] / 2, CEILING_FT, q[1] + q[3] / 2]} rotation={[Math.PI / 2, 0, 0]} scale={[q[2], q[3], 1]} material={ceilMat}>
                    <planeGeometry />
                  </mesh>
                )}
              </group>
            )),
      )}

      {/* walls, headers, glass */}
      {boxes.map((b, i) => (
        <mesh
          key={i}
          position={[b.rect[0] + b.rect[2] / 2, (b.y0 + b.y1) / 2, b.rect[1] + b.rect[3] / 2]}
          scale={[b.rect[2], b.y1 - b.y0, b.rect[3]]}
          material={b.kind === 'glass' ? material('#bcd6e6', '', true) : wallMat}
        >
          <boxGeometry />
        </mesh>
      ))}

      {/* door leaves, shown open */}
      {floor.doors.flatMap((d) => {
        if (d.kind !== 'swing' && d.kind !== 'double') return [];
        const leaves = d.kind === 'double' ? (['start', 'end'] as const).map((h) => ({ h, w: d.width / 2 })) : [{ h: d.hinge, w: d.width }];
        return leaves.map(({ h, w }, i) => {
          const along = h === 'start' ? d.seg.a0 + 0.05 : d.seg.a1 - 0.05;
          const across = d.seg.c + d.dir * (w / 2);
          const [x, z] = d.seg.o === 'h' ? [along, across] : [across, along];
          const [sx, sz] = d.seg.o === 'h' ? [0.12, w] : [w, 0.12];
          return (
            <mesh key={`${d.id}-${i}`} position={[x, DOOR_HEAD_FT / 2, z]} scale={[sx, DOOR_HEAD_FT - 0.05, sz]} material={material('#f3f0ea')}>
              <boxGeometry />
            </mesh>
          );
        });
      })}

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
                ? '#ff3b30'
                : it.uid === p.selUid
                  ? '#e5484d'
                  : '';
          return (
            <group key={it.uid} userData={{ uid: it.uid }} position={[it.x, st.elev / 12, it.y]} rotation={[0, (-it.rot * Math.PI) / 180, 0]}>
              <ItemModel def={def} w={def.w} d={def.d} tint={tint} />
            </group>
          );
        })}
      </group>
    </>
  );
}
