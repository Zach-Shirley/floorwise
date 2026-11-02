/**
 * Procedural surface textures drawn on canvases at runtime: plaster walls,
 * wood planks, tile, concrete, decking, grass, asphalt. No image files.
 * Each texture covers TILE feet, so geometry UVs are "world feet / TILE".
 */
import * as THREE from 'three';

export type Surface = 'paint' | 'plaster' | 'wood' | 'tile' | 'concrete' | 'deck' | 'carpet' | 'grass' | 'asphalt' | 'sidewalk' | 'ceiling' | 'siding' | 'roof';

/** Feet covered by one repeat of each texture. */
export const TILE: Record<Surface, number> = {
  paint: 6,
  plaster: 6,
  wood: 6,
  tile: 4,
  concrete: 8,
  deck: 6,
  carpet: 4,
  grass: 12,
  asphalt: 16,
  sidewalk: 5,
  ceiling: 6,
  siding: 6,
  roof: 6,
};

/** Deterministic pseudo-random numbers so textures look the same every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function noise(ctx: CanvasRenderingContext2D, n: number, size: number, alpha: number, rand: () => number, dark = true) {
  for (let i = 0; i < n; i++) {
    const v = dark ? 0 : 255;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rand()})`;
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 1 + rand() * 2);
  }
}

function draw(kind: Surface): HTMLCanvasElement {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const rand = rng(kind.length * 977 + kind.charCodeAt(0));
  const px = size / TILE[kind]; // pixels per foot
  switch (kind) {
    case 'paint':
    case 'plaster':
    case 'ceiling': {
      // 'paint' is near-white so a tint shows its true color
      g.fillStyle = kind === 'plaster' ? '#ece8e1' : kind === 'paint' ? '#fbfaf8' : '#f3f1ed';
      g.fillRect(0, 0, size, size);
      noise(g, 9000, size, 0.05, rand);
      noise(g, 5000, size, 0.06, rand, false);
      // soft trowel blotches
      for (let i = 0; i < 60; i++) {
        g.fillStyle = `rgba(0,0,0,${0.012 * rand()})`;
        g.beginPath();
        g.ellipse(rand() * size, rand() * size, 20 + rand() * 60, 10 + rand() * 40, rand() * 3, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'wood': {
      const plank = (5 / 12) * px; // 5" planks
      const tones = ['#b58c62', '#a97f56', '#bf966b', '#9f774f', '#b88f63', '#ad8459'];
      for (let row = 0; row * plank < size; row++) {
        let x = -rand() * size * 0.5;
        while (x < size) {
          const len = (3 + rand() * 4) * px;
          g.fillStyle = tones[Math.floor(rand() * tones.length)];
          g.fillRect(x, row * plank, len, plank);
          // grain
          g.strokeStyle = 'rgba(70,45,25,0.18)';
          g.lineWidth = 1;
          for (let k = 0; k < 6; k++) {
            const yy = row * plank + rand() * plank;
            g.beginPath();
            g.moveTo(x, yy);
            g.bezierCurveTo(x + len / 3, yy + (rand() - 0.5) * 6, x + (2 * len) / 3, yy + (rand() - 0.5) * 6, x + len, yy);
            g.stroke();
          }
          g.fillStyle = 'rgba(40,25,15,0.45)';
          g.fillRect(x, row * plank, 1.5, plank);
          x += len;
        }
        g.fillStyle = 'rgba(40,25,15,0.35)';
        g.fillRect(0, row * plank, size, 1.2);
      }
      break;
    }
    case 'tile': {
      const t = 1 * px; // 12" tiles
      for (let y = 0; y < size; y += t)
        for (let x = 0; x < size; x += t) {
          const v = 222 + Math.floor(rand() * 14);
          g.fillStyle = `rgb(${v},${v},${v - 4})`;
          g.fillRect(x, y, t, t);
        }
      noise(g, 4000, size, 0.04, rand);
      g.fillStyle = '#a9a69f';
      for (let k = 0; k <= size; k += t) {
        g.fillRect(k - 1.5, 0, 3, size);
        g.fillRect(0, k - 1.5, size, 3);
      }
      break;
    }
    case 'concrete':
    case 'sidewalk': {
      g.fillStyle = kind === 'concrete' ? '#9c9a95' : '#b9b6ae';
      g.fillRect(0, 0, size, size);
      noise(g, 16000, size, 0.08, rand);
      noise(g, 8000, size, 0.06, rand, false);
      if (kind === 'sidewalk') {
        g.fillStyle = 'rgba(60,60,60,0.35)';
        g.fillRect(0, 0, size, 2);
        g.fillRect(0, 0, 2, size);
      }
      break;
    }
    case 'deck': {
      const b = (6 / 12) * px;
      for (let y = 0; y < size; y += b) {
        const v = 120 + Math.floor(rand() * 22);
        g.fillStyle = `rgb(${v},${Math.floor(v * 0.8)},${Math.floor(v * 0.6)})`;
        g.fillRect(0, y, size, b - 3);
        g.fillStyle = 'rgba(30,20,10,0.6)';
        g.fillRect(0, y + b - 3, size, 3);
      }
      noise(g, 3000, size, 0.08, rand);
      break;
    }
    case 'carpet': {
      g.fillStyle = '#8e8a84';
      g.fillRect(0, 0, size, size);
      noise(g, 30000, size, 0.08, rand);
      noise(g, 20000, size, 0.06, rand, false);
      break;
    }
    case 'grass': {
      g.fillStyle = '#5f8a46';
      g.fillRect(0, 0, size, size);
      for (let i = 0; i < 26000; i++) {
        const v = rand();
        g.fillStyle = v < 0.5 ? `rgba(40,80,30,${0.3 * rand()})` : `rgba(140,170,90,${0.25 * rand()})`;
        g.fillRect(rand() * size, rand() * size, 1, 2 + rand() * 3);
      }
      break;
    }
    case 'asphalt': {
      g.fillStyle = '#3f4144';
      g.fillRect(0, 0, size, size);
      noise(g, 20000, size, 0.15, rand);
      noise(g, 9000, size, 0.08, rand, false);
      break;
    }
    case 'siding': {
      const lap = (7 / 12) * px;
      for (let y = 0; y < size; y += lap) {
        g.fillStyle = '#d9d4ca';
        g.fillRect(0, y, size, lap);
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(0, y + lap - 3, size, 3);
      }
      break;
    }
    case 'roof': {
      const row = (8 / 12) * px;
      for (let y = 0, r = 0; y < size; y += row, r++) {
        for (let x = (r % 2) * (row * 0.75); x < size + row; x += row * 1.5) {
          const v = 70 + Math.floor(rand() * 18);
          g.fillStyle = `rgb(${v},${v - 4},${v - 8})`;
          g.fillRect(x - row * 1.5, y, row * 1.5 - 2, row - 2);
        }
      }
      break;
    }
  }
  return c;
}

const cache = new Map<Surface, THREE.Texture>();
export function texture(kind: Surface): THREE.Texture {
  let t = cache.get(kind);
  if (!t) {
    t = new THREE.CanvasTexture(draw(kind));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    cache.set(kind, t);
  }
  return t;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
export function surfaceMaterial(kind: Surface, opts: { side?: THREE.Side; tint?: string } = {}): THREE.MeshStandardMaterial {
  const key = `${kind}|${opts.side ?? 0}|${opts.tint ?? ''}`;
  let m = matCache.get(key);
  if (!m) {
    const rough: Partial<Record<Surface, number>> = { wood: 0.55, tile: 0.35, asphalt: 0.95, grass: 1 };
    m = new THREE.MeshStandardMaterial({ map: texture(kind), roughness: rough[kind] ?? 0.9, metalness: 0, side: opts.side ?? THREE.FrontSide });
    if (opts.tint) m.color = new THREE.Color(opts.tint);
    matCache.set(key, m);
  }
  return m;
}

/**
 * A box in WORLD coordinates (feet) whose UVs are world feet / tile, so the
 * texture lines up across neighbouring pieces and never stretches.
 */
export function worldBox(x: number, y: number, z: number, sx: number, sy: number, sz: number, tile: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(x + sx / 2, y + sy / 2, z + sz / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)),
      ny = Math.abs(nor.getY(i));
    const px = pos.getX(i),
      py = pos.getY(i),
      pz = pos.getZ(i);
    if (ny > 0.5) uv.setXY(i, px / tile, pz / tile);
    else if (nx > 0.5) uv.setXY(i, pz / tile, py / tile);
    else uv.setXY(i, px / tile, py / tile);
  }
  uv.needsUpdate = true;
  return g;
}

/** A horizontal plane in world coordinates at height y with world-aligned UVs. */
export function worldPlane(x: number, z: number, w: number, d: number, y: number, tile: number, facingDown = false): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(facingDown ? Math.PI / 2 : -Math.PI / 2);
  g.translate(x + w / 2, y, z + d / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / tile, pos.getZ(i) / tile);
  uv.needsUpdate = true;
  return g;
}
