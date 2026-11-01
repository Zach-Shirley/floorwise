import type { FurnitureDef } from '../../engine/types';

/**
 * The furniture catalog. All sizes are INCHES: w = side to side as you face the
 * front, d = back to front. To add a piece, copy a line and change it; it shows
 * up in the Furniture panel automatically. `symbol` picks the top-down drawing
 * (see src/ui/symbols.tsx); use 'generic' if nothing fits.
 *
 * Bed sizes are the footprint of a simple frame (mattress + about 3-4").
 * Real products vary by a few inches, so check before you buy.
 */
export const FURNITURE: FurnitureDef[] = [
  // --- Beds -------------------------------------------------------------
  { id: 'bed-twin', name: 'Twin bed', category: 'Beds', w: 41, d: 80, symbol: 'bed', detail: 'Mattress 38" x 75"', clearance: { front: 24, sides: 24 }, tip: 'Good for kids rooms and guest rooms under 10\' wide.' },
  { id: 'bed-twin-xl', name: 'Twin XL bed', category: 'Beds', w: 41, d: 85, symbol: 'bed', detail: 'Mattress 38" x 80"', clearance: { front: 24, sides: 24 }, tip: 'Five inches longer than a twin: dorm standard, fits tall teens.' },
  { id: 'bed-full', name: 'Full bed', category: 'Beds', w: 57, d: 80, symbol: 'bed', detail: 'Mattress 54" x 75"', clearance: { front: 24, sides: 24 } },
  { id: 'bed-queen', name: 'Queen bed', category: 'Beds', w: 63, d: 84, symbol: 'bed', detail: 'Mattress 60" x 80"', clearance: { front: 24, sides: 24 }, tip: 'Most common adult bed. Aim for a room at least 10\' x 10\' (better 10\' x 12\').' },
  { id: 'bed-king', name: 'King bed', category: 'Beds', w: 79, d: 84, symbol: 'bed', detail: 'Mattress 76" x 80"', clearance: { front: 24, sides: 24 }, tip: 'Needs about 12\' x 12\' to keep walkways on both sides.' },
  { id: 'bed-cal-king', name: 'California king bed', category: 'Beds', w: 75, d: 88, symbol: 'bed', detail: 'Mattress 72" x 84"', clearance: { front: 24, sides: 24 }, tip: 'Narrower and longer than a king.' },
  { id: 'bunk-twin', name: 'Bunk bed (twin)', category: 'Beds', w: 42, d: 80, symbol: 'bunk', clearance: { front: 30 } },
  { id: 'crib', name: 'Crib', category: 'Beds', w: 30, d: 54, symbol: 'crib', clearance: { front: 30 } },

  // --- Bedroom ----------------------------------------------------------
  { id: 'nightstand', name: 'Nightstand', category: 'Bedroom', w: 24, d: 18, symbol: 'nightstand' },
  { id: 'dresser-6', name: 'Dresser (6 drawer)', category: 'Bedroom', w: 60, d: 20, symbol: 'dresser', clearance: { front: 36 }, tip: 'Leave about 36" in front so drawers open while you stand there.' },
  { id: 'chest-5', name: 'Tall chest', category: 'Bedroom', w: 36, d: 20, symbol: 'dresser', clearance: { front: 36 } },
  { id: 'wardrobe', name: 'Wardrobe', category: 'Bedroom', w: 40, d: 24, symbol: 'wardrobe', clearance: { front: 30 } },
  { id: 'bench-bed', name: 'Bed bench', category: 'Bedroom', w: 48, d: 16, symbol: 'side-table' },

  // --- Living -----------------------------------------------------------
  { id: 'sofa-3', name: 'Sofa (3 seat)', category: 'Living', w: 84, d: 38, symbol: 'sofa', clearance: { front: 18 }, tip: '14-18" between sofa and coffee table is comfortable reach.' },
  { id: 'sofa-apartment', name: 'Apartment sofa', category: 'Living', w: 72, d: 34, symbol: 'sofa', clearance: { front: 18 } },
  { id: 'loveseat', name: 'Loveseat', category: 'Living', w: 62, d: 36, symbol: 'loveseat', clearance: { front: 18 } },
  { id: 'sectional', name: 'Sectional (L)', category: 'Living', w: 112, d: 86, symbol: 'sectional', clearance: { front: 18 }, tip: 'Sectionals eat floor space fast: check the walkway behind and beside it.' },
  { id: 'armchair', name: 'Armchair', category: 'Living', w: 32, d: 34, symbol: 'armchair', clearance: { front: 18 } },
  { id: 'recliner', name: 'Recliner', category: 'Living', w: 36, d: 40, symbol: 'armchair', clearance: { front: 30 }, tip: 'Recliners need 12-24" behind or in front to recline.' },
  { id: 'coffee-table', name: 'Coffee table', category: 'Living', w: 48, d: 24, symbol: 'coffee-table' },
  { id: 'coffee-round', name: 'Round coffee table', category: 'Living', w: 36, d: 36, symbol: 'coffee-table', round: true },
  { id: 'side-table', name: 'Side table', category: 'Living', w: 22, d: 22, symbol: 'side-table' },
  { id: 'tv-console', name: 'TV console', category: 'Living', w: 60, d: 18, symbol: 'tv-console', tip: 'Seating distance is roughly 1.5x the screen diagonal for 4K.' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'Living', w: 36, d: 14, symbol: 'bookshelf' },
  { id: 'piano-upright', name: 'Upright piano', category: 'Living', w: 58, d: 24, symbol: 'piano', clearance: { front: 36 } },
  { id: 'rug-5x8', name: "Rug 5' x 8'", category: 'Decor', w: 96, d: 60, symbol: 'rug', flat: true },
  { id: 'rug-8x10', name: "Rug 8' x 10'", category: 'Decor', w: 120, d: 96, symbol: 'rug', flat: true, tip: 'In a living room, a rug big enough for the front legs of every seat ties the group together.' },
  { id: 'rug-runner', name: 'Runner rug', category: 'Decor', w: 30, d: 96, symbol: 'rug', flat: true },
  { id: 'plant', name: 'Floor plant', category: 'Decor', w: 18, d: 18, symbol: 'plant', round: true },

  // --- Dining -----------------------------------------------------------
  { id: 'table-4', name: 'Dining table (4)', category: 'Dining', w: 48, d: 30, symbol: 'table-rect', clearance: { front: 36, sides: 36 }, tip: '36" from table edge to wall lets someone slide a chair out; 44" lets people walk behind.' },
  { id: 'table-6', name: 'Dining table (6)', category: 'Dining', w: 72, d: 36, symbol: 'table-rect', clearance: { front: 36, sides: 36 } },
  { id: 'table-8', name: 'Dining table (8)', category: 'Dining', w: 96, d: 40, symbol: 'table-rect', clearance: { front: 36, sides: 36 } },
  { id: 'table-round-4', name: 'Round table (4)', category: 'Dining', w: 42, d: 42, symbol: 'table-round', round: true, clearance: { front: 36, sides: 36 } },
  { id: 'dining-chair', name: 'Dining chair', category: 'Dining', w: 18, d: 20, symbol: 'chair' },
  { id: 'bar-stool', name: 'Bar stool', category: 'Dining', w: 16, d: 16, symbol: 'stool', round: true },

  // --- Office -----------------------------------------------------------
  { id: 'desk', name: 'Desk', category: 'Office', w: 60, d: 30, symbol: 'desk', clearance: { front: 36 }, tip: 'Give the chair about 36" behind the desk edge.' },
  { id: 'desk-small', name: 'Compact desk', category: 'Office', w: 42, d: 22, symbol: 'desk', clearance: { front: 32 } },
  { id: 'office-chair', name: 'Office chair', category: 'Office', w: 26, d: 26, symbol: 'office-chair', round: true },
  { id: 'file-cabinet', name: 'File cabinet', category: 'Office', w: 15, d: 25, symbol: 'dresser', clearance: { front: 30 } },

  // --- Kitchen (usually built in) ---------------------------------------
  { id: 'counter', name: 'Base cabinet + counter', category: 'Kitchen', w: 36, d: 25, symbol: 'counter', builtIn: true, resizable: true, tip: 'Standard counters are 24-25" deep and 36" high.' },
  { id: 'island', name: 'Kitchen island', category: 'Kitchen', w: 72, d: 36, symbol: 'island', builtIn: true, resizable: true, clearance: { front: 42, sides: 36 }, tip: '42" aisles for one cook, 48" for two.' },
  { id: 'sink-kitchen', name: 'Kitchen sink base', category: 'Kitchen', w: 36, d: 25, symbol: 'sink-kitchen', builtIn: true },
  { id: 'range-30', name: 'Range 30"', category: 'Kitchen', w: 30, d: 26, symbol: 'range', builtIn: true, clearance: { front: 36 } },
  { id: 'range-36', name: 'Range 36"', category: 'Kitchen', w: 36, d: 27, symbol: 'range', builtIn: true, clearance: { front: 36 } },
  { id: 'fridge-30', name: 'Refrigerator 30"', category: 'Kitchen', w: 30, d: 30, symbol: 'fridge', builtIn: true, clearance: { front: 36 } },
  { id: 'fridge-36', name: 'Refrigerator 36"', category: 'Kitchen', w: 36, d: 31, symbol: 'fridge', builtIn: true, clearance: { front: 36 } },
  { id: 'dishwasher', name: 'Dishwasher', category: 'Kitchen', w: 24, d: 25, symbol: 'dishwasher', builtIn: true, clearance: { front: 27 } },

  // --- Bath (usually built in) ------------------------------------------
  { id: 'toilet', name: 'Toilet', category: 'Bath', w: 20, d: 28, symbol: 'toilet', builtIn: true, clearance: { front: 21, sides: 5 }, tip: 'Code: 15" from the toilet centerline to any side wall, 21" clear in front (24"+ feels better).' },
  { id: 'vanity-24', name: 'Vanity 24"', category: 'Bath', w: 24, d: 21, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-30', name: 'Vanity 30"', category: 'Bath', w: 30, d: 21, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-36', name: 'Vanity 36"', category: 'Bath', w: 36, d: 22, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-60', name: 'Double vanity 60"', category: 'Bath', w: 60, d: 22, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-72', name: 'Double vanity 72"', category: 'Bath', w: 72, d: 22, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'tub', name: 'Bathtub 60"', category: 'Bath', w: 60, d: 30, symbol: 'tub', builtIn: true, tip: 'A 5\' alcove tub sets the classic 5\' x 8\' hall bathroom.' },
  { id: 'tub-soaker', name: 'Soaking tub 66"', category: 'Bath', w: 66, d: 34, symbol: 'tub', builtIn: true },
  { id: 'shower-36', name: 'Shower 36" x 36"', category: 'Bath', w: 36, d: 36, symbol: 'shower', builtIn: true },
  { id: 'shower-48', name: 'Shower 48" x 36"', category: 'Bath', w: 48, d: 36, symbol: 'shower', builtIn: true },
  { id: 'shower-60', name: 'Shower 60" x 36"', category: 'Bath', w: 60, d: 36, symbol: 'shower', builtIn: true },

  // --- Laundry & storage ------------------------------------------------
  { id: 'washer', name: 'Washer', category: 'Laundry', w: 27, d: 30, symbol: 'washer', builtIn: true, clearance: { front: 36 } },
  { id: 'dryer', name: 'Dryer', category: 'Laundry', w: 27, d: 30, symbol: 'dryer', builtIn: true, clearance: { front: 36 } },
  { id: 'stack-wd', name: 'Stacked washer/dryer', category: 'Laundry', w: 27, d: 31, symbol: 'washer', builtIn: true, clearance: { front: 36 } },
  { id: 'water-heater', name: 'Water heater', category: 'Laundry', w: 24, d: 24, symbol: 'water-heater', builtIn: true, round: true },
  { id: 'shelving', name: 'Shelving unit', category: 'Storage', w: 48, d: 18, symbol: 'bookshelf' },
  { id: 'cabinet-storage', name: 'Storage cabinet', category: 'Storage', w: 36, d: 18, symbol: 'wardrobe', clearance: { front: 30 } },
  { id: 'shoe-bench', name: 'Entry bench', category: 'Storage', w: 42, d: 16, symbol: 'side-table' },

  // --- Outdoor ----------------------------------------------------------
  { id: 'patio-set', name: 'Patio table (4)', category: 'Outdoor', w: 42, d: 42, symbol: 'table-round', round: true, clearance: { sides: 30, front: 30 } },
  { id: 'lounger', name: 'Lounge chair', category: 'Outdoor', w: 28, d: 76, symbol: 'armchair' },
  { id: 'grill', name: 'Grill', category: 'Outdoor', w: 58, d: 24, symbol: 'generic', clearance: { front: 36 } },
];
