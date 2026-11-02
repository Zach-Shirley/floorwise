import type { LayoutDef } from '../../engine/types';

const layout: LayoutDef = {
  id: 'storefront-live-work',
  name: 'Storefront Live / Work',
  kind: 'house',
  styles: ['live-work', 'two-story', 'narrow-lot'],
  beds: 1,
  baths: 1.5,
  summary:
    'A 20\'-wide two-story on a city lot. The ground floor is a street-facing studio or shop with a back workshop; upstairs is a great room, kitchen and one bedroom.',
  notes: [
    {
      title: 'Work downstairs, life upstairs',
      body: 'The whole ground floor is workspace: a 16\' x 34\' studio facing the street and a workshop at the back. The home is upstairs, so customers and clients never walk through your kitchen. This is the old "shop-house" idea, and it still works.',
      rooms: ['studio', 'workshop', 'great', 'kitchen'],
    },
    {
      title: 'Two front doors, one address',
      body: 'The shop has its own wide double door. Beside it, a narrow private entry leads straight to the stair. You can go home without unlocking the shop, and visitors upstairs never pass the workbench.',
      rooms: ['entry', 'stair', 'studio'],
    },
    {
      title: 'A back door big enough for projects',
      body: 'The workshop opens to the rear alley through a 9\' overhead door. Lumber, deliveries and finished pieces come and go without crossing the studio floor.',
      rooms: ['workshop'],
    },
    {
      title: 'Stacked plumbing',
      body: 'The powder room and laundry sit in a narrow strip along the east wall. The upstairs kitchen and bath sit right above that strip. One vertical stack of pipes serves all four, which is the cheapest way to plumb a two-story.',
      rooms: ['powder', 'laundry', 'kitchen', 'bath'],
    },
    {
      title: 'Narrow lot, long rooms',
      body: 'On a 20\' lot, side walls usually face neighbors, so the main windows go on the street and back walls. The plan puts the great room at the street end for light and the bedroom at the quiet back.',
      rooms: ['great', 'bedroom'],
    },
  ],
  floors: [
    {
      id: 'ground',
      name: 'Ground floor',
      rooms: [
        { id: 'workshop', name: 'Workshop', type: 'workshop', rect: [0, 0, 20, 12], note: 'A workbench wall, tool storage and a clear floor for big pieces.' },
        { id: 'studio', name: 'Studio / shop', type: 'studio', rect: [0, 12, 16, 34], note: 'A long, open room: display or clients at the street end, messier work toward the back.' },
        { id: 'powder', name: 'Powder', type: 'powder', rect: [16, 12, 4, 6] },
        { id: 'laundry', name: 'Laundry', type: 'laundry', rect: [16, 18, 4, 6] },
        { id: 'stair', name: 'Stair', type: 'stair', rect: [16, 24, 4, 14] },
        { id: 'entry', name: 'Home entry', type: 'entry', rect: [16, 38, 4, 8] },
      ],
      doors: [
        { between: ['entry', 'outside'], side: 'S', at: 0.5, main: true },
        { between: ['entry', 'stair'], kind: 'open' },
        { between: ['entry', 'studio'], at: 2 },
        { between: ['studio', 'outside'], side: 'S', kind: 'double', width: 5, at: 9 },
        { between: ['studio', 'workshop'], at: 6 },
        { between: ['workshop', 'outside'], side: 'N', kind: 'garage', width: 9, at: 2 },
        { between: ['studio', 'powder'], kind: 'pocket', width: 28 / 12, at: 3.3 },
        { between: ['studio', 'laundry'], kind: 'bifold', width: 2.5, at: 3 },
      ],
      windows: [
        { room: 'studio', side: 'S', width: 6, at: 1 },
        { room: 'studio', side: 'W', width: 5, at: 8 },
        { room: 'studio', side: 'W', width: 5, at: 20 },
        { room: 'workshop', side: 'N', width: 3, at: 13.5 },
        { room: 'workshop', side: 'W', width: 3, at: 4 },
      ],
      fixtures: [
        { item: 'toilet', room: 'powder', wall: 'N', at: 0.6 },
        { item: 'vanity-24', room: 'powder', wall: 'E', at: 3.2 },
        { item: 'stack-wd', room: 'laundry', wall: 'N', at: 0.3 },
      ],
    },
    {
      id: 'upper',
      name: 'Upper floor',
      rooms: [
        { id: 'closet', name: 'Closet', type: 'closet', rect: [0, 0, 8, 5] },
        { id: 'bath', name: 'Bath', type: 'bath', rect: [0, 5, 8, 8] },
        { id: 'bedroom', name: 'Bedroom', type: 'primary', rect: [8, 0, 12, 13], note: 'At the back of the lot, away from street noise.' },
        { id: 'kitchen', name: 'Kitchen', type: 'kitchen', rect: [0, 13, 16, 11] },
        { id: 'hall', name: 'Hall', type: 'hall', rect: [16, 13, 4, 11] },
        { id: 'stair', name: 'Stair', type: 'stair', rect: [16, 24, 4, 14] },
        { id: 'great', name: 'Great room', type: 'great', rects: [[0, 24, 16, 22], [16, 38, 4, 8]], note: 'Living and dining in one long room with the street windows at the far end.' },
      ],
      doors: [
        { between: ['stair', 'great'], kind: 'open' },
        { between: ['stair', 'hall'], kind: 'open' },
        { between: ['kitchen', 'great'], kind: 'open' },
        { between: ['hall', 'bedroom'], at: 0.5 },
        { between: ['bedroom', 'closet'], kind: 'bifold', width: 4, at: 0.5 },
        { between: ['bedroom', 'bath'], at: 2.7 },
      ],
      windows: [
        { room: 'great', side: 'S', width: 5, at: 1.5 },
        { room: 'great', side: 'S', width: 5, at: 8 },
        { room: 'great', side: 'S', width: 4, at: 14.5 },
        { room: 'great', side: 'W', width: 5, at: 6 },
        { room: 'kitchen', side: 'W', width: 4, at: 3.5 },
        { room: 'bedroom', side: 'N', width: 4, at: 3 },
        { room: 'bedroom', side: 'E', width: 3, at: 4 },
        { room: 'bath', side: 'W', width: 2, at: 2 },
        { room: 'hall', side: 'E', width: 2 },
      ],
      fixtures: [
        { item: 'fridge-30', room: 'kitchen', wall: 'N', at: 0 },
        { item: 'counter', room: 'kitchen', wall: 'N', at: 2.6, w: 30 },
        { item: 'sink-kitchen', room: 'kitchen', wall: 'N', at: 5.2 },
        { item: 'dishwasher', room: 'kitchen', wall: 'N', at: 8.2 },
        { item: 'counter', room: 'kitchen', wall: 'N', at: 10.2, w: 24 },
        { item: 'range-30', room: 'kitchen', wall: 'N', at: 12.3 },
        { item: 'island', room: 'kitchen', x: 8, y: 7.5 },
        { item: 'tub', room: 'bath', wall: 'W', at: 0 },
        { item: 'toilet', room: 'bath', wall: 'N', at: 4 },
        { item: 'vanity-30', room: 'bath', wall: 'S', at: 3 },
      ],
    },
  ],
};

export default layout;
