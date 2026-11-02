/**
 * A 3D model gallery: every catalog piece (or one category, or one piece) on a
 * floor, with orbit controls. Open with ?gallery=1, ?gallery=1&cat=Tech, or
 * ?gallery=1&focus=monitor-27. Handy for checking models as you edit them.
 */
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FURNITURE, FURNITURE_CATEGORIES, getFurniture } from '../data/furniture';
import type { FurnitureDef } from '../engine/types';
import { useSoftEnvironment } from './envMap';
import { ItemModel, material } from './models3d';

const q = () => new URLSearchParams(location.search);

export default function Gallery3D() {
  const [cat, setCat] = useState(q().get('cat') ?? 'Beds');
  const focus = q().get('focus');
  const view = q().get('view'); // front | side | top | (default 3/4)
  const list: FurnitureDef[] = focus ? [getFurniture(focus)].filter((x): x is FurnitureDef => !!x) : FURNITURE.filter((f) => cat === 'All' || f.category === cat);
  const layout = useMemo(() => {
    // rows by width, ~24' wide
    let x = 0,
      z = 0,
      rowD = 0;
    const out: { def: FurnitureDef; x: number; z: number }[] = [];
    for (const def of list) {
      const w = def.w / 12,
        d = def.d / 12;
      if (x > 0 && x + w > 24) {
        x = 0;
        z += rowD + 2;
        rowD = 0;
      }
      out.push({ def, x: x + w / 2, z: z + d / 2 });
      x += w + 2;
      rowD = Math.max(rowD, d);
    }
    return out;
  }, [list.map((d) => d.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const ext = layout.reduce((m, p) => ({ x: Math.max(m.x, p.x + p.def.w / 24), z: Math.max(m.z, p.z + p.def.d / 24) }), { x: 1, z: 1 });

  return (
    <div className="gallery">
      {!focus && (
        <div className="gallery-bar">
          <a href="./">← Back to Floorwise</a>
          {['All', ...FURNITURE_CATEGORIES].map((c) => (
            <button key={c} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
      <Canvas camera={{ fov: 40, near: 0.05, far: 500 }} gl={{ preserveDrawingBuffer: true }}>
        <GalleryScene layout={layout} ext={ext} focus={!!focus} view={view} />
      </Canvas>
      {!focus && (
        <div className="gallery-labels">
          {list.length} pieces · drag to orbit, scroll to zoom, right-drag to pan
        </div>
      )}
    </div>
  );
}

function GalleryScene({ layout, ext, focus, view }: { layout: { def: FurnitureDef; x: number; z: number }[]; ext: { x: number; z: number }; focus: boolean; view: string | null }) {
  const { camera, gl, scene } = useThree();
  useSoftEnvironment(0.3);
  useEffect(() => {
    scene.background = new THREE.Color('#d6d9dd');
    const ctl = new OrbitControls(camera, gl.domElement);
    const cx = ext.x / 2,
      cz = ext.z / 2;
    const one = layout[0];
    const size = focus && one ? Math.max(one.def.w, one.def.d, one.def.h) / 12 : Math.max(ext.x, ext.z);
    const ty = focus && one ? (one.def.h / 24 + (one.def.mount === 'wall' ? (one.def.elev ?? 48) / 12 : 0)) : 1;
    ctl.target.set(cx, ty, cz);
    const dist = size * (focus ? 1.9 : 1.05) + 2;
    const dir =
      view === 'front' ? new THREE.Vector3(0, 0.15, 1) : view === 'side' ? new THREE.Vector3(1, 0.15, 0) : view === 'top' ? new THREE.Vector3(0, 1, 0.001) : new THREE.Vector3(0.75, 0.6, 1);
    camera.position.copy(new THREE.Vector3(cx, ty, cz).add(dir.normalize().multiplyScalar(dist)));
    ctl.update();
    return () => ctl.dispose();
  }, [layout, ext, focus, view, camera, gl, scene]);
  return (
    <>
      <hemisphereLight args={['#ffffff', '#8f877d', 0.9]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[30, 45, 18]} intensity={1.05} />
      <directionalLight position={[-25, 20, -30]} intensity={0.35} />
      <mesh position={[ext.x / 2, -0.05, ext.z / 2]} scale={[ext.x + 6, 0.1, ext.z + 6]} material={material('#b9b4ac', '', 'stone')}>
        <boxGeometry />
      </mesh>
      {layout.map(({ def, x, z }) => (
        <group key={def.id} position={[x, def.mount === 'wall' ? (def.elev ?? 48) / 12 : def.mount === 'ceiling' ? 0 : 0, z]}>
          {def.mount === 'wall' && (
            <mesh position={[0, def.h / 24, -def.d / 24 - 0.1]} scale={[def.w / 12 + 1, def.h / 12 + 1, 0.2]} material={material('#e8e4de', '', 'paper')}>
              <boxGeometry />
            </mesh>
          )}
          <ItemModel def={def} w={def.w} d={def.d} />
        </group>
      ))}
    </>
  );
}
