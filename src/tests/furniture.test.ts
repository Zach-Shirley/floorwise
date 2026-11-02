import { describe, expect, it } from 'vitest';
import studio from '../data/layouts/studio-loft';
import { FURNITURE } from '../data/furniture';
import { CEILING, analyzeFit, carryRiders, findSpot, resolveStacks, ridersOf, snapToWallMount, snapToWalls, type PlacedItem } from '../engine/furniture';
import { resolveLayout } from '../engine/resolve';

const floor = resolveLayout(studio).floors[0];
const place = (item: string, x: number, y: number, rot = 0, uid = item): PlacedItem => ({ uid, item, floor: 'main', x, y, rot });

describe('furniture catalog', () => {
  it('has unique ids and positive sizes', () => {
    expect(new Set(FURNITURE.map((f) => f.id)).size).toBe(FURNITURE.length);
    for (const f of FURNITURE) {
      expect(f.w).toBeGreaterThan(0);
      expect(f.d).toBeGreaterThan(0);
      expect(f.h).toBeGreaterThan(0);
    }
  });
  it('has well-formed height data', () => {
    const symbols = new Set(FURNITURE.map((f) => f.symbol));
    for (const f of FURNITURE) {
      expect(f.clearUnder ?? 0, f.id).toBeLessThan(f.h);
      if (f.mount === 'wall') expect((f.elev ?? 48) + f.h, f.id).toBeLessThanOrEqual(CEILING);
      for (const s of f.sitsOn ?? []) expect(symbols.has(s), `${f.id} sits on ${s}`).toBe(true);
      for (const [x, y, w, d] of f.parts ?? []) {
        expect(x >= 0 && y >= 0 && x + w <= f.w && y + d <= f.d, f.id).toBe(true);
      }
    }
  });
  it('uses standard mattress sizes', () => {
    const mattress = (id: string) => FURNITURE.find((f) => f.id === id)!.detail;
    expect(mattress('bed-twin')).toBe('Mattress 38" x 75"');
    expect(mattress('bed-full')).toBe('Mattress 54" x 75"');
    expect(mattress('bed-queen')).toBe('Mattress 60" x 80"');
    expect(mattress('bed-king')).toBe('Mattress 76" x 80"');
    expect(mattress('bed-cal-king')).toBe('Mattress 72" x 84"');
  });
});

describe('fit analysis', () => {
  it('accepts a queen bed in open floor space', () => {
    expect(analyzeFit(floor, [place('bed-queen', 9, 5)]).get('bed-queen')).toBeUndefined();
  });
  it('flags a bed pushed through a wall', () => {
    const w = analyzeFit(floor, [place('bed-queen', 0.5, 5)]).get('bed-queen')!;
    expect(w.map((x) => x.msg)).toContain('Runs into a wall');
  });
  it('flags two overlapping pieces', () => {
    const w = analyzeFit(floor, [place('bed-queen', 9, 5), place('dresser-6', 9, 5, 0, 'dresser')]);
    expect(w.get('dresser')!.map((x) => x.msg)).toContain('Overlaps the queen bed');
  });
  it('lets furniture sit on a rug', () => {
    const w = analyzeFit(floor, [place('rug-8x10', 9, 6), place('sofa-3', 9, 6, 0, 'sofa')]);
    expect(w.get('sofa')).toBeUndefined();
  });
  it('flags a chair sitting in the bath door swing', () => {
    const w = analyzeFit(floor, [place('armchair', 13.4, 19.6)]).get('armchair')!;
    expect(w.map((x) => x.msg)).toContain('Blocks a door swing');
  });
  it('flags a piece left outside the house', () => {
    const w = analyzeFit(floor, [place('armchair', 30, 30)]).get('armchair')!;
    expect(w[0]).toEqual({ level: 'block', msg: 'Outside the house' });
  });
  it('warns when a dresser has no room to open its drawers', () => {
    // dresser facing south with its front 1' from the closet wall at y = 14
    const w = analyzeFit(floor, [place('dresser-6', 15, 12.2, 0, 'd')]).get('d')!;
    expect(w.some((x) => x.level === 'tight')).toBe(true);
  });
});

describe('wall snapping', () => {
  it('pulls a bed flush to the north wall', () => {
    const s = snapToWalls(floor, { cx: 9, cy: 3.8, w: 63 / 12, d: 7, rot: 0 });
    expect(s.y - 3.5).toBeCloseTo(2.25 / 12);
  });
  it('leaves an angled item alone', () => {
    expect(snapToWalls(floor, { cx: 9, cy: 3.8, w: 5, d: 7, rot: 15 })).toEqual({ x: 9, y: 3.8 });
  });
});

describe('auto placement', () => {
  it('finds a clear wall spot for a queen bed in the studio main room', () => {
    const room = floor.roomById.get('living')!;
    const spot = findSpot(floor, [], 'bed-queen', room)!;
    expect(spot).not.toBeNull();
    expect(analyzeFit(floor, [place('bed-queen', spot.x, spot.y, spot.rot)]).get('bed-queen')).toBeUndefined();
  });
  it('gives up when nothing fits', () => {
    expect(findSpot(floor, [], 'sectional', floor.roomById.get('closet')!)).toBeNull();
  });
});

// North wall of the studio's main room: inside face at y = 2.25". Windows sit at
// x 3-7 and 11-15, so x 7-11 is clear wall.
const FACE = 2.25 / 12;

describe('height: stacking, under, on the wall', () => {
  const desk = place('desk-small', 9, FACE + 11 / 12, 0, 'desk');
  it('lets a PC tower sit under a desk', () => {
    const pc = place('pc-mid', 10.29, FACE + 9 / 12, 0, 'pc');
    const w = analyzeFit(floor, [desk, pc]);
    expect(w.get('pc')).toBeUndefined();
    expect(w.get('desk')).toBeUndefined();
  });
  it('puts a monitor on top of the desk', () => {
    const mon = place('monitor-24', 9, FACE + 0.5, 0, 'mon');
    const st = resolveStacks(floor, [desk, mon]).get('mon')!;
    expect(st.elev).toBe(30);
    expect(st.on?.uid).toBe('desk');
    expect(analyzeFit(floor, [desk, mon]).get('mon')).toBeUndefined();
  });
  it('nags about a monitor left on the floor', () => {
    const w = analyzeFit(floor, [place('monitor-24', 9, 7, 0, 'mon')]).get('mon')!;
    expect(w[0].level).toBe('tight');
  });
  it('lets a chair tuck under the desk', () => {
    const chair = place('office-chair', 9, FACE + 22 / 12 + 0.3, 0, 'chair');
    expect(analyzeFit(floor, [desk, chair]).get('chair')).toBeUndefined();
  });
  it('hangs a shelf on the wall above a dresser', () => {
    const dresser = place('dresser-low', 9, FACE + 0.75, 0, 'dresser');
    const shelf = place('shelf-36', 9, FACE + 4 / 12, 0, 'shelf');
    const w = analyzeFit(floor, [dresser, shelf]);
    expect(w.get('shelf')).toBeUndefined();
    expect(w.get('dresser')).toBeUndefined();
    expect(resolveStacks(floor, [shelf]).get('shelf')!.band).toEqual([54, 64]);
  });
  it('collides once the shelf is lowered into the dresser', () => {
    const dresser = place('dresser-low', 9, FACE + 0.75, 0, 'dresser');
    const shelf = { ...place('shelf-36', 9, FACE + 4 / 12, 0, 'shelf'), elev: 20 };
    expect(analyzeFit(floor, [dresser, shelf]).get('shelf')!.map((x) => x.msg)).toContain('Overlaps the low dresser / media chest');
  });
  it('wants a wall behind wall pieces', () => {
    const w = analyzeFit(floor, [place('shelf-36', 9, 7, 0, 'shelf')]).get('shelf')!;
    expect(w.map((x) => x.msg)).toContain('Needs a wall behind it to hang on');
  });
  it('warns when a wall piece covers a window', () => {
    const w = analyzeFit(floor, [place('poster-24x36', 5, FACE + 1 / 24, 0, 'p')]).get('p')!;
    expect(w.map((x) => x.msg)).toContain('Covers a window');
  });
  it('snaps a wall piece onto the nearest wall, facing the room', () => {
    const m = snapToWallMount(floor, { cx: 17, cy: 3, w: 3, d: 8 / 12, rot: 0 });
    expect(m.rot).toBe(90);
    expect(m.x).toBeCloseTo(18 - FACE - 4 / 12);
  });
  it('knows what travels with a desk: things on it and under it, not the chair', () => {
    const items = [
      desk,
      place('monitor-24', 9, FACE + 0.5, 0, 'mon'),
      place('pc-mid', 10.29, FACE + 9 / 12, 0, 'pc'),
      place('office-chair', 9, FACE + 22 / 12 + 0.3, 0, 'chair'),
    ];
    expect(ridersOf(floor, items, 'desk').map((i) => i.uid).sort()).toEqual(['mon', 'pc']);
  });
  it('carries pieces resting on a desk when it turns', () => {
    const [m] = carryRiders([place('monitor-24', 9, 0.5, 0, 'mon')], { x: 9, y: 1, rot: 0 }, { x: 9, y: 1, rot: 90 });
    expect(m.x).toBeCloseTo(9.5);
    expect(m.y).toBeCloseTo(1);
    expect(m.rot).toBe(90);
  });
  it('auto-places a monitor on the desk and a tower underneath', () => {
    const room = floor.roomById.get('living')!;
    const mon = findSpot(floor, [desk], 'monitor-27', room)!;
    expect(resolveStacks(floor, [desk, place('monitor-27', mon.x, mon.y, mon.rot, 'mon')]).get('mon')!.on?.uid).toBe('desk');
    const pc = findSpot(floor, [desk], 'pc-mid', room)!;
    const items = [desk, place('pc-mid', pc.x, pc.y, pc.rot, 'pc')];
    expect(analyzeFit(floor, items).get('pc')).toBeUndefined();
    expect(Math.abs(pc.y - desk.y)).toBeLessThan(1);
  });
});

describe('L-shaped footprints', () => {
  it('leaves the inside corner of an L-desk free', () => {
    const w = analyzeFit(floor, [place('desk-l', 9, 7, 0, 'desk'), place('armchair', 8, 8, 0, 'chair')]);
    expect(w.get('chair')).toBeUndefined();
  });
  it('still collides with the return wing', () => {
    const w = analyzeFit(floor, [place('desk-l', 9, 7, 0, 'desk'), place('armchair', 10.5, 8, 0, 'chair')]);
    expect(w.get('chair')!.map((x) => x.msg)).toContain('Overlaps the l-desk (return right)');
  });
});
