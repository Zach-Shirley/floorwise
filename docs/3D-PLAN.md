# Taking Floorwise into 3D

Status:
- **Phases A and B shipped together in v0.3 (November 2026):** walking and editing the room you're standing in.
- **Phase C (lighting)** is next.
- The notes below are kept as the original plan, with what changed marked "Built".

The goal: pick a room and appear in the middle of it at your own eye height (6'2" tall puts your eyes about 5'9"). Look around at the bed, desk and chair in 3D, then later edit that one room's furniture in 3D. The neighbouring rooms are drawn so you see through the doorways, but you can't edit them from there.

## Is it realistic?

Yes. The hard part of a 3D room viewer is working out the geometry, and the 2D engine already does that:

- **Walls** are resolved into solid rectangles with real thickness (4.5" interior, 7" exterior), with openings cut for doors (`src/engine/resolve.ts`).
- **Windows** sit on known wall segments, and the plan knows which way is north, so it knows where the sun comes in.
- **Every piece of furniture** now has a footprint (including L-shapes) plus a height band: bottom, top, and the open space underneath (`src/engine/furniture.ts`, `resolveStacks`). That band is exactly what a 3D box needs.

So a 3D view is mostly another *renderer* of the same data, the way the SVG plan is one. Saved furniture, fit checks and undo would all stay shared, and the 2D plan would stay the place where layouts are defined.

## Recommended stack

- **three.js** through **React Three Fiber** (`@react-three/fiber`) and its helper library `@react-three/drei` (pointer-lock controls, area-light helpers, etc.). All three are MIT-licensed and widely used.
- **Load it only when needed.** The 3D view loads when you open it, so the 2D app stays as fast as it is now. three.js adds roughly 150 KB gzipped.
- **No backend.** See the last section.

## Phases

### A. Walk the room (view only)

*About 3-5 agent-hours, medium confidence.*

- A "Walk in" button on a selected room.
- **Camera:** starts at the room's center at eye height (your height minus about 4.5"). Mouse-look with pointer lock, WASD to move, and the camera stays inside the room with about 1' of clearance. Walking through a doorway into the next room could come later.
- **Geometry:**
  - Each wall rectangle is extruded to the ceiling (8' by default), with doors cut to 80" and window openings from 36" to 84" with glass panes.
  - The floor and ceiling are flat planes.
- **Furniture** starts as clean boxes built from each piece's footprint parts and height band. A desk becomes a top slab plus legs, using `clearUnder`. A small set of hand-built low-poly shapes would cover the common pieces: bed (frame, mattress, pillows), sofa, chair, desk, monitor, shelf, TV.
- **Neighbouring rooms:** their walls and floors are drawn, with furniture as faint boxes or hidden, so a doorway looks into a real space without making everything editable.
- **Quick wins:** a height slider (it's your eye height, already a setting), and a "teleport" list of standing spots (bed, desk chair, sofa).

### B. Edit one room in 3D

*About 4-6 agent-hours, medium confidence.*

- **Select:** click a piece (a raycast). The same inspector and side view appear.
- **Move:**
  - Floor pieces drag along the floor plane.
  - Wall pieces drag along the wall plane, so height becomes a direct drag instead of a number box.
  - Surface pieces drag across whatever they rest on.
- **Rotate:** R rotates, the same as the plan.
- **Fit checks:** `analyzeFit` runs on every move, exactly as in 2D, and pieces tint red or amber.
- **Scope:** editing is limited to the current room. That keeps picking, snapping and collision small and predictable, and matches how people actually arrange furniture.
- **Data:** it's the same `PlacedItem` data, so anything moved in 3D is already moved on the plan.

**Built (v0.3), and how it differs from the plan:**
- **Code:** it's `src/ui/Walk3D.tsx` plus `src/engine/scene.ts`, with three.js through React Three Fiber and no drei.
- **Floors:** the whole floor is built at once, so doorways never load. You can edit only the room you stand in; it switches about 0.4 s after you enter a new room.
- **Editing is click-to-hold:** aim and click to pick up, click to put down. Wall pieces follow the wall you aim at.
- **Fallback:** drag-to-look when pointer lock is refused.
- **Models:** built in code (`src/ui/models3d.tsx`) instead of downloaded packs.

### C. Lighting, including LED strips

*About 3-5 agent-hours for real-time lighting, plus 2-4 more for rendered stills. Lower confidence: this is mostly tuning by eye.*

- **Sunlight:** a directional light through the windows with shadows, plus a time-of-day slider. North is known, so morning sun in an east bedroom looks right.
- **Lamps:** floor and table lamps become point or spot lights at their real height.
- **LED strips:**
  - The catalog already has `led-strip-4` and `led-strip-8` as wall pieces with a height (90" by default, for a glow off the ceiling).
  - In 3D, each strip becomes a thin glowing bar plus a rectangular area light (three.js supports `RectAreaLight`, which suits strips) with a color picker.
  - A soft "bloom" post-effect sells the glow.
  - Put a strip behind a TV, under a floating shelf, or along the top of a wall, and see it.
- **Ray tracing:**
  - Real-time ray tracing is overkill for walking around.
  - The realistic version is a "Render this view" button that runs a progressive path tracer for a photo-like still. A path tracer for three.js exists; search for "three-gpu-pathtracer".
  - That is a nice extra once the real-time view is good, not a first step.

## What's actually hard

1. **Making it look good.** Boxes read as an architect's massing model: clear, but plain. Nicer furniture means 3D model files (glTF) with compatible licenses. Search for CC0 furniture packs (Kenney and Poly Haven are known CC0 sources) and check each license before adding anything.
2. **Ceiling heights.** The data assumes one flat 8' ceiling. Double-height great rooms (`open-below`) need a per-room ceiling height, which is a small schema addition: `ceiling?: number` on a room.
3. **Window and door heights** are fixed assumptions (36"-84" windows, 80" doors). Optional `sill`/`head` fields on windows would fix that.
4. **Stairs and two-story walks** come later. Staying inside one room avoids them on purpose.

## Do we need a backend?

No. Furniture is saved in the browser per layout (`localStorage`) and travels as JSON export/import. Each piece is about 100 bytes, so thousands fit easily inside the browser's roughly 5 MB limit.

A backend only becomes worth it for:
- syncing the same designs across devices automatically, or
- sharing a design by link without sending a file.

Even link sharing could be done without a server, by packing a room's furniture into the URL.

## Suggested order

1. **v0.3:** Phase A (walk the room, view only). It gives the biggest "wow" for the least risk, and nothing in 2D changes.
2. **v0.4:** Phase B (edit one room in 3D).
3. **v0.5:** Phase C (sunlight, lamps, LED strips), then optional rendered stills.
