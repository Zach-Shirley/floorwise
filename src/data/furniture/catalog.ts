import type { FurnitureDef } from '../../engine/types';

/**
 * The furniture catalog. All sizes are INCHES: w = side to side as you face the
 * front, d = back to front, h = height. To add a piece, copy a line and change
 * it; it shows up in the Furniture panel automatically. `symbol` picks the
 * top-down drawing (see src/ui/symbols.tsx); use 'generic' if nothing fits.
 *
 * Height decides what can stack:
 *   - `mount: 'surface'` pieces (monitors, lamps) rest on whatever is under them.
 *   - `mount: 'wall'` pieces (shelves, posters, wall TVs) hang at `elev` inches.
 *   - `clearUnder` is open space beneath (a desk's knee room), so a PC tower or
 *     a chair can go under it.
 *
 * Sizes are typical, not any one product. Real pieces vary by a few inches,
 * so check before you buy.
 */
export const FURNITURE: FurnitureDef[] = [
  // --- Beds -------------------------------------------------------------
  // Bed footprints are a simple frame (mattress + 3-4"); h is the top of the mattress.
  { id: 'bed-twin', name: 'Twin bed', category: 'Beds', w: 41, d: 80, h: 24, symbol: 'bed', detail: 'Mattress 38" x 75"', clearance: { front: 24, sides: 24 }, tip: 'Good for kids rooms and guest rooms under 10\' wide.' },
  { id: 'bed-twin-xl', name: 'Twin XL bed', category: 'Beds', w: 41, d: 85, h: 24, symbol: 'bed', detail: 'Mattress 38" x 80"', clearance: { front: 24, sides: 24 }, tip: 'Five inches longer than a twin: dorm standard, fits tall teens.' },
  { id: 'bed-full', name: 'Full bed', category: 'Beds', w: 57, d: 80, h: 24, symbol: 'bed', detail: 'Mattress 54" x 75"', clearance: { front: 24, sides: 24 } },
  { id: 'bed-queen', name: 'Queen bed', category: 'Beds', w: 63, d: 84, h: 24, symbol: 'bed', detail: 'Mattress 60" x 80"', clearance: { front: 24, sides: 24 }, tip: 'Most common adult bed. Aim for a room at least 10\' x 10\' (better 10\' x 12\').' },
  { id: 'bed-king', name: 'King bed', category: 'Beds', w: 79, d: 84, h: 24, symbol: 'bed', detail: 'Mattress 76" x 80"', clearance: { front: 24, sides: 24 }, tip: 'Needs about 12\' x 12\' to keep walkways on both sides.' },
  { id: 'bed-cal-king', name: 'California king bed', category: 'Beds', w: 75, d: 88, h: 24, symbol: 'bed', detail: 'Mattress 72" x 84"', clearance: { front: 24, sides: 24 }, tip: 'Narrower and longer than a king: good if you are over 6\' tall.' },
  { id: 'daybed', name: 'Daybed', category: 'Beds', w: 41, d: 80, h: 32, symbol: 'bed', detail: 'Twin mattress, backrest on three sides', clearance: { front: 24 }, tip: 'Sofa by day, guest bed by night. Usually placed long side against a wall.' },
  { id: 'bunk-twin', name: 'Bunk bed (twin/twin)', category: 'Beds', w: 42, d: 80, h: 65, symbol: 'bunk', clearance: { front: 30 }, tip: 'Needs about 30" between the top mattress and the ceiling, so 8\' ceilings are the minimum.' },
  { id: 'bunk-twin-full', name: 'Bunk bed (twin over full)', category: 'Beds', w: 57, d: 80, h: 65, symbol: 'bunk', clearance: { front: 30 } },
  { id: 'loft-twin', name: 'Loft bed (twin)', category: 'Beds', w: 42, d: 80, h: 72, clearUnder: 56, symbol: 'loft-bed', clearance: { front: 24 }, tip: 'The bed is up high and the floor underneath is free: slide a desk, dresser or couch under it.' },
  { id: 'loft-full', name: 'Loft bed (full)', category: 'Beds', w: 57, d: 80, h: 72, clearUnder: 56, symbol: 'loft-bed', clearance: { front: 24 }, tip: 'A full-size loft frees up a 5\' x 7\' patch of floor: room for a desk and a chair.' },
  { id: 'murphy-queen', name: 'Murphy bed (queen, closed)', category: 'Beds', w: 66, d: 18, h: 86, symbol: 'wardrobe', clearance: { front: 84 }, tip: 'Folds into the wall. The clear zone shows where the bed lands when it is pulled down.' },
  { id: 'crib', name: 'Crib', category: 'Beds', w: 30, d: 54, h: 40, symbol: 'crib', clearance: { front: 30 } },

  // --- Bedroom ----------------------------------------------------------
  { id: 'nightstand', name: 'Nightstand', category: 'Bedroom', w: 24, d: 18, h: 26, symbol: 'nightstand', tip: 'Match its top to the mattress height, within a couple of inches.' },
  { id: 'nightstand-slim', name: 'Slim nightstand', category: 'Bedroom', w: 16, d: 14, h: 24, symbol: 'nightstand' },
  { id: 'dresser-6', name: 'Dresser (6 drawer)', category: 'Bedroom', w: 60, d: 20, h: 34, symbol: 'dresser', clearance: { front: 36 }, tip: 'Leave about 36" in front so drawers open while you stand there.' },
  { id: 'dresser-low', name: 'Low dresser / media chest', category: 'Bedroom', w: 48, d: 18, h: 30, symbol: 'dresser', clearance: { front: 36 }, tip: 'Low enough to put a TV on top, facing the bed.' },
  { id: 'chest-5', name: 'Tall chest', category: 'Bedroom', w: 36, d: 20, h: 50, symbol: 'dresser', clearance: { front: 36 } },
  { id: 'wardrobe', name: 'Wardrobe', category: 'Bedroom', w: 40, d: 24, h: 72, symbol: 'wardrobe', clearance: { front: 30 } },
  { id: 'armoire', name: 'Armoire', category: 'Bedroom', w: 48, d: 24, h: 80, symbol: 'wardrobe', clearance: { front: 30 }, tip: 'Tall pieces block light: keep them off the window wall.' },
  { id: 'clothes-rack', name: 'Clothing rack', category: 'Bedroom', w: 48, d: 20, h: 64, symbol: 'rack', clearance: { front: 24 } },
  { id: 'makeup-vanity', name: 'Makeup vanity', category: 'Bedroom', w: 42, d: 18, h: 30, clearUnder: 25, symbol: 'desk', clearance: { front: 30 } },
  { id: 'bench-bed', name: 'Bed bench', category: 'Bedroom', w: 48, d: 16, h: 18, symbol: 'side-table' },
  { id: 'mirror-floor', name: 'Floor mirror (leaning)', category: 'Bedroom', w: 24, d: 4, h: 65, symbol: 'mirror' },
  { id: 'hamper', name: 'Laundry hamper', category: 'Bedroom', w: 18, d: 14, h: 26, symbol: 'generic' },

  // --- Living -----------------------------------------------------------
  { id: 'sofa-3', name: 'Sofa (3 seat)', category: 'Living', w: 84, d: 38, h: 34, symbol: 'sofa', clearance: { front: 18 }, tip: '14-18" between sofa and coffee table is comfortable reach.' },
  { id: 'sofa-apartment', name: 'Apartment sofa', category: 'Living', w: 72, d: 34, h: 32, symbol: 'sofa', clearance: { front: 18 } },
  { id: 'sofa-large', name: 'Large sofa (4 seat)', category: 'Living', w: 96, d: 40, h: 34, symbol: 'sofa', clearance: { front: 18 } },
  { id: 'loveseat', name: 'Loveseat', category: 'Living', w: 62, d: 36, h: 34, symbol: 'loveseat', clearance: { front: 18 } },
  { id: 'futon', name: 'Futon', category: 'Living', w: 80, d: 34, h: 32, symbol: 'sofa', clearance: { front: 48 }, tip: 'Flattens into a full bed about 54" deep: the clear zone shows the room it needs.' },
  { id: 'sectional', name: 'Sectional (chaise left)', category: 'Living', w: 112, d: 86, h: 34, symbol: 'sectional', parts: [[0, 0, 112, 38], [0, 38, 38, 48]], clearance: { front: 18 }, tip: 'Sectionals eat floor space fast: check the walkway behind and beside it.' },
  { id: 'sectional-r', name: 'Sectional (chaise right)', category: 'Living', w: 112, d: 86, h: 34, symbol: 'sectional', flip: true, parts: [[0, 0, 112, 38], [74, 38, 38, 48]], clearance: { front: 18 } },
  { id: 'chaise', name: 'Chaise lounge', category: 'Living', w: 30, d: 65, h: 32, symbol: 'armchair' },
  { id: 'armchair', name: 'Armchair', category: 'Living', w: 32, d: 34, h: 34, symbol: 'armchair', clearance: { front: 18 } },
  { id: 'accent-chair', name: 'Accent chair', category: 'Living', w: 28, d: 30, h: 32, symbol: 'armchair', clearance: { front: 18 } },
  { id: 'swivel-chair', name: 'Swivel chair', category: 'Living', w: 32, d: 32, h: 32, symbol: 'armchair', round: true, clearance: { front: 18 } },
  { id: 'recliner', name: 'Recliner', category: 'Living', w: 36, d: 40, h: 40, symbol: 'armchair', clearance: { front: 30 }, tip: 'Recliners need 12-24" behind or in front to recline.' },
  { id: 'rocking-chair', name: 'Rocking chair', category: 'Living', w: 26, d: 34, h: 40, symbol: 'armchair', clearance: { front: 12 } },
  { id: 'beanbag', name: 'Bean bag', category: 'Living', w: 36, d: 36, h: 28, symbol: 'beanbag', round: true },
  { id: 'ottoman', name: 'Ottoman', category: 'Living', w: 30, d: 20, h: 18, symbol: 'ottoman' },
  { id: 'pouf', name: 'Pouf', category: 'Living', w: 20, d: 20, h: 16, symbol: 'ottoman', round: true },
  { id: 'coffee-table', name: 'Coffee table', category: 'Living', w: 48, d: 24, h: 18, symbol: 'coffee-table' },
  { id: 'coffee-round', name: 'Round coffee table', category: 'Living', w: 36, d: 36, h: 18, symbol: 'coffee-table', round: true },
  { id: 'side-table', name: 'Side table', category: 'Living', w: 22, d: 22, h: 24, symbol: 'side-table' },
  { id: 'side-round', name: 'Round side table', category: 'Living', w: 18, d: 18, h: 24, symbol: 'side-table', round: true },
  { id: 'console-table', name: 'Console table', category: 'Living', w: 48, d: 14, h: 30, symbol: 'side-table', tip: 'Slim table for behind a sofa or along an entry wall.' },
  { id: 'tv-console', name: 'TV console', category: 'Living', w: 60, d: 18, h: 22, symbol: 'tv-console', tip: 'Seating distance is roughly 1.5x the screen diagonal for 4K.' },
  { id: 'tv-console-xl', name: 'TV console (wide)', category: 'Living', w: 72, d: 18, h: 22, symbol: 'tv-console' },
  { id: 'tv-55-stand', name: '55" TV on stand', category: 'Living', w: 49, d: 10, h: 31, mount: 'surface', sitsOn: ['tv-console', 'dresser'], symbol: 'tv', tip: 'Goes on a console or dresser. Its center should land near seated eye level, about 42".' },
  { id: 'tv-65-stand', name: '65" TV on stand', category: 'Living', w: 57, d: 12, h: 35, mount: 'surface', sitsOn: ['tv-console', 'dresser'], symbol: 'tv' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'Living', w: 36, d: 14, h: 72, symbol: 'bookshelf' },
  { id: 'bookshelf-wide', name: 'Bookshelf (wide, tall)', category: 'Living', w: 48, d: 14, h: 84, symbol: 'bookshelf' },
  { id: 'bookshelf-narrow', name: 'Bookshelf (narrow)', category: 'Living', w: 24, d: 12, h: 72, symbol: 'bookshelf' },
  { id: 'bookshelf-low', name: 'Low bookcase', category: 'Living', w: 36, d: 12, h: 30, symbol: 'bookshelf', tip: 'Waist height leaves wall space above for art or a mounted shelf.' },
  { id: 'cube-shelf', name: 'Cube shelf (3 x 3)', category: 'Living', w: 44, d: 15, h: 44, symbol: 'bookshelf' },
  { id: 'ladder-shelf', name: 'Ladder shelf', category: 'Living', w: 24, d: 16, h: 72, symbol: 'bookshelf' },
  { id: 'piano-upright', name: 'Upright piano', category: 'Living', w: 58, d: 24, h: 50, symbol: 'piano', clearance: { front: 36 } },
  { id: 'piano-grand', name: 'Baby grand piano', category: 'Living', w: 58, d: 62, h: 40, symbol: 'piano', clearance: { front: 36 } },
  { id: 'divider', name: 'Folding screen', category: 'Living', w: 66, d: 12, h: 70, symbol: 'divider', tip: 'Splits an open room without building a wall: a sleeping nook, a desk corner.' },

  // --- Decor ------------------------------------------------------------
  { id: 'rug-5x8', name: "Rug 5' x 8'", category: 'Decor', w: 96, d: 60, h: 0.5, symbol: 'rug', flat: true },
  { id: 'rug-8x10', name: "Rug 8' x 10'", category: 'Decor', w: 120, d: 96, h: 0.5, symbol: 'rug', flat: true, tip: 'In a living room, a rug big enough for the front legs of every seat ties the group together.' },
  { id: 'rug-9x12', name: "Rug 9' x 12'", category: 'Decor', w: 144, d: 108, h: 0.5, symbol: 'rug', flat: true },
  { id: 'rug-round', name: "Round rug 6'", category: 'Decor', w: 72, d: 72, h: 0.5, symbol: 'rug', round: true, flat: true },
  { id: 'rug-runner', name: 'Runner rug', category: 'Decor', w: 30, d: 96, h: 0.5, symbol: 'rug', flat: true },
  { id: 'plant', name: 'Floor plant', category: 'Decor', w: 18, d: 18, h: 48, symbol: 'plant', round: true },
  { id: 'plant-tall', name: 'Tall plant (tree)', category: 'Decor', w: 26, d: 26, h: 72, symbol: 'plant', round: true },
  { id: 'plant-small', name: 'Small potted plant', category: 'Decor', w: 10, d: 10, h: 14, symbol: 'plant', round: true, mount: 'surface', sitsOn: ['shelf-wall', 'side-table', 'desk', 'dresser'] },
  { id: 'aquarium', name: 'Aquarium on stand (55 gal)', category: 'Decor', w: 49, d: 13, h: 52, symbol: 'aquarium', clearance: { front: 24 } },

  // --- Wall (hangs on a wall; set its height in the inspector) ----------
  { id: 'shelf-24', name: 'Floating shelf 24"', category: 'Wall', w: 24, d: 8, h: 10, mount: 'wall', elev: 54, symbol: 'shelf-wall', tip: 'The h includes the things on it. Over a dresser or desk, 18-24" above the top is typical.' },
  { id: 'shelf-36', name: 'Floating shelf 36"', category: 'Wall', w: 36, d: 8, h: 10, mount: 'wall', elev: 54, symbol: 'shelf-wall' },
  { id: 'shelf-48', name: 'Floating shelf 48"', category: 'Wall', w: 48, d: 10, h: 12, mount: 'wall', elev: 54, symbol: 'shelf-wall' },
  { id: 'shelf-bookcase-wall', name: 'Wall bookcase', category: 'Wall', w: 36, d: 10, h: 30, mount: 'wall', elev: 50, symbol: 'bookshelf', tip: 'A mounted bookcase over a dresser or desk adds storage without taking floor.' },
  { id: 'wall-cabinet', name: 'Wall cabinet', category: 'Wall', w: 30, d: 12, h: 30, mount: 'wall', elev: 54, symbol: 'wardrobe' },
  { id: 'wall-desk', name: 'Wall-mounted desk', category: 'Wall', w: 48, d: 20, h: 2, mount: 'wall', elev: 28, symbol: 'desk', clearance: { front: 32 }, tip: 'A fold-down or floating desk: floor stays clear underneath.' },
  { id: 'poster-18x24', name: 'Poster 18" x 24"', category: 'Wall', w: 18, d: 1, h: 24, mount: 'wall', elev: 50, symbol: 'art', tip: 'Hang art so its center is about 57-60" off the floor (gallery standard).' },
  { id: 'poster-24x36', name: 'Poster 24" x 36"', category: 'Wall', w: 24, d: 1, h: 36, mount: 'wall', elev: 42, symbol: 'art' },
  { id: 'poster-27x40', name: 'Movie poster 27" x 40"', category: 'Wall', w: 27, d: 1, h: 40, mount: 'wall', elev: 40, symbol: 'art' },
  { id: 'art-large', name: 'Framed art (large)', category: 'Wall', w: 40, d: 2, h: 30, mount: 'wall', elev: 44, symbol: 'art', tip: 'Over a sofa or bed, art about 2/3 of the furniture width looks balanced.' },
  { id: 'gallery-wall', name: 'Gallery wall (group)', category: 'Wall', w: 60, d: 2, h: 40, mount: 'wall', elev: 40, symbol: 'art' },
  { id: 'mirror-wall', name: 'Wall mirror', category: 'Wall', w: 24, d: 2, h: 36, mount: 'wall', elev: 42, symbol: 'mirror' },
  { id: 'clock', name: 'Wall clock', category: 'Wall', w: 12, d: 2, h: 12, mount: 'wall', elev: 66, symbol: 'art', round: true },
  { id: 'coat-hooks', name: 'Coat hooks', category: 'Wall', w: 30, d: 5, h: 6, mount: 'wall', elev: 60, symbol: 'shelf-wall' },
  { id: 'tv-55-wall', name: '55" TV (wall)', category: 'Wall', w: 49, d: 3, h: 28, mount: 'wall', elev: 42, symbol: 'tv', tip: 'Wall TVs usually sit lower than people expect: center around 42" when seated, higher in a bedroom.' },
  { id: 'tv-65-wall', name: '65" TV (wall)', category: 'Wall', w: 57, d: 3, h: 33, mount: 'wall', elev: 38, symbol: 'tv' },
  { id: 'tv-75-wall', name: '75" TV (wall)', category: 'Wall', w: 66, d: 3, h: 38, mount: 'wall', elev: 36, symbol: 'tv' },
  { id: 'tv-85-wall', name: '85" TV (wall)', category: 'Wall', w: 75, d: 3, h: 43, mount: 'wall', elev: 32, symbol: 'tv', tip: 'Big screens want distance: about 9-10\' from the couch for 85".' },
  { id: 'guitar-hanger', name: 'Guitar on wall hanger', category: 'Wall', w: 16, d: 4, h: 42, mount: 'wall', elev: 36, symbol: 'guitar' },
  { id: 'pegboard', name: 'Pegboard with tools', category: 'Wall', w: 48, d: 4, h: 32, mount: 'wall', elev: 44, symbol: 'pegboard', tip: 'Over a workbench, start it just above the bench top.' },
  { id: 'lumber-rack', name: 'Lumber rack', category: 'Wall', w: 48, d: 14, h: 48, mount: 'wall', elev: 30, symbol: 'shelf-wall' },

  // --- Lighting ---------------------------------------------------------
  { id: 'floor-lamp', name: 'Floor lamp', category: 'Lighting', w: 14, d: 14, h: 64, symbol: 'floor-lamp', round: true },
  { id: 'arc-lamp', name: 'Arc floor lamp', category: 'Lighting', w: 16, d: 16, h: 80, symbol: 'floor-lamp', round: true, tip: 'The base goes beside the sofa and the shade reaches over it.' },
  { id: 'table-lamp', name: 'Table lamp', category: 'Lighting', w: 14, d: 14, h: 24, symbol: 'lamp', round: true, mount: 'surface', sitsOn: ['nightstand', 'side-table', 'dresser', 'desk'] },
  { id: 'desk-lamp', name: 'Desk lamp', category: 'Lighting', w: 8, d: 8, h: 18, symbol: 'lamp', round: true, mount: 'surface', sitsOn: ['desk', 'desk-l', 'nightstand'] },
  { id: 'ceiling-fan', name: 'Ceiling fan 52"', category: 'Lighting', w: 52, d: 52, h: 12, symbol: 'ceiling-fan', round: true, mount: 'ceiling', tip: 'Blades should be at least 7\' off the floor. A 52" fan suits rooms up to about 225 sq ft.' },
  { id: 'pendant', name: 'Pendant light', category: 'Lighting', w: 16, d: 16, h: 24, symbol: 'pendant', round: true, mount: 'ceiling', tip: 'Over a table, hang the bottom 30-36" above the tabletop.' },
  { id: 'chandelier', name: 'Chandelier', category: 'Lighting', w: 28, d: 28, h: 30, symbol: 'pendant', round: true, mount: 'ceiling' },
  { id: 'led-strip-4', name: "LED strip 4'", category: 'Lighting', w: 48, d: 1, h: 1, mount: 'wall', elev: 90, symbol: 'led-strip', tip: 'Placeholder for lighting plans: high on a wall for a glow off the ceiling, or lower behind a desk or TV.' },
  { id: 'led-strip-8', name: "LED strip 8'", category: 'Lighting', w: 96, d: 1, h: 1, mount: 'wall', elev: 90, symbol: 'led-strip' },

  // --- Dining -----------------------------------------------------------
  { id: 'table-4', name: 'Dining table (4)', category: 'Dining', w: 48, d: 30, h: 30, clearUnder: 26, symbol: 'table-rect', clearance: { front: 36, sides: 36 }, tip: '36" from table edge to wall lets someone slide a chair out; 44" lets people walk behind.' },
  { id: 'table-6', name: 'Dining table (6)', category: 'Dining', w: 72, d: 36, h: 30, clearUnder: 26, symbol: 'table-rect', clearance: { front: 36, sides: 36 } },
  { id: 'table-8', name: 'Dining table (8)', category: 'Dining', w: 96, d: 40, h: 30, clearUnder: 26, symbol: 'table-rect', clearance: { front: 36, sides: 36 } },
  { id: 'table-round-4', name: 'Round table (4)', category: 'Dining', w: 42, d: 42, h: 30, clearUnder: 26, symbol: 'table-round', round: true, clearance: { front: 36, sides: 36 } },
  { id: 'table-round-6', name: 'Round table (6)', category: 'Dining', w: 60, d: 60, h: 30, clearUnder: 26, symbol: 'table-round', round: true, clearance: { front: 36, sides: 36 } },
  { id: 'pub-table', name: 'Pub table (high top)', category: 'Dining', w: 30, d: 30, h: 42, clearUnder: 36, symbol: 'table-round', round: true, clearance: { front: 30, sides: 30 } },
  { id: 'dining-chair', name: 'Dining chair', category: 'Dining', w: 18, d: 20, h: 34, tucks: true, symbol: 'chair' },
  { id: 'dining-bench', name: 'Dining bench', category: 'Dining', w: 60, d: 14, h: 18, tucks: true, symbol: 'side-table' },
  { id: 'bar-stool', name: 'Bar stool', category: 'Dining', w: 16, d: 16, h: 30, tucks: true, symbol: 'stool', round: true },
  { id: 'sideboard', name: 'Sideboard / buffet', category: 'Dining', w: 60, d: 18, h: 34, symbol: 'dresser', clearance: { front: 30 } },
  { id: 'hutch', name: 'China hutch', category: 'Dining', w: 48, d: 18, h: 78, symbol: 'wardrobe', clearance: { front: 30 } },
  { id: 'bar-cart', name: 'Bar cart', category: 'Dining', w: 30, d: 18, h: 34, symbol: 'side-table' },

  // --- Office -----------------------------------------------------------
  { id: 'desk-small', name: 'Compact desk', category: 'Office', w: 42, d: 22, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 32 } },
  { id: 'desk-writing', name: 'Writing desk', category: 'Office', w: 48, d: 24, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 36 } },
  { id: 'desk', name: 'Desk', category: 'Office', w: 60, d: 30, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 36 }, tip: 'Give the chair about 36" behind the desk edge.' },
  { id: 'desk-large', name: 'Large desk', category: 'Office', w: 72, d: 30, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 36 } },
  { id: 'desk-executive', name: 'Executive desk', category: 'Office', w: 72, d: 36, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 42 } },
  { id: 'desk-standing', name: 'Standing desk', category: 'Office', w: 60, d: 30, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 36 }, tip: 'Adjusts from about 25" to 50". Standing height is roughly elbow height: around 44-46" for a 6\'2" person.' },
  { id: 'desk-gaming', name: 'Gaming desk', category: 'Office', w: 63, d: 30, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 36 } },
  { id: 'desk-l', name: 'L-desk (return right)', category: 'Office', w: 60, d: 60, h: 30, clearUnder: 26, symbol: 'desk-l', parts: [[0, 0, 60, 24], [36, 24, 24, 36]], clearance: { front: 12 }, tip: 'Fits a corner: one wing on each wall, chair in the inside corner. Plan about 5\' x 5\' of floor.' },
  { id: 'desk-l-left', name: 'L-desk (return left)', category: 'Office', w: 60, d: 60, h: 30, clearUnder: 26, symbol: 'desk-l', flip: true, parts: [[0, 0, 60, 24], [0, 24, 24, 36]], clearance: { front: 12 } },
  { id: 'desk-l-large', name: 'L-desk large (return right)', category: 'Office', w: 72, d: 66, h: 30, clearUnder: 26, symbol: 'desk-l', parts: [[0, 0, 72, 30], [42, 30, 30, 36]], clearance: { front: 12 }, tip: 'Room for a multi-monitor setup on the long wing and a work surface on the return.' },
  { id: 'office-chair', name: 'Office chair', category: 'Office', w: 26, d: 26, h: 40, tucks: true, symbol: 'office-chair', round: true },
  { id: 'gaming-chair', name: 'Gaming chair', category: 'Office', w: 28, d: 28, h: 52, tucks: true, symbol: 'office-chair', round: true },
  { id: 'file-cabinet', name: 'File cabinet', category: 'Office', w: 15, d: 25, h: 28, under: true, symbol: 'dresser', clearance: { front: 30 } },
  { id: 'lateral-file', name: 'Lateral file cabinet', category: 'Office', w: 30, d: 18, h: 28, symbol: 'dresser', clearance: { front: 30 } },
  { id: 'pedestal', name: 'Rolling drawer pedestal', category: 'Office', w: 16, d: 20, h: 24, under: true, symbol: 'dresser', tip: 'Lives under the desk next to your knees.' },
  { id: 'chair-mat', name: 'Chair mat', category: 'Office', w: 48, d: 36, h: 0.25, symbol: 'rug', flat: true },

  // --- Tech -------------------------------------------------------------
  { id: 'monitor-24', name: 'Monitor 24"', category: 'Tech', w: 21, d: 8, h: 17, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'monitor', tip: 'Top of the screen at or slightly below eye level, about an arm\'s length away.' },
  { id: 'monitor-27', name: 'Monitor 27"', category: 'Tech', w: 24, d: 9, h: 20, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'monitor' },
  { id: 'monitor-32', name: 'Monitor 32"', category: 'Tech', w: 28, d: 10, h: 23, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'monitor' },
  { id: 'monitor-34uw', name: 'Ultrawide monitor 34"', category: 'Tech', w: 32, d: 10, h: 19, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'monitor', tip: 'Ultrawides want a desk at least 30" deep so you are not too close.' },
  { id: 'monitor-49uw', name: 'Super-ultrawide 49"', category: 'Tech', w: 47, d: 12, h: 21, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'monitor' },
  { id: 'monitor-dual', name: 'Dual 27" on an arm', category: 'Tech', w: 48, d: 10, h: 22, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'monitor' },
  { id: 'pc-mid', name: 'PC tower (mid)', category: 'Tech', w: 9, d: 18, h: 18, under: true, symbol: 'pc-tower', tip: 'Under the desk on the side away from where your legs go. Leave a few inches behind it for airflow and cables.' },
  { id: 'pc-full', name: 'PC tower (full)', category: 'Tech', w: 9, d: 21, h: 22, under: true, symbol: 'pc-tower' },
  { id: 'pc-sff', name: 'PC (small form factor)', category: 'Tech', w: 7, d: 14, h: 14, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'pc-tower' },
  { id: 'laptop', name: 'Laptop', category: 'Tech', w: 14, d: 10, h: 1, mount: 'surface', sitsOn: ['desk', 'desk-l', 'table-rect'], symbol: 'laptop' },
  { id: 'keyboard', name: 'Keyboard + mouse', category: 'Tech', w: 26, d: 8, h: 2, mount: 'surface', sitsOn: ['desk', 'desk-l'], symbol: 'keyboard' },
  { id: 'speaker-desk', name: 'Desk speaker', category: 'Tech', w: 6, d: 8, h: 10, mount: 'surface', sitsOn: ['desk', 'desk-l', 'tv-console'], symbol: 'speaker' },
  { id: 'speaker-floor', name: 'Floor speaker', category: 'Tech', w: 10, d: 12, h: 40, symbol: 'speaker' },
  { id: 'subwoofer', name: 'Subwoofer', category: 'Tech', w: 14, d: 15, h: 15, under: true, symbol: 'speaker' },
  { id: 'printer', name: 'Printer', category: 'Tech', w: 17, d: 15, h: 9, mount: 'surface', sitsOn: ['dresser', 'desk', 'side-table'], symbol: 'printer' },
  { id: 'game-console', name: 'Game console', category: 'Tech', w: 12, d: 10, h: 4, mount: 'surface', sitsOn: ['tv-console', 'dresser'], symbol: 'printer' },

  // --- Workshop ---------------------------------------------------------
  { id: 'workbench', name: 'Workbench 6\'', category: 'Workshop', w: 72, d: 30, h: 36, symbol: 'workbench', clearance: { front: 36 }, tip: 'Standing work height is about wrist height: 36-38" for most people, closer to 39" if you are tall.' },
  { id: 'workbench-8', name: 'Workbench 8\'', category: 'Workshop', w: 96, d: 30, h: 36, symbol: 'workbench', clearance: { front: 36 } },
  { id: 'tool-chest', name: 'Rolling tool chest', category: 'Workshop', w: 41, d: 24, h: 60, symbol: 'tool-chest', clearance: { front: 30 } },
  { id: 'table-saw', name: 'Table saw', category: 'Workshop', w: 40, d: 27, h: 36, symbol: 'workbench', clearance: { front: 48, sides: 36 }, tip: 'Needs room to feed long boards: plan about 8\' clear in front and behind the blade for full sheets.' },
  { id: 'drill-press', name: 'Drill press (floor)', category: 'Workshop', w: 14, d: 24, h: 66, symbol: 'tool-chest', clearance: { front: 30 } },
  { id: 'bandsaw', name: 'Bandsaw', category: 'Workshop', w: 30, d: 30, h: 70, symbol: 'tool-chest', clearance: { front: 36 } },
  { id: 'shop-vac', name: 'Shop vac', category: 'Workshop', w: 20, d: 20, h: 30, symbol: 'generic', round: true },
  { id: 'shelving', name: 'Shelving unit', category: 'Workshop', w: 48, d: 18, h: 72, symbol: 'bookshelf' },

  // --- Hobby & games ----------------------------------------------------
  { id: 'drafting-table', name: 'Drafting table', category: 'Hobby', w: 42, d: 30, h: 36, clearUnder: 28, symbol: 'desk', clearance: { front: 30 } },
  { id: 'drafting-stool', name: 'Drafting stool', category: 'Hobby', w: 18, d: 18, h: 30, tucks: true, symbol: 'stool', round: true },
  { id: 'easel', name: 'Easel', category: 'Hobby', w: 24, d: 28, h: 70, symbol: 'easel', clearance: { front: 36 } },
  { id: 'sewing-table', name: 'Sewing table', category: 'Hobby', w: 40, d: 20, h: 30, clearUnder: 26, symbol: 'desk', clearance: { front: 30 } },
  { id: 'printer-3d', name: '3D printer', category: 'Hobby', w: 18, d: 18, h: 20, mount: 'surface', sitsOn: ['workbench', 'desk', 'dresser'], symbol: 'printer' },
  { id: 'guitar-stand', name: 'Guitar on stand', category: 'Hobby', w: 16, d: 14, h: 42, symbol: 'guitar' },
  { id: 'keyboard-88', name: 'Digital piano (88 key)', category: 'Hobby', w: 54, d: 16, h: 30, clearUnder: 24, symbol: 'piano', clearance: { front: 30 } },
  { id: 'drums-electric', name: 'Electronic drum kit', category: 'Hobby', w: 50, d: 40, h: 50, symbol: 'drums' },
  { id: 'drums-acoustic', name: 'Acoustic drum kit', category: 'Hobby', w: 60, d: 54, h: 54, symbol: 'drums', tip: 'Loud: a room with no shared walls, or on a slab, is kindest to everyone.' },
  { id: 'pool-7', name: "Pool table 7'", category: 'Hobby', w: 92, d: 52, h: 31, symbol: 'pool-table', clearance: { front: 58, sides: 58 }, tip: 'You need about 5\' all around for a standard 58" cue. A 7\' table wants a room about 13\' x 17\'.' },
  { id: 'pool-8', name: "Pool table 8'", category: 'Hobby', w: 100, d: 56, h: 31, symbol: 'pool-table', clearance: { front: 58, sides: 58 } },
  { id: 'ping-pong', name: 'Ping pong table', category: 'Hobby', w: 108, d: 60, h: 30, symbol: 'ping-pong', clearance: { front: 60, sides: 72 }, tip: 'Casual play needs about 5\' at each end and 3\' at the sides; more for serious play.' },
  { id: 'foosball', name: 'Foosball table', category: 'Hobby', w: 56, d: 30, h: 36, symbol: 'ping-pong', clearance: { front: 36, sides: 18 } },
  { id: 'air-hockey', name: 'Air hockey table', category: 'Hobby', w: 84, d: 48, h: 32, symbol: 'ping-pong', clearance: { front: 36, sides: 36 } },
  { id: 'arcade', name: 'Arcade cabinet', category: 'Hobby', w: 26, d: 34, h: 70, symbol: 'arcade', clearance: { front: 36 } },
  { id: 'card-table', name: 'Card / game table', category: 'Hobby', w: 36, d: 36, h: 29, clearUnder: 25, symbol: 'table-rect', clearance: { front: 30, sides: 30 } },

  // --- Fitness ----------------------------------------------------------
  { id: 'treadmill', name: 'Treadmill', category: 'Fitness', w: 35, d: 80, h: 60, symbol: 'treadmill', clearance: { front: 78, sides: 20 }, tip: 'Safety standard: about 79" clear behind the deck (the clear zone here) and 20" on each side.' },
  { id: 'bike', name: 'Exercise bike', category: 'Fitness', w: 22, d: 48, h: 50, symbol: 'bike', clearance: { sides: 24 } },
  { id: 'rower', name: 'Rowing machine', category: 'Fitness', w: 24, d: 96, h: 20, symbol: 'bike', clearance: { sides: 24 } },
  { id: 'weight-bench', name: 'Weight bench', category: 'Fitness', w: 24, d: 52, h: 18, symbol: 'weight-bench', clearance: { sides: 30 } },
  { id: 'power-rack', name: 'Power rack', category: 'Fitness', w: 49, d: 50, h: 90, symbol: 'rack', clearance: { front: 48, sides: 24 }, tip: 'Check ceiling height: a 90" rack plus overhead presses needs more than 8\'.' },
  { id: 'dumbbell-rack', name: 'Dumbbell rack', category: 'Fitness', w: 48, d: 20, h: 32, symbol: 'bookshelf', clearance: { front: 36 } },
  { id: 'heavy-bag', name: 'Heavy bag (hung)', category: 'Fitness', w: 14, d: 14, h: 60, symbol: 'generic', round: true, mount: 'ceiling', clearance: { front: 36, sides: 36 } },
  { id: 'yoga-mat', name: 'Yoga mat', category: 'Fitness', w: 24, d: 68, h: 0.25, symbol: 'rug', flat: true },
  { id: 'gym-floor', name: "Gym floor tiles 6' x 6'", category: 'Fitness', w: 72, d: 72, h: 0.75, symbol: 'rug', flat: true },

  // --- Storage ----------------------------------------------------------
  { id: 'cabinet-storage', name: 'Storage cabinet', category: 'Storage', w: 36, d: 18, h: 72, symbol: 'wardrobe', clearance: { front: 30 } },
  { id: 'shoe-bench', name: 'Entry bench', category: 'Storage', w: 42, d: 16, h: 18, symbol: 'side-table' },
  { id: 'shoe-rack', name: 'Shoe rack', category: 'Storage', w: 30, d: 12, h: 20, symbol: 'bookshelf' },
  { id: 'coat-tree', name: 'Coat tree', category: 'Storage', w: 20, d: 20, h: 70, symbol: 'floor-lamp', round: true },
  { id: 'trunk', name: 'Storage trunk', category: 'Storage', w: 36, d: 20, h: 20, symbol: 'ottoman' },

  // --- Kitchen (usually built in) ---------------------------------------
  { id: 'counter', name: 'Base cabinet + counter', category: 'Kitchen', w: 36, d: 25, h: 36, symbol: 'counter', builtIn: true, resizable: true, tip: 'Standard counters are 24-25" deep and 36" high.' },
  { id: 'island', name: 'Kitchen island', category: 'Kitchen', w: 72, d: 36, h: 36, symbol: 'island', builtIn: true, resizable: true, clearance: { front: 42, sides: 36 }, tip: '42" aisles for one cook, 48" for two.' },
  { id: 'sink-kitchen', name: 'Kitchen sink base', category: 'Kitchen', w: 36, d: 25, h: 36, symbol: 'sink-kitchen', builtIn: true },
  { id: 'range-30', name: 'Range 30"', category: 'Kitchen', w: 30, d: 26, h: 36, symbol: 'range', builtIn: true, clearance: { front: 36 } },
  { id: 'range-36', name: 'Range 36"', category: 'Kitchen', w: 36, d: 27, h: 36, symbol: 'range', builtIn: true, clearance: { front: 36 } },
  { id: 'fridge-30', name: 'Refrigerator 30"', category: 'Kitchen', w: 30, d: 30, h: 68, symbol: 'fridge', builtIn: true, clearance: { front: 36 } },
  { id: 'fridge-36', name: 'Refrigerator 36"', category: 'Kitchen', w: 36, d: 31, h: 70, symbol: 'fridge', builtIn: true, clearance: { front: 36 } },
  { id: 'dishwasher', name: 'Dishwasher', category: 'Kitchen', w: 24, d: 25, h: 34, symbol: 'dishwasher', builtIn: true, clearance: { front: 27 } },

  // --- Bath (usually built in) ------------------------------------------
  { id: 'toilet', name: 'Toilet', category: 'Bath', w: 20, d: 28, h: 30, symbol: 'toilet', builtIn: true, clearance: { front: 21, sides: 5 }, tip: 'Code: 15" from the toilet centerline to any side wall, 21" clear in front (24"+ feels better).' },
  { id: 'vanity-24', name: 'Vanity 24"', category: 'Bath', w: 24, d: 21, h: 34, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-30', name: 'Vanity 30"', category: 'Bath', w: 30, d: 21, h: 34, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-36', name: 'Vanity 36"', category: 'Bath', w: 36, d: 22, h: 34, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-60', name: 'Double vanity 60"', category: 'Bath', w: 60, d: 22, h: 34, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'vanity-72', name: 'Double vanity 72"', category: 'Bath', w: 72, d: 22, h: 34, symbol: 'vanity', builtIn: true, clearance: { front: 21 } },
  { id: 'tub', name: 'Bathtub 60"', category: 'Bath', w: 60, d: 30, h: 20, symbol: 'tub', builtIn: true, tip: 'A 5\' alcove tub sets the classic 5\' x 8\' hall bathroom.' },
  { id: 'tub-soaker', name: 'Soaking tub 66"', category: 'Bath', w: 66, d: 34, h: 22, symbol: 'tub', builtIn: true },
  { id: 'shower-36', name: 'Shower 36" x 36"', category: 'Bath', w: 36, d: 36, h: 80, symbol: 'shower', builtIn: true },
  { id: 'shower-48', name: 'Shower 48" x 36"', category: 'Bath', w: 48, d: 36, h: 80, symbol: 'shower', builtIn: true },
  { id: 'shower-60', name: 'Shower 60" x 36"', category: 'Bath', w: 60, d: 36, h: 80, symbol: 'shower', builtIn: true },

  // --- Laundry ----------------------------------------------------------
  { id: 'washer', name: 'Washer', category: 'Laundry', w: 27, d: 30, h: 38, symbol: 'washer', builtIn: true, clearance: { front: 36 } },
  { id: 'dryer', name: 'Dryer', category: 'Laundry', w: 27, d: 30, h: 38, symbol: 'dryer', builtIn: true, clearance: { front: 36 } },
  { id: 'stack-wd', name: 'Stacked washer/dryer', category: 'Laundry', w: 27, d: 31, h: 76, symbol: 'washer', builtIn: true, clearance: { front: 36 } },
  { id: 'water-heater', name: 'Water heater', category: 'Laundry', w: 24, d: 24, h: 60, symbol: 'water-heater', builtIn: true, round: true },

  // --- Outdoor ----------------------------------------------------------
  { id: 'patio-set', name: 'Patio table (4)', category: 'Outdoor', w: 42, d: 42, h: 29, symbol: 'table-round', round: true, clearance: { sides: 30, front: 30 } },
  { id: 'outdoor-sofa', name: 'Outdoor sofa', category: 'Outdoor', w: 76, d: 32, h: 30, symbol: 'sofa', clearance: { front: 18 } },
  { id: 'lounger', name: 'Lounge chair', category: 'Outdoor', w: 28, d: 76, h: 14, symbol: 'armchair' },
  { id: 'fire-pit', name: 'Fire pit', category: 'Outdoor', w: 36, d: 36, h: 14, symbol: 'generic', round: true, clearance: { front: 36, sides: 36 } },
  { id: 'grill', name: 'Grill', category: 'Outdoor', w: 58, d: 24, h: 45, symbol: 'generic', clearance: { front: 36 } },
  { id: 'hot-tub', name: 'Hot tub', category: 'Outdoor', w: 84, d: 84, h: 36, symbol: 'tub', clearance: { front: 24 } },
];
