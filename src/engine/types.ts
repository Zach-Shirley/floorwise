/**
 * Floorwise data schema.
 *
 * UNITS
 *   - Layouts (rooms, doors, windows, fixture positions) are in FEET.
 *     x grows to the right (east), y grows downward (south). North is "up".
 *   - Furniture sizes are in INCHES, because that is how beds, sofas and
 *     appliances are sold. The engine converts them to feet.
 *
 * Rooms are drawn to wall centerlines: two rooms that share a wall share an edge.
 * See README "Adding a layout" for a walkthrough.
 */

/** [x, y, width, depth] in feet, from the top-left corner. */
export type Rect = [number, number, number, number];

export type Side = 'N' | 'S' | 'E' | 'W';

export type RoomType =
  | 'living'
  | 'family'
  | 'dining'
  | 'kitchen'
  | 'entry'
  | 'hall'
  | 'bedroom'
  | 'primary'
  | 'bath'
  | 'powder'
  | 'closet'
  | 'walkin'
  | 'laundry'
  | 'mudroom'
  | 'pantry'
  | 'office'
  | 'utility'
  | 'stair'
  | 'garage'
  | 'porch'
  | 'deck'
  | 'flex'
  /** A big combined living space: living + dining + kitchen + whatever else in one room. */
  | 'great'
  /** Shop space: tools, workbenches, projects. */
  | 'workshop'
  /** Creative work room: art, music, recording, making. */
  | 'studio'
  /** A double-height void on an upper floor (no floor to stand on). Not counted in area. */
  | 'open-below';

export type Zone = 'public' | 'private' | 'service' | 'circulation' | 'outdoor';

export interface RoomDef {
  /** Unique within the floor. Doors and fixtures refer to rooms by id. */
  id: string;
  name: string;
  type: RoomType;
  /** A rectangular room. Use `rects` instead for L-shaped or notched rooms. */
  rect?: Rect;
  /** Several non-overlapping rectangles that together form one room. */
  rects?: Rect[];
  /** Optional one-line design note shown in the room inspector. */
  note?: string;
}

export type DoorKind = 'swing' | 'double' | 'slide' | 'pocket' | 'bifold' | 'open' | 'garage';

export interface DoorDef {
  /**
   * The two spaces this door connects. Use 'outside' as the second id for
   * exterior doors (then `side` is required).
   */
  between: [string, string];
  kind?: DoorKind;
  /**
   * Opening width in feet. Defaults: 2.67 (32") interior, 3 exterior,
   * and for `open` the whole shared wall.
   */
  width?: number;
  /**
   * Where the opening starts along the shared wall, in feet from its west end
   * (horizontal walls) or north end (vertical walls). 'start' / 'end' put it
   * 4" from that corner. Default: centered.
   */
  at?: number | 'start' | 'end';
  /** Which side of the first room the wall is on. Required for 'outside'. */
  side?: Side;
  /** Room the door leaf swings into. Default: the second room, or the inside room for exterior doors. */
  swing?: string;
  /** Hinge at the start (west/north) or end of the opening. Default 'start'. */
  hinge?: 'start' | 'end';
  /** Marks the front door; circulation is traced from here. */
  main?: boolean;
}

export interface WindowDef {
  room: string;
  side: Side;
  /** Feet. Default 3. */
  width?: number;
  /** Feet from the west/north end of that exterior wall. Default centered. */
  at?: number;
}

/**
 * A built-in fixture (toilet, tub, counters, appliances) that ships with the layout.
 * Either put it against a wall with `wall` + `at`, or give a free position with x/y.
 */
export interface FixtureDef {
  /** Furniture id from the catalog, e.g. 'toilet', 'counter', 'range-30'. */
  item: string;
  room: string;
  /** Back of the fixture sits on this wall of the room's bounding box. */
  wall?: Side;
  /** Feet along the wall from its west/north inside corner to the fixture's near edge. */
  at?: number;
  /** Free placement: center of the fixture in feet, relative to the room's top-left corner. */
  x?: number;
  y?: number;
  /** Clockwise degrees for free placement (0 = front faces south). */
  rot?: number;
  /** Override the catalog width/depth in inches (only for resizable items like counters). */
  w?: number;
  d?: number;
}

export interface FloorDef {
  id: string;
  name: string;
  rooms: RoomDef[];
  doors: DoorDef[];
  windows: WindowDef[];
  fixtures?: FixtureDef[];
}

export type LayoutStyle =
  | 'open-concept'
  | 'split-bedroom'
  | 'traditional'
  | 'l-shaped'
  | 'courtyard'
  | 'cottage'
  | 'apartment'
  | 'townhouse'
  | 'two-story'
  | 'ranch'
  | 'narrow-lot'
  | 'accessible'
  | 'great-room'
  | 'live-work';

export interface DesignNote {
  title: string;
  body: string;
  /** Room ids to highlight when the note is hovered. */
  rooms?: string[];
}

export interface LayoutDef {
  /** Unique, kebab-case. Also used as the save key. */
  id: string;
  name: string;
  kind: 'apartment' | 'house' | 'townhouse' | 'cottage';
  styles: LayoutStyle[];
  beds: number;
  baths: number;
  /** One or two sentences for the library card. */
  summary: string;
  /** "Why it's arranged this way": shown in the About panel. */
  notes: DesignNote[];
  floors: FloorDef[];
}

// ---------------------------------------------------------------------------
// Furniture catalog

export type FurnitureCategory =
  | 'Beds'
  | 'Bedroom'
  | 'Living'
  | 'Dining'
  | 'Office'
  | 'Kitchen'
  | 'Bath'
  | 'Laundry'
  | 'Storage'
  | 'Outdoor'
  | 'Decor'
  | 'Tech'
  | 'Wall'
  | 'Lighting'
  | 'Workshop'
  | 'Hobby'
  | 'Fitness';

export type SymbolKey =
  | 'bed'
  | 'bunk'
  | 'crib'
  | 'nightstand'
  | 'dresser'
  | 'wardrobe'
  | 'sofa'
  | 'sectional'
  | 'loveseat'
  | 'armchair'
  | 'coffee-table'
  | 'side-table'
  | 'tv-console'
  | 'bookshelf'
  | 'rug'
  | 'table-rect'
  | 'table-round'
  | 'chair'
  | 'stool'
  | 'desk'
  | 'office-chair'
  | 'counter'
  | 'island'
  | 'sink-kitchen'
  | 'range'
  | 'fridge'
  | 'dishwasher'
  | 'toilet'
  | 'vanity'
  | 'tub'
  | 'shower'
  | 'washer'
  | 'dryer'
  | 'water-heater'
  | 'plant'
  | 'piano'
  | 'desk-l'
  | 'monitor'
  | 'pc-tower'
  | 'laptop'
  | 'keyboard'
  | 'lamp'
  | 'floor-lamp'
  | 'shelf-wall'
  | 'art'
  | 'mirror'
  | 'tv'
  | 'speaker'
  | 'pegboard'
  | 'workbench'
  | 'tool-chest'
  | 'loft-bed'
  | 'beanbag'
  | 'ottoman'
  | 'pool-table'
  | 'ping-pong'
  | 'arcade'
  | 'treadmill'
  | 'bike'
  | 'weight-bench'
  | 'rack'
  | 'guitar'
  | 'drums'
  | 'aquarium'
  | 'ceiling-fan'
  | 'pendant'
  | 'led-strip'
  | 'printer'
  | 'easel'
  | 'divider'
  | 'generic';

export interface FurnitureDef {
  /** Unique, kebab-case. Layout fixtures and saves refer to this id. */
  id: string;
  name: string;
  category: FurnitureCategory;
  /** Width in inches (side to side, as you face the front). */
  w: number;
  /** Depth in inches (back to front). */
  d: number;
  symbol: SymbolKey;
  /** Round or oval items are drawn as ellipses (collision still uses the box). */
  round?: boolean;
  /**
   * Recommended clear space in inches. `front` is in front of the item,
   * `sides` is left and right. Shown as a faint zone; used for "tight fit" hints.
   */
  clearance?: { front?: number; sides?: number };
  /** Short tip shown in the inspector. */
  tip?: string;
  /** Usually built in (counters, toilets, tubs). Layouts use these as fixtures; you can still place them. */
  builtIn?: boolean;
  /** Lies on the floor (rugs): never collides with other furniture. */
  flat?: boolean;
  /** Layout fixtures may override w/d (counters). */
  resizable?: boolean;
  /** Extra info, e.g. 'Mattress 60" x 80"'. */
  detail?: string;

  // --- Height (the "third dimension") -----------------------------------
  // Pieces only collide when their footprints overlap AND their heights do.
  // That is what lets a PC tower sit under a desk, a monitor sit on it, and a
  // shelf hang on the wall above a dresser.

  /** Overall height in inches, floor (or its mount point) to top. */
  h: number;
  /**
   * How the piece is held up. Default 'floor'.
   * - 'surface': rests on whatever is under its center (desk, dresser, counter).
   * - 'wall': hangs on a wall at `elev` inches up; its back must touch a wall.
   * - 'ceiling': hangs from the 8' ceiling.
   */
  mount?: 'floor' | 'surface' | 'wall' | 'ceiling';
  /** Wall pieces: default height of the BOTTOM edge above the floor, in inches. */
  elev?: number;
  /** Open space under the piece in inches (a desk has ~26" of knee room; a loft bed much more). */
  clearUnder?: number;
  /** Chairs and stools: may tuck under anything with `clearUnder`. */
  tucks?: boolean;
  /** Floor pieces meant to live under a desk or table (PC tower, drawer pedestal). Helps auto-placement. */
  under?: boolean;
  /** Surface pieces: preferred things to sit on, by symbol, best first. Helps auto-placement. */
  sitsOn?: SymbolKey[];
  /**
   * Non-rectangular footprint (L-desks, sectionals) as rectangles in inches,
   * [x, y, w, d] measured from the back-left corner of the w x d box.
   */
  parts?: [number, number, number, number][];
  /** Draw the symbol mirrored left-to-right (the "left-hand" version of an L-desk or sectional). */
  flip?: boolean;
}
