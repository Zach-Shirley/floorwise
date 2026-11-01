import type { LayoutDef } from '../../engine/types';

const layout: LayoutDef = {
  id: 'studio-loft',
  name: 'Studio Loft',
  kind: 'apartment',
  styles: ['apartment', 'open-concept'],
  beds: 0,
  baths: 1,
  summary: 'One bright room for living and sleeping, with the kitchen, bath and closet tucked along the entry side.',
  notes: [
    {
      title: 'Service strip by the door',
      body: 'Everything with plumbing or storage lines the corridor side of the unit. That leaves the window wall free for the space you actually live in.',
      rooms: ['kitchen', 'bath', 'closet'],
    },
    {
      title: 'Kitchen and bath share a wall zone',
      body: 'The kitchen and bath sit a few feet apart, so supply and drain lines stay short. Apartment buildings stack these rooms floor over floor for the same reason.',
      rooms: ['kitchen', 'bath'],
    },
    {
      title: 'The entry does the zoning',
      body: 'Walking in, you pass the "messy" functions first and arrive in the calm main room. Put the bed at the far end and a sofa or bookshelf can act as a soft divider.',
      rooms: ['entry', 'living'],
    },
  ],
  floors: [
    {
      id: 'main',
      name: 'Main floor',
      rooms: [
        { id: 'living', name: 'Living / Sleeping', type: 'living', rect: [0, 0, 18, 14], note: 'Roughly 12\' of this room is enough for a queen bed zone; the rest is living space.' },
        { id: 'kitchen', name: 'Kitchen', type: 'kitchen', rect: [0, 14, 8, 11] },
        { id: 'entry', name: 'Entry', type: 'entry', rect: [8, 14, 4, 11] },
        { id: 'closet', name: 'Closet', type: 'walkin', rect: [12, 14, 6, 4] },
        { id: 'bath', name: 'Bath', type: 'bath', rect: [12, 18, 6, 7] },
      ],
      doors: [
        { between: ['entry', 'outside'], side: 'S', main: true },
        { between: ['entry', 'living'], kind: 'open' },
        { between: ['entry', 'kitchen'], kind: 'open' },
        { between: ['kitchen', 'living'], kind: 'open' },
        { between: ['entry', 'closet'] },
        { between: ['entry', 'bath'], at: 'start' },
      ],
      windows: [
        { room: 'living', side: 'N', width: 4, at: 3 },
        { room: 'living', side: 'N', width: 4, at: 11 },
        { room: 'living', side: 'W', width: 3 },
        { room: 'living', side: 'E', width: 3 },
        { room: 'kitchen', side: 'S', width: 3, at: 2.3 },
        { room: 'bath', side: 'E', width: 2 },
      ],
      fixtures: [
        { item: 'fridge-30', room: 'kitchen', wall: 'W', at: 1 },
        { item: 'counter', room: 'kitchen', wall: 'W', at: 3.5, w: 30 },
        { item: 'range-30', room: 'kitchen', wall: 'W', at: 6 },
        { item: 'counter', room: 'kitchen', wall: 'W', at: 8.5, w: 25 },
        { item: 'sink-kitchen', room: 'kitchen', wall: 'S', at: 2.1 },
        { item: 'dishwasher', room: 'kitchen', wall: 'S', at: 5.1 },
        { item: 'vanity-30', room: 'bath', wall: 'N', at: 2.8 },
        { item: 'toilet', room: 'bath', wall: 'E', at: 2 },
        { item: 'tub', room: 'bath', wall: 'S', at: 0 },
      ],
    },
  ],
};

export default layout;
