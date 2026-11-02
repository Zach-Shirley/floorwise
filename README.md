# Floorwise

A house-plan explorer for people who've never designed a house. Browse 31 original floor plans, from a 450 sq ft studio to a 3,200 sq ft two-story, including open great-room and live/work homes with a workshop. Drop in about 200 true-size pieces of furniture and see right away when a king bed blocks the closet door. Pieces have real heights, so a PC can go under a desk, a monitor on it and a shelf on the wall above. Along the way you learn *why* each plan is arranged the way it is.

**Live:** https://floorwise-seven.vercel.app (auto-deploys from `main`)

**Status:** v0.2 (November 2026). v0.2 adds 12 plans in the 1,000-2,500 sq ft range (8 of them open great-room or live/work designs), a much bigger furniture catalog, and heights: stacking, under-desk pieces, wall-mounted pieces and a side view. Plans are still fixed-size: you can't drag walls yet. Desktop browser is the target; phones can browse plans but aren't polished. There's no 3D view yet. [`docs/3D-PLAN.md`](docs/3D-PLAN.md) describes how one would be built.

![A split-bedroom ranch with starter furniture: the right panel explains why the plan is arranged this way](docs/screenshots/furnished.png)

![Zones and circulation overlays on a classic ranch: purple is private, red is public, the dotted lines trace the walk from the front door](docs/screenshots/zones-flow.png)

## What you can do

- **Browse 31 plans** filtered by bedrooms, square footage and style (apartment, cottage, ranch, split-bedroom, open-concept, great room, live/work, L-shaped, courtyard, townhouse, two-story, narrow-lot, accessible). The great-room plans are deliberately unusual. One has a big open room plus a shop with a roll-up door. Another has a double-height living space under an upstairs loft. Others are a square house wrapped around a central plumbing core, a street-front studio with the home upstairs, and a two-wing pavilion.
- **Read the plan**: walls, door swings, windows, room names with dimensions and square footage, overall dimensions, a compass and a live scale bar. Pan with drag, zoom with the scroll wheel.
- **Click any room** to see its size, share of the house, privacy zone, which rooms it connects to (and by what kind of door), windows, and fixtures.
- **Place furniture** from a catalog of about 200 pieces at real sizes:
  - Beds: twin through California king, loft and bunk beds, a Murphy bed.
  - Desks: from compact to executive, standing, and L-desks.
  - Tech: monitors (including ultrawides), PC towers, laptops and speakers.
  - Wall pieces: shelves, wall bookcases, posters, art, mirrors and wall TVs from 55" to 85".
  - Lighting: lamps, ceiling fans, pendants and LED strips.
  - Hobby, workshop and fitness: workbenches, pegboard, a table saw, a pool table, ping pong, an arcade cabinet, drum kits, a treadmill and a power rack.
  - Kitchen, bath and laundry fixtures.

  Drag a piece from the palette, or click it and it finds a sensible spot: against a wall, on a desk for monitors, under a desk for PC towers. Move, rotate (R, or drag the handle), duplicate, delete, undo.
- **Work in three dimensions on a flat plan.**
  - **Heights:** every piece has a height. Two pieces only collide when they overlap on the plan *and* in height.
  - **Surface pieces:** monitors, lamps and TVs on stands rest on whatever is under them and travel with it when you move it.
  - **Under-desk pieces:** PC towers and drawer pedestals go under a desk and move with it.
  - **Wall pieces:** they snap to the nearest wall, turn to face the room, and have an adjustable height.
  - **Chairs:** they tuck under desks and tables.
  - **On the plan:** pieces above about 4' are drawn dashed (the standard drafting convention), and anything hidden under something else shows as a dashed outline.
  - **Side view:** select any piece to see it next to a figure of your height (6'2" by default, adjustable).
- **See what doesn't fit.**
  - Red means a hard problem: the piece runs into a wall, overlaps something at the same height, blocks a door swing, or is a wall piece with no wall behind it.
  - Amber means a softer one: the piece crowds a doorway, covers a window, doesn't leave the recommended clearance (like 36" in front of a dresser), or is a monitor left on the floor.
  - Select a piece to see its clearance zone.
- **Learn as you go**: every plan has "why it's arranged this way" notes. A **Plan check** card runs 13 design rules on the plan, and **Zones** and **Flow** overlays show public/private grouping and the walking route from the front door. The **Learn** tab covers reading a plan, zoning, circulation, wet walls, the kitchen work triangle, light and orientation, a clearances cheat sheet, standard heights, common mistakes, and where to learn more.
- **Auto-furnish** gives a rough starter arrangement to rearrange. It is honestly rough: a greedy placer, not an interior designer.
- Furniture **saves in your browser** per plan, and can be exported or imported as JSON. Links like `?layout=classic-ranch-three&view=zones,flow` open a specific plan and view.

Keyboard: `R` / `Shift+R` rotate 90°, `Q` / `E` rotate 15°, arrows nudge 1" (Shift for 6"), `Del` remove, `Ctrl+D` duplicate, `Ctrl+Z` / `Ctrl+Shift+Z` undo/redo, `F` fit, `+`/`-` zoom, `Esc` deselect. Hold `Alt` while dragging to turn off wall snapping.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5340
npm test         # 540 tests
npm run build
```

## Adding your own layout

Layouts are plain TypeScript data in [`src/data/layouts/`](src/data/layouts). Every file there that default-exports a layout shows up in the library automatically. Units are **feet**, x grows east (right) and y grows south (down). Rooms are drawn to wall centerlines, so neighbors share an edge.

1. Copy [`studio-loft.ts`](src/data/layouts/studio-loft.ts) (or [`makers-barn.ts`](src/data/layouts/makers-barn.ts) for an open plan) to `my-house.ts` and change the `id`.
2. List rooms as rectangles `[x, y, width, depth]`. Use `rects: [...]` for L-shaped rooms. Room types include `great` (a combined living/dining/kitchen room), `workshop`, `studio`, and `open-below`, which is a double-height void on an upper floor and isn't counted in the area.
3. Connect rooms with doors. You don't give door coordinates: name the two rooms and the engine finds their shared wall.

```ts
rooms: [
  { id: 'living', name: 'Living', type: 'living', rect: [0, 0, 16, 14] },
  { id: 'hall', name: 'Hall', type: 'hall', rect: [16, 0, 4, 14] },
  { id: 'bed', name: 'Bedroom', type: 'bedroom', rect: [20, 0, 12, 12] },
  { id: 'closet', name: 'Closet', type: 'closet', rect: [20, 12, 12, 2] },
],
doors: [
  { between: ['living', 'outside'], side: 'S', main: true }, // front door, 3' wide by default
  { between: ['living', 'hall'], kind: 'open' },             // no wall at all
  { between: ['hall', 'bed'], at: 'start' },                 // 32" door near the north corner
  { between: ['bed', 'closet'], kind: 'bifold', width: 4 },
],
windows: [{ room: 'bed', side: 'E', width: 4 }],
fixtures: [{ item: 'toilet', room: 'bath', wall: 'N', at: 1 }], // back against the north wall, 1' from the corner
```

4. Run `npm test`. The suite runs every plan through the same checks as the Plan check card: no overlapping rooms, every door on a real shared wall, every room reachable from the front door, no bedroom you must walk through, no bathroom opening into the kitchen, bedrooms at least 70 sq ft with a closet and a window, 3' halls, doors that swing freely, fixtures out of doorways, wet rooms near each other, stairs that line up between floors, and a sensible kitchen work triangle. While the dev server runs, a red banner on the plan also tells you which line of data doesn't line up.

The full schema with comments is in [`src/engine/types.ts`](src/engine/types.ts).

## Adding furniture

Add one line to [`src/data/furniture/catalog.ts`](src/data/furniture/catalog.ts). Sizes are **inches**: `w` is side to side as you face it, `d` is back to front, `h` is height.

```ts
{ id: 'bed-daybed', name: 'Daybed', category: 'Beds', w: 41, d: 80, h: 32, symbol: 'bed', clearance: { front: 24 } },
```

`symbol` picks the top-down drawing in [`src/ui/symbols.tsx`](src/ui/symbols.tsx). Reuse one, or add a new case there. `clearance` (also inches) drives the amber "tight fit" hints. `flat: true` marks rugs and mats, which other furniture sits on.

Height options:

| Field | Meaning | Example |
|---|---|---|
| `h` | Overall height | desk `30`, bookshelf `72` |
| `clearUnder` | Open space underneath; things shorter than this fit under it | desk `26`, loft bed `56` |
| `mount: 'surface'` | Rests on whatever is under its center | monitors, lamps, a 3D printer |
| `mount: 'wall'` + `elev` | Hangs on a wall with its bottom edge `elev` inches up | shelf at `54`, poster at `42` |
| `mount: 'ceiling'` | Hangs from the 8' ceiling | fans, pendants |
| `tucks: true` | Can push in under anything with `clearUnder` | chairs, stools, benches |
| `under: true` | Belongs under a desk (auto-placement puts it there; it moves with the desk) | PC tower, drawer pedestal |
| `sitsOn` | Preferred surfaces for auto-placement, by symbol | `['desk', 'desk-l']` |
| `parts` | A non-rectangular footprint as rectangles `[x, y, w, d]` from the back-left corner | L-desks, sectionals |
| `flip: true` | Draw the symbol mirrored | the left-hand L-desk |

## How it works

- `src/engine/resolve.ts` turns layout data into geometry. It works out which wall segments are interior or exterior, cuts openings for doors, computes swing arcs as convex polygons, and places fixtures flush against inside wall faces.
- `src/engine/rules.ts` builds a graph of rooms connected by doors (and stairs between floors) and runs the design checks on it.
- `src/engine/furniture.ts` works out every piece's height (what rests on what) and then checks pieces against walls, door swings, doorway approach zones, windows, fixtures and each other. It uses separating-axis tests on rotated boxes plus a height-band overlap test. It also snaps pieces to walls, hangs wall pieces, carries what sits on a desk when the desk moves, and finds open spots.
- `src/ui/` is React plus hand-built SVG, with no UI or canvas library. Floor plans render in feet, with screen-constant line widths.

## Verification

- **Automated (540 tests, Vitest):** every one of the 31 layouts passes all 13 design checks plus bed and bath counts. Geometry unit tests cover overlap, L-shaped outlines, interval math and rotated-box collisions. Resolver tests cover square-footage math, exterior wall length, open-plan edges and flush fixture placement. Negative tests confirm the checks catch overlapping rooms, a bath opening into a kitchen, a door between rooms that don't touch, an unreachable room, a fixture in a door swing, a window on an interior wall and a walk-through bedroom. Furniture tests cover standard mattress sizes, wall, overlap, door-swing and outside-the-house detection, rugs under furniture, tight-clearance warnings, wall snapping and auto-placement. Height tests cover:
  - a PC under a desk, a monitor resting on it, and a chair tucked under it
  - a shelf above a dresser that collides once it is lowered into the dresser
  - a wall piece with no wall behind it, and a poster covering a window
  - wall-mount snapping
  - what moves with a desk, and how riders follow its rotation
  - auto-placing a monitor on a desk and a tower under it
  - the free inside corner of an L-desk
  - the catalog's height data
- **Checked by hand in a desktop browser:**
  - **v0.2:** all 12 new layouts render with starter furniture, and the open-to-below upper floor draws correctly. I checked by hand that a monitor and a PC move with a dragged L-desk, a monitor auto-places onto a desk, and a poster snaps to a wall. The side view and wall-height control update the fit warning live, with no console errors.
  - **v0.1:** every layout loads and renders with no console errors or data warnings, including both floors of the two-story plans. Placing, dragging, rotating, undoing and deleting furniture work. Fit warnings fire for walls and door swings. The Zones and Flow overlays, room details, auto-furnish and furniture persistence after reload all work. Phone width was viewed briefly: plans browse fine, but the panels become drawers and it isn't tuned.
- **Not tested:** touch gestures such as pinch-zoom (not implemented), Safari and Firefox, very large custom layouts, and real users.

## Known limitations

- Plans are fixed-size: no wall editing or resizing yet.
- Dimensions are to wall centerlines, a simplification. Real interior clear sizes are a few inches smaller. Furniture *does* respect wall thickness.
- Apartment plans treat every outside edge as an exterior wall. There's no shared corridor or neighbor unit.
- The design checks are teaching heuristics, not building code review. The plumbing check only asks that each wet room has another within 10', or stacked above or below. Bath fixture clearances and kitchen aisle widths are set by hand in each plan and aren't checked.
- Auto-furnish is greedy and doesn't know that a sofa should face the TV. It also tends to drop a dining table in the middle of a great room, right under the room label.
- Heights use one flat 8' ceiling, and windows are assumed to run from 36" to 84". The double-height rooms under `open-below` are not modeled as taller.
- An `open-below` void counts as walkable floor in the circulation graph. That's harmless for the checks, but not literally true.
- A kitchen drawn inside a `great` room (as in Gallery Long House) isn't covered by the plumbing check, which only looks at `kitchen` rooms.
- No 3D view, no materials or lighting, no printing. See [`docs/3D-PLAN.md`](docs/3D-PLAN.md).

## Story

Zach wanted a home-planning tool he could tinker with directly: pick from lots of plans at different square footages, drop in a bed of any size, and gradually learn how rooms chain together beyond the obvious ones like closets and en-suite baths. He's new to residential design. So the app explains the reasoning behind each plan, which rules make a layout work, and what to read or watch next. Layouts and furniture are deliberately plain data files so he, or anyone, can add their own.

## AI assistance and Zach's role

This was built almost entirely by AI. Claude Code (Anthropic's Claude Opus 5.5) wrote all the code, all 31 floor plans, the furniture catalog, the design notes and learning text, and the tests.
- **v0.1:** four parallel Claude agents drafted 18 of the 19 plans.
- **v0.2:** three more agents drafted the 12 new plans.
- The main agent reviewed every plan visually and through the automated checks, and wrote the engine, UI and catalog itself.

Zach came up with the idea and set the direction: a built-out interface first, many preset layouts across square footages, true-size furniture, data files he can edit himself, learning help, and open source.
- After using v0.1, he asked for:
  - more plans in the 1,000-2,500 sq ft range, at least five of them unconventional open layouts suitable for a workshop or office
  - a much bigger catalog focused on bedrooms, offices and living rooms
  - a way to stack furniture, such as a PC under a desk or a shelf above a dresser
  - a plan for a 3D walk-through
- The height system design (bands, surface/wall/ceiling mounts, the side view) was left to the AI's judgment.
- Routine technical and design choices were delegated to the AI.

The floor plans are original. They follow general residential conventions and were not copied from any published plan.

## Attribution

- Fonts: [Inter](https://github.com/rsms/inter) and [Unbounded](https://github.com/googlefonts/unbounded), both under the SIL Open Font License 1.1, bundled via Fontsource.
- Icons and furniture drawings are original SVG made for this project.
- Built with React, Vite, TypeScript and Vitest (MIT).

## License

None yet. All rights reserved; the source is public to read.
