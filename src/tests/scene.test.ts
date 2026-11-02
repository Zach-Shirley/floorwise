import { describe, expect, it } from 'vitest';
import studio from '../data/layouts/studio-loft';
import loft from '../data/layouts/artists-loft-house';
import { FURNITURE } from '../data/furniture';
import { analyzeFit, resolveStacks, ridersOf, type PlacedItem } from '../engine/furniture';
import { resolveLayout } from '../engine/resolve';
import { CEILING_FT, WINDOW_HEAD_FT, WINDOW_SILL_FT, canStand, paintPanels, wallBoxes } from '../engine/scene';
import { modelParts } from '../ui/models3d';
import { LAYOUTS } from '../data/layouts';

const floor = resolveLayout(studio).floors[0];
const place = (item: string, x: number, y: number, rot = 0, uid = item): PlacedItem => ({ uid, item, floor: 'main', x, y, rot });

describe('3D scene geometry', () => {
  const boxes = wallBoxes(floor);
  it('cuts one glass pane per window, with a sill below and a header above', () => {
    const glass = boxes.filter((b) => b.kind === 'glass');
    expect(glass.length).toBe(floor.windows.length);
    for (const g of glass) {
      expect(g.y0).toBeCloseTo(WINDOW_SILL_FT);
      expect(g.y1).toBeCloseTo(WINDOW_HEAD_FT);
    }
  });
  it('puts a header over every door that is not a fully open wall', () => {
    expect(boxes.filter((b) => b.kind === 'header').length).toBe(floor.doors.filter((d) => !d.full).length);
  });
  it('keeps every piece between the floor and the ceiling', () => {
    for (const b of boxes) {
      expect(b.y0).toBeGreaterThanOrEqual(0);
      expect(b.y1).toBeLessThanOrEqual(CEILING_FT + 1e-9);
      expect(b.rect[2]).toBeGreaterThan(0);
      expect(b.rect[3]).toBeGreaterThan(0);
    }
  });
  it('lets you stand in a room but not in a wall or outside', () => {
    const solid = boxes.filter((b) => b.y0 === 0 && b.kind === 'wall').map((b) => b.rect);
    expect(canStand(floor, solid, 9, 7, 0.75)).toBe(true);
    expect(canStand(floor, solid, 0.3, 7, 0.75)).toBe(false); // against the west wall
    expect(canStand(floor, solid, -5, 7, 0.75)).toBe(false); // outside
  });
  it('builds walls for every layout and floor without errors', () => {
    for (const def of LAYOUTS) for (const f of resolveLayout(def).floors) expect(wallBoxes(f).length).toBeGreaterThan(0);
  });
  it("won't let you stand on an open-to-below void", () => {
    const up = resolveLayout(loft).floors[1];
    const v = up.rooms.find((r) => r.type === 'open-below')!;
    expect(canStand(up, [], v.labelAt.x, v.labelAt.y, 0.75)).toBe(false);
  });
});

describe('3D models', () => {
  it('gives every catalog piece a model made of real-size parts', () => {
    for (const def of FURNITURE) {
      const parts = modelParts(def, def.w, def.d, def.h);
      expect(parts.length, def.id).toBeGreaterThan(0);
      for (const p of parts) {
        expect(p.sx > 0 && p.sy > 0 && p.sz > 0, `${def.id} part size`).toBe(true);
        expect([p.x, p.y, p.z].every(Number.isFinite), def.id).toBe(true);
      }
    }
  });
});

describe('desk layers', () => {
  const FACE = 2.25 / 12;
  const desk = place('desk', 9, FACE + 15 / 12, 0, 'desk');
  it('puts a keyboard and mouse on a desk mat on the desk', () => {
    const items = [desk, place('desk-mat', 9, FACE + 1.6, 0, 'mat'), place('keyboard-tkl', 8.8, FACE + 1.7, 0, 'kb'), place('mouse', 9.8, FACE + 1.7, 0, 'mouse')];
    const st = resolveStacks(floor, items);
    expect(st.get('mat')!.elev).toBe(30);
    expect(st.get('kb')!.on?.uid).toBe('mat');
    expect(st.get('kb')!.elev).toBeCloseTo(30.2);
    expect(st.get('mouse')!.on?.uid).toBe('mat');
    const fit = analyzeFit(floor, items);
    for (const uid of ['mat', 'kb', 'mouse']) expect(fit.get(uid), uid).toBeUndefined();
  });
  it('lifts a monitor onto a riser', () => {
    const items = [desk, place('monitor-riser', 9, FACE + 0.5, 0, 'riser'), place('monitor-27-vertical', 9, FACE + 0.5, 0, 'mon')];
    const st = resolveStacks(floor, items);
    expect(st.get('mon')!.on?.uid).toBe('riser');
    expect(st.get('mon')!.elev).toBe(34);
  });
  it('carries the whole stack when the desk moves', () => {
    const items = [desk, place('desk-mat', 9, FACE + 1.6, 0, 'mat'), place('keyboard-tkl', 8.8, FACE + 1.7, 0, 'kb'), place('pc-mid', 11.1, FACE + 0.9, 0, 'pc')];
    expect(ridersOf(floor, items, 'desk').map((i) => i.uid).sort()).toEqual(['kb', 'mat', 'pc']);
  });
  it('lets a pushed-in chair pass under the keyboard and mat on the desk', () => {
    const items = [desk, place('desk-mat', 9, FACE + 1.6, 0, 'mat'), place('keyboard-tkl', 9, FACE + 1.9, 0, 'kb'), place('gaming-chair', 9, FACE + 2.6, 180, 'chair')];
    const fit = analyzeFit(floor, items);
    for (const uid of ['mat', 'kb', 'chair']) expect(fit.get(uid), uid).toBeUndefined();
  });
  it('does not stack things on a chair pushed under the desk', () => {
    const items = [desk, place('office-chair', 9, FACE + 2.3, 0, 'chair'), place('laptop', 9, FACE + 2.3, 0, 'laptop')];
    expect(resolveStacks(floor, items).get('laptop')!.on?.uid).toBe('desk');
  });
  it('hangs a monitor on the wall over the desk without touching it', () => {
    const items = [desk, place('monitor-wall-27', 9, FACE + 1.5 / 12, 0, 'mon')];
    expect(analyzeFit(floor, items).get('mon')).toBeUndefined();
  });
});

describe('paint panels', () => {
  it('splits a wall face where the room on that side changes', () => {
    const panels = paintPanels(floor, wallBoxes(floor));
    // the studio's east wall runs past the living room and the closet: both get their own panel
    const east = panels.filter((p) => p.rect[0] > 17.5 && p.y0 === 0 && p.y1 > 8);
    expect(east.some((p) => p.room === 'living' && p.rect[1] + p.rect[3] > 13.5)).toBe(true);
    expect(east.some((p) => p.room === 'closet')).toBe(true);
  });
});
