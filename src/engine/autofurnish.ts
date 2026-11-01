/**
 * A rough "starter furniture" pass: for each room type, try a short list of
 * pieces in order and drop each one where findSpot finds a clear place.
 * It's a starting point to rearrange, not interior design.
 */
import { findSpot, newUid, type PlacedItem } from './furniture';
import type { RFloor, RRoom } from './resolve';
import type { RoomType } from './types';

function bedFor(room: RRoom): string {
  const short = Math.min(...room.dims);
  if (room.type === 'primary') return short >= 12.5 ? 'bed-king' : 'bed-queen';
  if (short >= 10.5) return 'bed-queen';
  if (short >= 9.5) return 'bed-full';
  return 'bed-twin';
}

const PLAN: Partial<Record<RoomType, (r: RRoom) => string[]>> = {
  primary: (r) => [bedFor(r), 'dresser-6', 'nightstand', 'nightstand'],
  bedroom: (r) => [bedFor(r), 'chest-5', 'nightstand'],
  living: (r) => (Math.min(...r.dims) >= 13 ? ['rug-8x10', 'sofa-3', 'coffee-table', 'armchair', 'tv-console'] : ['sofa-apartment', 'coffee-table', 'tv-console']),
  family: () => ['rug-8x10', 'sectional', 'coffee-round', 'tv-console'],
  dining: (r) => [r.area >= 150 ? 'table-6' : 'table-4'],
  office: () => ['desk', 'office-chair', 'bookshelf'],
  flex: () => ['desk-small', 'armchair'],
  entry: () => ['shoe-bench'],
  mudroom: () => ['shoe-bench'],
};

export function autoFurnish(floor: RFloor, existing: PlacedItem[]): PlacedItem[] {
  const placed = [...existing];
  const added: PlacedItem[] = [];
  for (const room of floor.rooms) {
    const list = PLAN[room.type]?.(room) ?? [];
    for (const item of list) {
      const spot = findSpot(floor, placed, item, room);
      if (!spot) continue;
      const p: PlacedItem = { uid: newUid(), item, floor: floor.id, ...spot };
      placed.push(p);
      added.push(p);
    }
  }
  return added;
}
