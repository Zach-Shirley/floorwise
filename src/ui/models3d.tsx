/**
 * Code-built true-size 3D models for every furniture symbol.
 *
 * Each category file in ./models returns parts for the pieces it knows, or
 * null to pass. The first one that answers wins; ./models/legacy.ts is the
 * fallback. To improve a piece, edit its category file. Nothing here affects
 * fit checks: those use the catalog sizes.
 */
import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { FurnitureDef } from '../engine/types';
import { bedroomParts } from './models/bedroom';
import { deskParts } from './models/desk';
import type { Mat, ModelFn, Part } from './models/kit';
import { legacyParts } from './models/legacy';
import { livingParts } from './models/living';
import { restParts } from './models/rest';

const CATEGORIES: ModelFn[] = [deskParts, bedroomParts, livingParts, restParts];

export function modelParts(def: FurnitureDef, w: number, d: number, h: number): Part[] {
  for (const fn of CATEGORIES) {
    const p = fn(def, w, d, h);
    if (p && p.length) return p;
  }
  return legacyParts(def, w, d, h);
}

// ---------------------------------------------------------------------------
// Geometry: shared unit shapes, plus cached rounded boxes (their corners can't be stretched).

const UNIT = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(0.5, 24, 16),
};
const cylCache = new Map<string, THREE.BufferGeometry>();
function cylGeo(taper = 1): THREE.BufferGeometry {
  const k = taper.toFixed(2);
  let g = cylCache.get(k);
  if (!g) {
    g = new THREE.CylinderGeometry(0.5 * Math.min(1, taper), 0.5 * Math.min(1, 1 / taper), 1, 28);
    cylCache.set(k, g);
  }
  return g;
}
const torusCache = new Map<string, THREE.BufferGeometry>();
function torusGeo(tube = 0.25): THREE.BufferGeometry {
  const k = tube.toFixed(2);
  let g = torusCache.get(k);
  if (!g) {
    // lies flat in x/z, outer diameter 1
    g = new THREE.TorusGeometry(0.5 - tube / 2, tube / 2, 12, 32);
    g.rotateX(Math.PI / 2);
    torusCache.set(k, g);
  }
  return g;
}
const rboxCache = new Map<string, THREE.BufferGeometry>();
function rboxGeo(sx: number, sy: number, sz: number, r: number): THREE.BufferGeometry {
  const q = (n: number) => Math.round(n * 4) / 4;
  const rr = Math.max(0.05, Math.min(r, sx / 2 - 0.01, sy / 2 - 0.01, sz / 2 - 0.01));
  const k = `${q(sx)}|${q(sy)}|${q(sz)}|${q(rr)}`;
  let g = rboxCache.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(Math.max(q(sx), 0.1), Math.max(q(sy), 0.1), Math.max(q(sz), 0.1), 3, Math.max(0.05, q(rr)));
    rboxCache.set(k, g);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Materials by type and color

const FINISH: Record<Mat, { roughness: number; metalness: number }> = {
  wood: { roughness: 0.62, metalness: 0 },
  fabric: { roughness: 0.97, metalness: 0 },
  leather: { roughness: 0.55, metalness: 0 },
  metal: { roughness: 0.45, metalness: 0.55 },
  chrome: { roughness: 0.18, metalness: 0.85 },
  plastic: { roughness: 0.5, metalness: 0 },
  gloss: { roughness: 0.22, metalness: 0 },
  screen: { roughness: 0.12, metalness: 0.1 },
  glass: { roughness: 0.05, metalness: 0 },
  glow: { roughness: 0.6, metalness: 0 },
  ceramic: { roughness: 0.3, metalness: 0 },
  stone: { roughness: 0.4, metalness: 0 },
  paper: { roughness: 0.9, metalness: 0 },
  plant: { roughness: 0.85, metalness: 0 },
  rubber: { roughness: 0.9, metalness: 0 },
};
const mats = new Map<string, THREE.Material>();
export function material(c: string, tint = '', m: Mat = 'plastic'): THREE.Material {
  const key = `${c}|${tint}|${m}`;
  let mt = mats.get(key);
  if (!mt) {
    const s = new THREE.MeshStandardMaterial({ color: c, ...FINISH[m] });
    if (m === 'glass') Object.assign(s, { transparent: true, opacity: 0.25, depthWrite: false });
    if (m === 'glow') {
      s.emissive = new THREE.Color(c);
      s.emissiveIntensity = 0.8;
    }
    if (m === 'screen') {
      s.emissive = new THREE.Color('#1a2433');
      s.emissiveIntensity = 0.35;
    }
    if (tint) {
      s.emissive = new THREE.Color(tint);
      s.emissiveIntensity = 0.35;
    }
    mt = s;
    mats.set(key, mt);
  }
  return mt;
}

function geometryFor(p: Part): { geo: THREE.BufferGeometry; scale: [number, number, number] } {
  switch (p.k) {
    case 'rbox':
      return { geo: rboxGeo(p.sx, p.sy, p.sz, p.r ?? 1), scale: [1, 1, 1] };
    case 'cyl':
      return { geo: cylGeo(p.taper), scale: [p.sx, p.sy, p.sz] };
    case 'torus':
      return { geo: torusGeo(p.tube), scale: [p.sx, p.sy / (p.tube ?? 0.25), p.sz] };
    case 'sph':
      return { geo: UNIT.sph, scale: [p.sx, p.sy, p.sz] };
    default:
      return { geo: UNIT.box, scale: [p.sx, p.sy, p.sz] };
  }
}

/**
 * Recolor a model: the most common fabric/leather color becomes `color`
 * (or the most common wood color, if the piece has no upholstery).
 */
export function recolor(parts: Part[], color?: string): Part[] {
  if (!color) return parts;
  if (parts.some((p) => p.main)) return parts.map((p) => (p.main ? { ...p, c: color } : p));
  for (const group of [['fabric', 'leather'], ['wood'], ['plastic', 'gloss', 'metal']] as Mat[][]) {
    const counts = new Map<string, number>();
    for (const p of parts) if (group.includes(p.m ?? 'plastic')) counts.set(p.c, (counts.get(p.c) ?? 0) + p.sx * p.sy * p.sz);
    if (!counts.size) continue;
    const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return parts.map((p) => (p.c === main && group.includes(p.m ?? 'plastic') ? { ...p, c: color } : p));
  }
  return parts;
}

export const ItemModel = memo(function ItemModel({ def, w, d, tint, color }: { def: FurnitureDef; w: number; d: number; tint?: string; color?: string }) {
  const parts = useMemo(() => recolor(modelParts(def, w, d, def.h), color), [def, w, d, color]);
  return (
    <group scale={1 / 12}>
      {parts.map((p, i) => {
        const { geo, scale } = geometryFor(p);
        const y = p.k === 'sph' || p.k === 'torus' ? p.y : p.y + p.sy / 2;
        return <mesh key={i} geometry={geo} material={material(p.c, tint, p.m)} position={[p.x, y, p.z]} scale={scale} rotation={p.rot ?? [0, 0, 0]} />;
      })}
    </group>
  );
});
