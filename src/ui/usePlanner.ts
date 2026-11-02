import { useCallback, useEffect, useReducer } from 'react';
import { getFurniture } from '../data/furniture';
import { newUid, type PlacedItem } from '../engine/furniture';
import type { Selection } from './PlanView';

/** Furniture is saved per layout in this browser's localStorage. */
const KEY = (layoutId: string) => `floorwise:v1:items:${layoutId}`;

export function loadItems(layoutId: string): PlacedItem[] {
  try {
    const raw = localStorage.getItem(KEY(layoutId));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter(isPlaced) : [];
  } catch {
    return [];
  }
}

function saveItems(layoutId: string, items: PlacedItem[]) {
  try {
    if (items.length) localStorage.setItem(KEY(layoutId), JSON.stringify(items));
    else localStorage.removeItem(KEY(layoutId));
  } catch {
    /* storage unavailable (private mode): furniture just won't persist */
  }
}

export function isPlaced(x: unknown): x is PlacedItem {
  const o = x as PlacedItem;
  return (
    !!o &&
    typeof o.uid === 'string' &&
    typeof o.item === 'string' &&
    typeof o.floor === 'string' &&
    Number.isFinite(o.x) &&
    Number.isFinite(o.y) &&
    Number.isFinite(o.rot) &&
    !!getFurniture(o.item)
  );
}

interface State {
  layoutId: string;
  floorId: string;
  items: PlacedItem[];
  sel: Selection;
  past: PlacedItem[][];
  future: PlacedItem[][];
}

type Action =
  | { t: 'layout'; id: string; floorId: string }
  | { t: 'floor'; id: string }
  | { t: 'select'; sel: Selection }
  | { t: 'checkpoint' }
  | { t: 'set'; items: PlacedItem[]; history?: boolean }
  | { t: 'patch'; uid: string; patch: Partial<PlacedItem> }
  | { t: 'undo' }
  | { t: 'redo' };

function reducer(s: State, a: Action): State {
  switch (a.t) {
    case 'layout':
      return { layoutId: a.id, floorId: a.floorId, items: loadItems(a.id), sel: null, past: [], future: [] };
    case 'floor':
      return { ...s, floorId: a.id, sel: null };
    case 'select':
      return { ...s, sel: a.sel };
    case 'checkpoint':
      return { ...s, past: [...s.past.slice(-99), s.items], future: [] };
    case 'set':
      return a.history === false
        ? { ...s, items: a.items }
        : { ...s, items: a.items, past: [...s.past.slice(-99), s.items], future: [] };
    case 'patch':
      return { ...s, items: s.items.map((i) => (i.uid === a.uid ? { ...i, ...a.patch } : i)) };
    case 'undo': {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return { ...s, items: prev, past: s.past.slice(0, -1), future: [s.items, ...s.future], sel: keepSel(s.sel, prev) };
    }
    case 'redo': {
      if (!s.future.length) return s;
      const next = s.future[0];
      return { ...s, items: next, past: [...s.past, s.items], future: s.future.slice(1), sel: keepSel(s.sel, next) };
    }
  }
}

const keepSel = (sel: Selection, items: PlacedItem[]): Selection =>
  sel?.kind === 'item' && !items.some((i) => i.uid === sel.uid) ? null : sel;

export function usePlanner(initialLayout: string, initialFloor: string) {
  const [s, dispatch] = useReducer(reducer, undefined, () => ({
    layoutId: initialLayout,
    floorId: initialFloor,
    items: loadItems(initialLayout),
    sel: null,
    past: [],
    future: [],
  }));

  useEffect(() => saveItems(s.layoutId, s.items), [s.layoutId, s.items]);

  const add = useCallback(
    (item: string, x: number, y: number, rot = 0) => {
      const it: PlacedItem = { uid: newUid(), item, floor: s.floorId, x, y, rot };
      dispatch({ t: 'set', items: [...s.items, it] });
      dispatch({ t: 'select', sel: { kind: 'item', uid: it.uid } });
      return it.uid;
    },
    [s.items, s.floorId],
  );

  return {
    ...s,
    canUndo: s.past.length > 0,
    canRedo: s.future.length > 0,
    setLayout: (id: string, floorId: string) => dispatch({ t: 'layout', id, floorId }),
    setFloor: (id: string) => dispatch({ t: 'floor', id }),
    select: (sel: Selection) => dispatch({ t: 'select', sel }),
    checkpoint: () => dispatch({ t: 'checkpoint' }),
    patch: (uid: string, patch: Partial<PlacedItem>) => dispatch({ t: 'patch', uid, patch }),
    /** Move several pieces at once. `history: false` for live dragging (call checkpoint() first). */
    moveMany: (ups: { uid: string; x: number; y: number; rot: number }[], history = true) => {
      const by = new Map(ups.map((u) => [u.uid, u]));
      dispatch({ t: 'set', items: s.items.map((i) => (by.has(i.uid) ? { ...i, ...by.get(i.uid)! } : i)), history });
    },
    /** A one-shot edit that gets its own undo step. */
    edit: (uid: string, patch: Partial<PlacedItem>) =>
      dispatch({ t: 'set', items: s.items.map((i) => (i.uid === uid ? { ...i, ...patch } : i)) }),
    remove: (uid: string) => {
      dispatch({ t: 'set', items: s.items.filter((i) => i.uid !== uid) });
      dispatch({ t: 'select', sel: null });
    },
    duplicate: (uid: string) => {
      const src = s.items.find((i) => i.uid === uid);
      if (!src) return;
      const copy = { ...src, uid: newUid(), x: src.x + 1, y: src.y + 1 };
      dispatch({ t: 'set', items: [...s.items, copy] });
      dispatch({ t: 'select', sel: { kind: 'item', uid: copy.uid } });
    },
    replaceAll: (items: PlacedItem[]) => {
      dispatch({ t: 'set', items });
      dispatch({ t: 'select', sel: null });
    },
    add,
    undo: () => dispatch({ t: 'undo' }),
    redo: () => dispatch({ t: 'redo' }),
  };
}
