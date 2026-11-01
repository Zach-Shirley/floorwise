import { describe, expect, it } from 'vitest';
import { LAYOUTS } from '../data/layouts';
import { resolveLayout } from '../engine/resolve';
import { runChecks } from '../engine/rules';

describe('layout library', () => {
  it('has unique ids', () => {
    const ids = LAYOUTS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const def of LAYOUTS) {
    describe(def.name, () => {
      const L = resolveLayout(def);
      for (const c of runChecks(L)) {
        it(c.label, () => expect(c.problems).toEqual([]));
      }
      it('has at least one design note and a summary', () => {
        expect(def.notes.length).toBeGreaterThan(0);
        expect(def.summary.length).toBeGreaterThan(20);
      });
      it('declares bedroom count matching its rooms', () => {
        const beds = L.floors.flatMap((f) => f.rooms).filter((r) => r.type === 'bedroom' || r.type === 'primary').length;
        expect(beds).toBe(def.beds);
      });
      it('declares bath count matching its rooms', () => {
        const rooms = L.floors.flatMap((f) => f.rooms);
        const baths = rooms.filter((r) => r.type === 'bath').length + 0.5 * rooms.filter((r) => r.type === 'powder').length;
        expect(baths).toBe(def.baths);
      });
    });
  }
});
