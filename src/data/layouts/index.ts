import type { LayoutDef } from '../../engine/types';

/**
 * Every file in this folder that default-exports a LayoutDef is picked up
 * automatically. Add `my-house.ts`, export default a layout, done.
 */
const modules = import.meta.glob<{ default: LayoutDef }>('./*.ts', { eager: true });

export const LAYOUTS: LayoutDef[] = Object.entries(modules)
  .filter(([path]) => !path.endsWith('index.ts') && !path.includes('_'))
  .map(([, m]) => m.default)
  .sort((a, b) => totalArea(a) - totalArea(b));

function totalArea(l: LayoutDef): number {
  let s = 0;
  for (const f of l.floors)
    for (const r of f.rooms) {
      if (r.type === 'garage' || r.type === 'porch' || r.type === 'deck') continue;
      for (const q of r.rects ?? (r.rect ? [r.rect] : [])) s += q[2] * q[3];
    }
  return s;
}

export const getLayout = (id: string) => LAYOUTS.find((l) => l.id === id);
