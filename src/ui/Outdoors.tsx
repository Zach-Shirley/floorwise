/**
 * A simple neighbourhood around the house so windows have something to show
 * and you can tell which way you're facing: sky, lawn, a street on the
 * front-door side with a sidewalk and a front walk, neighbour houses and trees.
 * Decoration only: nothing out here is clickable or affects the plan.
 */
import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { RFloor } from '../engine/resolve';
import type { Rect } from '../engine/types';
import { TILE, surfaceMaterial, worldBox, worldPlane } from './textures';
import { material } from './models3d';

type Side = 'N' | 'S' | 'E' | 'W';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Which side of the house the front door is on. */
function frontSide(floor: RFloor, bbox: Rect): Side {
  const main = floor.doors.find((d) => d.main) ?? floor.doors.find((d) => d.a === 'outside' || d.b === 'outside');
  if (!main) return 'S';
  const [x, y, w, h] = bbox;
  const { seg } = main;
  if (seg.o === 'h') return Math.abs(seg.c - y) < Math.abs(seg.c - (y + h)) ? 'N' : 'S';
  return Math.abs(seg.c - x) < Math.abs(seg.c - (x + w)) ? 'W' : 'E';
}

const SKY = (() => {
  const g = new THREE.SphereGeometry(700, 32, 16);
  const colors: number[] = [];
  const pos = g.attributes.position;
  const top = new THREE.Color('#7fa9d8'),
    mid = new THREE.Color('#c9dbea'),
    low = new THREE.Color('#e6ebe9');
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 700;
    const c = t > 0.15 ? mid.clone().lerp(top, Math.min(1, (t - 0.15) / 0.6)) : low.clone().lerp(mid, Math.max(0, (t + 0.05) / 0.2));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return g;
})();
const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });

/** A gabled house: walls, roof prism, a few windows and a door on the side facing `face`. */
function House({ x, z, w, d, stories, face, tint }: { x: number; z: number; w: number; d: number; stories: number; face: Side; tint: string }) {
  const wallH = stories * 9.5;
  const roofH = Math.min(w, d) * 0.35;
  const walls = useMemo(() => worldBox(x - w / 2, 0, z - d / 2, w, wallH, d, TILE.siding), [x, z, w, d, wallH]);
  useEffect(() => () => walls.dispose(), [walls]);
  const roof = useMemo(() => {
    // ridge runs along the longer side
    const along = w >= d;
    const span = along ? d : w,
      len = along ? w : d;
    const shape = new THREE.Shape();
    shape.moveTo(-span / 2 - 1, 0);
    shape.lineTo(span / 2 + 1, 0);
    shape.lineTo(0, roofH);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: len + 2, bevelEnabled: false });
    g.translate(0, 0, -(len + 2) / 2);
    if (along) g.rotateY(Math.PI / 2);
    g.translate(x, wallH, z);
    return g;
  }, [x, z, w, d, wallH, roofH]);
  useEffect(() => () => roof.dispose(), [roof]);
  // windows on the facade facing the street/house
  const n = Math.max(2, Math.floor((face === 'N' || face === 'S' ? w : d) / 9));
  const facadeLen = face === 'N' || face === 'S' ? w : d;
  const wins: [number, number, number, number, number][] = [];
  for (let s = 0; s < stories; s++)
    for (let i = 0; i < n; i++) {
      const a = -facadeLen / 2 + ((i + 0.5) * facadeLen) / n;
      wins.push([a, 3 + s * 9.5, 3.2, 4.2, i === Math.floor(n / 2) && s === 0 ? 1 : 0]);
    }
  const off = (face === 'N' || face === 'S' ? d : w) / 2 + 0.05;
  const sign = face === 'S' || face === 'E' ? 1 : -1;
  return (
    <group>
      <mesh geometry={walls} material={surfaceMaterial('siding', { tint })} />
      <mesh geometry={roof} material={surfaceMaterial('roof')} />
      {wins.map(([a, y, ww, hh, door], i) => {
        const isDoor = door === 1;
        const [px, pz] = face === 'N' || face === 'S' ? [x + a, z + sign * off] : [x + sign * off, z + a];
        const [sx, sz] = face === 'N' || face === 'S' ? [ww, 0.2] : [0.2, ww];
        return (
          <mesh key={i} position={[px, isDoor ? 3.4 : y + hh / 2, pz]} scale={[sx, isDoor ? 6.8 : hh, sz]} material={material(isDoor ? '#5a3b2a' : '#2c3a48', '', isDoor ? 'wood' : 'gloss')}>
            <boxGeometry />
          </mesh>
        );
      })}
    </group>
  );
}

function Tree({ x, z, s, kind }: { x: number; z: number; s: number; kind: number }) {
  const trunk = material('#5d4632', '', 'wood');
  const leaf = material(kind ? '#3f6b3a' : '#4d7c3f', '', 'plant');
  return kind ? (
    // conifer
    <group position={[x, 0, z]}>
      <mesh position={[0, 2 * s, 0]} scale={[0.9 * s, 4 * s, 0.9 * s]} material={trunk}>
        <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, (4 + i * 3.6) * s, 0]} scale={[(7 - i * 1.8) * s, 6 * s, (7 - i * 1.8) * s]} material={leaf}>
          <coneGeometry args={[0.5, 1, 10]} />
        </mesh>
      ))}
    </group>
  ) : (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.5 * s, 0]} scale={[1 * s, 7 * s, 1 * s]} material={trunk}>
        <cylinderGeometry args={[0.4, 0.5, 1, 8]} />
      </mesh>
      {[
        [0, 10, 0, 9],
        [2.2, 8.5, 1, 6],
        [-2, 9, -1.5, 6.5],
      ].map(([dx, dy, dz, r], i) => (
        <mesh key={i} position={[dx * s, dy * s, dz * s]} scale={[r * s, r * 0.85 * s, r * s]} material={leaf}>
          <sphereGeometry args={[0.5, 12, 10]} />
        </mesh>
      ))}
    </group>
  );
}

export const Outdoors = memo(function Outdoors({ floor, groundY }: { floor: RFloor; groundY: number }) {
  const scene = useMemo(() => {
    const bb = floor.bbox;
    const [bx, by, bw, bh] = bb;
    const cx = bx + bw / 2,
      cz = by + bh / 2;
    const face = frontSide(floor, bb);
    const rand = rng(Math.round(bw * 31 + bh * 17));
    // distance from the house's front wall to the sidewalk and the road
    const yard = 18,
      walk = 5,
      road = 26;
    const horiz = face === 'N' || face === 'S';
    const sign = face === 'S' || face === 'E' ? 1 : -1;
    const frontEdge = face === 'S' ? by + bh : face === 'N' ? by : face === 'E' ? bx + bw : bx;
    const strip = (from: number, depth: number): Rect => {
      const a = sign > 0 ? frontEdge + from : frontEdge - from - depth;
      return horiz ? [cx - 400, a, 800, depth] : [a, cz - 400, depth, 800];
    };
    const sidewalk = strip(yard, walk);
    const asphalt = strip(yard + walk + 1, road);
    const sidewalk2 = strip(yard + walk + 1 + road + 1, walk);
    // centerline dashes
    const dashes: Rect[] = [];
    const mid = sign > 0 ? frontEdge + yard + walk + 1 + road / 2 : frontEdge - (yard + walk + 1 + road / 2);
    for (let k = -400; k < 400; k += 18) dashes.push(horiz ? [cx + k, mid - 0.25, 9, 0.5] : [mid - 0.25, cz + k, 0.5, 9]);
    // front walk from the main door to the sidewalk
    const main = floor.doors.find((d) => d.main);
    const doorAt = main ? (main.seg.a0 + main.seg.a1) / 2 : horiz ? cx : cz;
    const frontWalk: Rect = horiz
      ? [doorAt - 2, sign > 0 ? frontEdge : frontEdge - yard, 4, yard]
      : [sign > 0 ? frontEdge : frontEdge - yard, doorAt - 2, yard, 4];
    // neighbours: two beside us, three across the street
    const houses: { x: number; z: number; w: number; d: number; stories: number; face: Side; tint: string }[] = [];
    const tints = ['#e3ddd2', '#d6dde0', '#e6d8c8', '#d9d2c4', '#cfd8cf', '#e8e2da'];
    const across = sign > 0 ? frontEdge + yard + walk + road + walk + 3 + 22 : frontEdge - (yard + walk + road + walk + 3 + 22);
    const opposite: Side = face === 'N' ? 'S' : face === 'S' ? 'N' : face === 'E' ? 'W' : 'E';
    const ourLen = horiz ? bw : bh;
    for (let i = -1; i <= 1; i++) {
      const w = 34 + rand() * 14,
        d = 30 + rand() * 10;
      const along = (horiz ? cx : cz) + i * (Math.max(ourLen, 48) + 14) + (rand() - 0.5) * 6;
      houses.push({ x: horiz ? along : across + (sign * d) / 2, z: horiz ? across + (sign * d) / 2 : along, w: horiz ? w : d, d: horiz ? d : w, stories: rand() > 0.5 ? 2 : 1, face: opposite, tint: tints[Math.floor(rand() * tints.length)] });
    }
    for (const s of [-1, 1]) {
      const w = 32 + rand() * 10,
        d = 34 + rand() * 10;
      const along = (horiz ? cx : cz) + s * (ourLen / 2 + 22 + w / 2);
      const depthMid = horiz ? cz : cx;
      houses.push({ x: horiz ? along : depthMid, z: horiz ? depthMid : along, w: horiz ? w : d, d: horiz ? d : w, stories: rand() > 0.6 ? 2 : 1, face, tint: tints[Math.floor(rand() * tints.length)] });
    }
    // trees in the yards, kept off the house, road and neighbours
    const blocked = (x: number, z: number) => {
      const pad = 9;
      if (x > bx - pad && x < bx + bw + pad && z > by - pad && z < by + bh + pad) return true;
      for (const r of [sidewalk, asphalt, sidewalk2, frontWalk]) if (x > r[0] - 4 && x < r[0] + r[2] + 4 && z > r[1] - 4 && z < r[1] + r[3] + 4) return true;
      for (const h of houses) if (Math.abs(x - h.x) < h.w / 2 + 6 && Math.abs(z - h.z) < h.d / 2 + 6) return true;
      return false;
    };
    const trees: { x: number; z: number; s: number; kind: number }[] = [];
    for (let tries = 0; tries < 400 && trees.length < 26; tries++) {
      const a = rand() * Math.PI * 2,
        r = 18 + rand() * 110;
      const x = cx + Math.cos(a) * (r + bw / 2),
        z = cz + Math.sin(a) * (r + bh / 2);
      if (!blocked(x, z) && trees.every((t) => Math.hypot(t.x - x, t.z - z) > 10)) trees.push({ x, z, s: 0.8 + rand() * 0.6, kind: rand() > 0.6 ? 1 : 0 });
    }
    const flat = (r: Rect, y: number, kind: 'asphalt' | 'sidewalk') => worldPlane(r[0], r[1], r[2], r[3], y, TILE[kind]);
    return {
      cx,
      cz,
      ground: worldPlane(cx - 500, cz - 500, 1000, 1000, -0.12, TILE.grass),
      sidewalks: [flat(sidewalk, -0.1, 'sidewalk'), flat(sidewalk2, -0.1, 'sidewalk'), flat(frontWalk, -0.105, 'sidewalk')],
      road: flat(asphalt, -0.1, 'asphalt'),
      dashes,
      houses,
      trees,
    };
  }, [floor]);
  useEffect(
    () => () => {
      scene.ground.dispose();
      scene.road.dispose();
      scene.sidewalks.forEach((g) => g.dispose());
    },
    [scene],
  );

  return (
    <group>
      <mesh geometry={SKY} material={skyMat} position={[scene.cx, 0, scene.cz]} renderOrder={-1} />
      <group position={[0, groundY, 0]}>
        <mesh geometry={scene.ground} material={surfaceMaterial('grass')} />
        <mesh geometry={scene.road} material={surfaceMaterial('asphalt')} />
        {scene.sidewalks.map((g, i) => (
          <mesh key={i} geometry={g} material={surfaceMaterial('sidewalk')} />
        ))}
        {scene.dashes.map((r, i) => (
          <mesh key={i} position={[r[0] + r[2] / 2, -0.085, r[1] + r[3] / 2]} scale={[r[2], 0.02, r[3]]} material={material('#e8d36a', '', 'paper')}>
            <boxGeometry />
          </mesh>
        ))}
        {scene.houses.map((h, i) => (
          <House key={i} {...h} />
        ))}
        {scene.trees.map((t, i) => (
          <Tree key={i} {...t} />
        ))}
      </group>
    </group>
  );
});
