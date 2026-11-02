/**
 * Room finishes (wall paint, floor type) and furniture color choices. Saved
 * per layout in the browser, separately from the plan data.
 */

export type FloorFinish = 'wood' | 'walnut' | 'tile' | 'carpet' | 'concrete';

export interface RoomFinish {
  /** Wall paint, hex. */
  paint?: string;
  floor?: FloorFinish;
}

/** Keyed by `${floorId}/${roomId}`. */
export type Finishes = Record<string, RoomFinish>;

export const PAINTS: { name: string; hex: string }[] = [
  { name: 'Warm white', hex: '#ece8e1' },
  { name: 'Cool white', hex: '#eef0f1' },
  { name: 'Greige', hex: '#cfc6b8' },
  { name: 'Sage', hex: '#b7c2a8' },
  { name: 'Sky', hex: '#bccfdd' },
  { name: 'Blush', hex: '#e2c4bd' },
  { name: 'Terracotta', hex: '#c27a5c' },
  { name: 'Navy', hex: '#3d4a63' },
  { name: 'Charcoal', hex: '#4a4b4f' },
  { name: 'Deep red', hex: '#6e2328' },
];

export const FLOORS: { id: FloorFinish; name: string }[] = [
  { id: 'wood', name: 'Oak' },
  { id: 'walnut', name: 'Walnut' },
  { id: 'carpet', name: 'Carpet' },
  { id: 'tile', name: 'Tile' },
  { id: 'concrete', name: 'Concrete' },
];

/** Swatches for recoloring furniture (the main fabric, or the wood if there is no fabric). */
export const ITEM_COLORS: { name: string; hex: string }[] = [
  { name: 'Slate', hex: '#5d646e' },
  { name: 'Charcoal', hex: '#2e3034' },
  { name: 'Oatmeal', hex: '#cdbfa8' },
  { name: 'Cream', hex: '#ece5d6' },
  { name: 'Olive', hex: '#6c7350' },
  { name: 'Navy', hex: '#2f3c58' },
  { name: 'Rust', hex: '#a2512f' },
  { name: 'Crimson', hex: '#8f1f2b' },
  { name: 'Blush', hex: '#d6a7a0' },
  { name: 'Walnut', hex: '#5e4431' },
  { name: 'Oak', hex: '#b48a5e' },
  { name: 'White', hex: '#f1efea' },
];

export const finishKey = (layoutId: string) => `floorwise:v1:finish:${layoutId}`;

export function loadFinishes(layoutId: string): Finishes {
  try {
    const v = JSON.parse(localStorage.getItem(finishKey(layoutId)) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export function saveFinishes(layoutId: string, f: Finishes) {
  try {
    localStorage.setItem(finishKey(layoutId), JSON.stringify(f));
  } catch {
    /* ignore */
  }
}
