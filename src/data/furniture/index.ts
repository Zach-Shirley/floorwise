import type { FurnitureDef } from '../../engine/types';
import { FURNITURE } from './catalog';

export { FURNITURE };

const byId = new Map(FURNITURE.map((f) => [f.id, f]));

export const getFurniture = (id: string): FurnitureDef | undefined => byId.get(id);

/** Palette order: the rooms people decorate most come first. */
const ORDER = ['Beds', 'Bedroom', 'Office', 'Tech', 'Living', 'Wall', 'Lighting', 'Decor', 'Dining', 'Workshop', 'Hobby', 'Fitness', 'Storage', 'Kitchen', 'Bath', 'Laundry', 'Outdoor'];
export const FURNITURE_CATEGORIES = [...new Set(FURNITURE.map((f) => f.category))].sort(
  (a, b) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99,
);
