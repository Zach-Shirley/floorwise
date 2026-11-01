import type { FurnitureDef } from '../../engine/types';
import { FURNITURE } from './catalog';

export { FURNITURE };

const byId = new Map(FURNITURE.map((f) => [f.id, f]));

export const getFurniture = (id: string): FurnitureDef | undefined => byId.get(id);

export const FURNITURE_CATEGORIES = [...new Set(FURNITURE.map((f) => f.category))];
