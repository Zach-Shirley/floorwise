import { describe, expect, it } from 'vitest';
import studio from '../data/layouts/studio-loft';
import { convexOverlap, rectsOverlap, unionBoundary, boxCorners, subtractIntervals } from '../engine/geometry';
import { resolveLayout } from '../engine/resolve';
import { runChecks } from '../engine/rules';
import type { LayoutDef } from '../engine/types';

const clone = (l: LayoutDef): LayoutDef => JSON.parse(JSON.stringify(l));
const problems = (l: LayoutDef, id: string) => runChecks(resolveLayout(l)).find((c) => c.id === id)!.problems;

describe('geometry', () => {
  it('treats touching rects as not overlapping', () => {
    expect(rectsOverlap([0, 0, 10, 10], [10, 0, 5, 5])).toBe(false);
    expect(rectsOverlap([0, 0, 10, 10], [9.5, 0, 5, 5])).toBe(true);
  });
  it('computes the outline of an L-shaped union', () => {
    const segs = unionBoundary([
      [0, 0, 10, 4],
      [0, 4, 4, 6],
    ]);
    const perimeter = segs.reduce((s, x) => s + (x.a1 - x.a0), 0);
    expect(perimeter).toBeCloseTo(40); // 10 + 4 + 6 + 6 + 4 + 10
  });
  it('subtracts intervals', () => {
    expect(subtractIntervals(0, 10, [[2, 3], [5, 12]])).toEqual([[0, 2], [3, 5]]);
  });
  it('detects rotated box overlap with SAT', () => {
    const a = boxCorners(0, 0, 4, 2, 0);
    expect(convexOverlap(a, boxCorners(2.8, 0, 4, 2, 90))).toBeGreaterThan(0);
    expect(convexOverlap(a, boxCorners(6, 0, 4, 2, 90))).toBe(0);
    // just touching is not a collision
    expect(convexOverlap(a, boxCorners(4, 0, 4, 2, 0))).toBe(0);
  });
});

describe('resolver', () => {
  const L = resolveLayout(studio);
  it('sums square footage from room rects', () => {
    expect(L.area).toBe(18 * 14 + 8 * 11 + 4 * 11 + 6 * 4 + 6 * 7);
    expect(L.area).toBe(450);
  });
  it('builds exterior walls around the whole perimeter minus openings', () => {
    const f = L.floors[0];
    const ext = f.walls.filter((w) => w.kind === 'ext').reduce((s, w) => s + w.seg.a1 - w.seg.a0, 0);
    const doorOnExt = 3;
    expect(ext).toBeCloseTo(2 * (18 + 25) - doorOnExt);
  });
  it('leaves no wall where rooms are open to each other', () => {
    const f = L.floors[0];
    const onLine14 = f.walls.filter((w) => w.seg.o === 'h' && w.seg.c === 14);
    // only the closet's north wall (x 12-18) is a real wall on y = 14
    expect(onLine14.map((w) => [w.seg.a0, w.seg.a1])).toEqual([[12, 18]]);
  });
  it('places a fixture flush against the inside face of a wall', () => {
    const tub = L.floors[0].fixtures.find((x) => x.def.id === 'tub')!;
    expect(tub.rot).toBe(180);
    expect(tub.cy + tub.d / 2).toBeCloseTo(25 - 2.25 / 12);
  });
});

describe('checks catch broken layouts', () => {
  it('flags overlapping rooms', () => {
    const l = clone(studio);
    l.floors[0].rooms[3].rect = [11, 14, 6, 4];
    expect(problems(l, 'overlap').length).toBeGreaterThan(0);
  });
  it('flags a bathroom opening into the kitchen', () => {
    const l = clone(studio);
    l.floors[0].rooms.find((r) => r.id === 'bath')!.rect = [8, 18, 4, 7];
    l.floors[0].rooms.find((r) => r.id === 'entry')!.rect = [12, 18, 6, 7];
    l.floors[0].doors.push({ between: ['kitchen', 'bath'] });
    expect(problems(l, 'bath-kitchen')).toEqual(['Kitchen opens directly into Bath']);
  });
  it('flags a door between rooms that do not touch', () => {
    const l = clone(studio);
    l.floors[0].doors.push({ between: ['kitchen', 'bath'] });
    expect(problems(l, 'data').join()).toMatch(/don't share a wall/);
  });
  it('flags an unreachable room', () => {
    const l = clone(studio);
    l.floors[0].doors = l.floors[0].doors.filter((d) => d.between[1] !== 'closet');
    expect(problems(l, 'reach')).toEqual(['Main floor: Closet']);
  });
  it('flags a fixture placed in a door swing', () => {
    const l = clone(studio);
    l.floors[0].fixtures!.push({ item: 'vanity-24', room: 'bath', wall: 'W', at: 0.5 });
    expect(problems(l, 'fixtures').join()).toMatch(/door/);
  });
  it('flags a window on an interior wall', () => {
    const l = clone(studio);
    l.floors[0].windows.push({ room: 'closet', side: 'W' });
    expect(problems(l, 'data').join()).toMatch(/no exterior wall/);
  });
  it('flags a bedroom you must walk through', () => {
    const l = clone(studio);
    const f = l.floors[0];
    f.rooms.find((r) => r.id === 'living')!.type = 'bedroom';
    f.rooms.find((r) => r.id === 'closet')!.type = 'office';
    f.doors = f.doors.filter((d) => d.between[1] !== 'closet');
    f.doors.push({ between: ['living', 'closet'] });
    expect(problems(l, 'private')).toEqual(['Closet can only be reached through Living / Sleeping']);
  });
});
