import type { LayoutDef } from '../../engine/types';

const layout: LayoutDef = {
  id: 'city-one-bed',
  name: 'City One-Bedroom',
  kind: 'apartment',
  styles: ['apartment'],
  beds: 1,
  baths: 1,
  summary: 'A classic single-aspect apartment: living room and bedroom share the window wall, with kitchen, bath and laundry along the corridor side.',
  notes: [
    {
      title: 'Windows on one side only',
      body: 'Most mid-building apartments get daylight from a single wall. The two rooms you spend the most waking and sleeping hours in, the living room and bedroom, get that wall. Rooms that work fine with a light and a fan (bath, laundry, closet) go to the windowless corridor side.',
      rooms: ['living', 'bedroom'],
    },
    {
      title: 'Two little zones off the entry',
      body: 'Turn left from the entry and you are in the public side: kitchen and living room. Turn right into the short hall and you are in the private side: bath, laundry and bedroom. The hall acts as a buffer so the bedroom door is not on display.',
      rooms: ['entry', 'hall', 'living', 'kitchen'],
    },
    {
      title: 'Short pipe runs',
      body: 'The kitchen sink, the bath and the stacked washer sit within about 10\' of each other. In an apartment building those wet rooms usually line up floor over floor too.',
      rooms: ['kitchen', 'bath', 'laundry'],
    },
    {
      title: 'Walk-in closet as a sound buffer',
      body: 'The walk-in sits between the bedroom and the bathroom. Closets full of clothes are great at soaking up noise from plumbing and neighbors.',
      rooms: ['walkin'],
    },
  ],
  floors: [
    {
      id: 'main',
      name: 'Main floor',
      rooms: [
        { id: 'living', name: 'Living / Dining', type: 'living', rect: [0, 0, 14, 16], note: 'Room for a sofa group near the windows and a 4-seat table nearer the kitchen.' },
        { id: 'bedroom', name: 'Bedroom', type: 'bedroom', rect: [14, 0, 11, 13] },
        { id: 'kitchen', name: 'Kitchen', type: 'kitchen', rect: [0, 16, 9, 12] },
        { id: 'entry', name: 'Entry', type: 'entry', rect: [9, 16, 5, 12] },
        { id: 'walkin', name: 'Walk-in Closet', type: 'walkin', rect: [18, 13, 7, 5] },
        { id: 'hall', name: 'Hall', type: 'hall', rect: [14, 13, 4, 10] },
        { id: 'bath', name: 'Bath', type: 'bath', rect: [18, 18, 7, 10] },
        { id: 'laundry', name: 'Laundry', type: 'laundry', rect: [14, 23, 4, 5] },
      ],
      doors: [
        { between: ['entry', 'outside'], side: 'S', main: true },
        { between: ['entry', 'living'], kind: 'open' },
        { between: ['kitchen', 'living'], kind: 'open' },
        { between: ['entry', 'kitchen'], kind: 'open', width: 3, at: 8 },
        { between: ['entry', 'hall'], kind: 'open', width: 4 },
        { between: ['hall', 'bedroom'] },
        { between: ['bedroom', 'walkin'], at: 'end' },
        { between: ['hall', 'bath'] },
        { between: ['hall', 'laundry'], kind: 'bifold', width: 3 },
      ],
      windows: [
        { room: 'living', side: 'N', width: 5, at: 1.5 },
        { room: 'living', side: 'N', width: 5, at: 7.5 },
        { room: 'living', side: 'W', width: 4, at: 3 },
        { room: 'bedroom', side: 'N', width: 5 },
      ],
      fixtures: [
        { item: 'fridge-30', room: 'kitchen', wall: 'W', at: 1 },
        { item: 'counter', room: 'kitchen', wall: 'W', at: 3.5, w: 30 },
        { item: 'range-30', room: 'kitchen', wall: 'W', at: 6 },
        { item: 'counter', room: 'kitchen', wall: 'W', at: 8.5, w: 36 },
        { item: 'sink-kitchen', room: 'kitchen', wall: 'S', at: 2.1 },
        { item: 'dishwasher', room: 'kitchen', wall: 'S', at: 5.1 },
        { item: 'tub', room: 'bath', wall: 'S', at: 1.5 },
        { item: 'vanity-36', room: 'bath', wall: 'E', at: 0.5 },
        { item: 'toilet', room: 'bath', wall: 'E', at: 4 },
        { item: 'stack-wd', room: 'laundry', wall: 'S', at: 1 },
      ],
    },
  ],
};

export default layout;
