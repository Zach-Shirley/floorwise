import { describe, expect, it } from 'vitest';
import studio from '../data/layouts/studio-loft';
import { FURNITURE } from '../data/furniture';
import { analyzeFit, findSpot, snapToWalls, type PlacedItem } from '../engine/furniture';
import { resolveLayout } from '../engine/resolve';

const floor = resolveLayout(studio).floors[0];
const place = (item: string, x: number, y: number, rot = 0, uid = item): PlacedItem => ({ uid, item, floor: 'main', x, y, rot });

describe('furniture catalog', () => {
  it('has unique ids and positive sizes', () => {
    expect(new Set(FURNITURE.map((f) => f.id)).size).toBe(FURNITURE.length);
    for (const f of FURNITURE) {
      expect(f.w).toBeGreaterThan(0);
      expect(f.d).toBeGreaterThan(0);
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
