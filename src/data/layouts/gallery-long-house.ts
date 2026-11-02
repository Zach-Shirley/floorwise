import type { LayoutDef } from '../../engine/types';

const layout: LayoutDef = {
  id: 'gallery-long-house',
  name: 'Gallery Long House',
  kind: 'house',
  styles: ['great-room', 'narrow-lot', 'open-concept'],
  beds: 1,
  baths: 1,
  summary: 'A 20-foot-wide house where one 40-foot great room runs most of the length, with a galley kitchen along its north wall. The bedroom hides at the west end behind a wall of closet, and an office alcove sits at the east end.',
  notes: [
    {
      title: 'A room you walk down',
      body: 'Long, narrow houses work best when the main room runs the length instead of being chopped into boxes. Kitchen, dining and living line up along one 40\' space. Every part gets windows on both long walls, so light comes from two sides.',
      rooms: ['great'],
    },
    {
      title: 'A one-wall kitchen with an island',
      body: 'Sink, stove and fridge sit along the north wall, with an island parallel to them. It takes far less space than an L or U kitchen, and the island becomes the second side of the galley and the place people gather.',
      rooms: ['great'],
    },
    {
      title: 'A closet wall instead of a plain wall',
      body: 'The bedroom is separated from the great room by a full-height closet. Clothes soak up sound from the kitchen, and the bedroom gets storage without giving up any of its own floor space.',
      rooms: ['bed', 'closet'],
    },
    {
      title: 'Quiet end, busy end',
      body: 'The bedroom, bath and laundry cluster at the west end. The front door and office sit at the east end. Guests and work come in one end; sleeping happens at the other, 40 feet away.',
      rooms: ['bed', 'bath', 'laundry', 'office', 'entry'],
    },
    {
      title: 'An alcove you can close off with furniture',
      body: 'The office opens to the great room through a wide gap, not a door. It feels like part of the house, but a bookcase or curtain across the opening turns it into a private room if you need one.',
      rooms: ['office'],
    },
  ],
  floors: [
    {
      id: 'main',
      name: 'Main floor',
      rooms: [
        { id: 'bed', name: 'Bedroom', type: 'bedroom', rect: [0, 0, 14, 12] },
        { id: 'closet', name: 'Closet wall', type: 'closet', rect: [14, 0, 2.5, 12], note: 'A full wall of wardrobe doors facing the bedroom. It doubles as a sound buffer.' },
        { id: 'hall', name: 'Hall', type: 'hall', rect: [8, 12, 8.5, 4] },
        { id: 'bath', name: 'Bath', type: 'bath', rect: [0, 12, 8, 8] },
        { id: 'laundry', name: 'Laundry', type: 'laundry', rect: [8, 16, 8.5, 4] },
        { id: 'great', name: 'Great room', type: 'great', rect: [16.5, 0, 40, 20], note: 'Kitchen at the west end, dining in the middle, living toward the east. One room, three zones.' },
        { id: 'office', name: 'Office alcove', type: 'office', rect: [56.5, 0, 9, 14] },
        { id: 'entry', name: 'Entry', type: 'entry', rect: [56.5, 14, 9, 6] },
      ],
      doors: [
        { between: ['entry', 'outside'], side: 'S', at: 3, main: true },
        { between: ['entry', 'great'], kind: 'open' },
        { between: ['office', 'great'], kind: 'open', width: 6, at: 4 },
        { between: ['great', 'outside'], side: 'S', kind: 'slide', width: 8, at: 18 },
        { between: ['great', 'hall'], kind: 'pocket' },
        { between: ['hall', 'bed'], at: 1 },
        { between: ['hall', 'bath'], swing: 'bath' },
        { between: ['hall', 'laundry'], at: 1, swing: 'laundry' },
        { between: ['bed', 'closet'], kind: 'bifold', width: 5, at: 3 },
      ],
      windows: [
        { room: 'bed', side: 'N', width: 4, at: 5 },
        { room: 'bed', side: 'W', width: 3, at: 4.5 },
        { room: 'bath', side: 'W', width: 2, at: 5.5 },
        { room: 'great', side: 'N', width: 3, at: 8.5 },
        { room: 'great', side: 'N', width: 6, at: 24 },
        { room: 'great', side: 'N', width: 6, at: 32 },
        { room: 'great', side: 'S', width: 6, at: 4 },
        { room: 'great', side: 'S', width: 6, at: 30 },
        { room: 'office', side: 'N', width: 4, at: 2.5 },
        { room: 'office', side: 'E', width: 4, at: 5 },
      ],
      fixtures: [
        { item: 'fridge-36', room: 'great', wall: 'N', at: 3 },
        { item: 'counter', room: 'great', wall: 'N', at: 6, w: 24 },
        { item: 'sink-kitchen', room: 'great', wall: 'N', at: 8 },
        { item: 'dishwasher', room: 'great', wall: 'N', at: 11 },
        { item: 'counter', room: 'great', wall: 'N', at: 13, w: 24 },
        { item: 'range-30', room: 'great', wall: 'N', at: 15 },
        { item: 'counter', room: 'great', wall: 'N', at: 17.5, w: 36 },
        { item: 'island', room: 'great', x: 14, y: 7, rot: 0 },
        { item: 'tub', room: 'bath', wall: 'S', at: 0 },
        { item: 'vanity-30', room: 'bath', wall: 'N', at: 0.5 },
        { item: 'toilet', room: 'bath', wall: 'W', at: 2.2 },
        { item: 'washer', room: 'laundry', wall: 'S', at: 3.6 },
        { item: 'dryer', room: 'laundry', wall: 'S', at: 5.85 },
      ],
    },
  ],
};

export default layout;
