import type { LayoutDef } from '../../engine/types';

const layout: LayoutDef = {
  id: 'open-core-one-bed',
  name: 'Open Core One-Bed',
  kind: 'house',
  styles: ['great-room', 'open-concept'],
  beds: 1,
  baths: 1,
  summary:
    'A nearly square house with all the plumbing packed into one box in the middle. A long great room, the kitchen and a work corner wrap around that core instead of being split into small rooms.',
  notes: [
    {
      title: 'One box holds all the plumbing',
      body: 'The bath, laundry and walk-in closet sit together in a 10\' x 12\' "core" in the middle of the floor. Every pipe lives in that one block, right next to the kitchen. Everything else can stay open because it does not need water.',
      rooms: ['bath', 'laundry', 'walkin', 'kitchen'],
    },
    {
      title: 'Walk a loop, not a hallway',
      body: 'There is no corridor. You move from the entry through the kitchen into the great room and on to the work corner, circling the core. Hallways usually take 10-15% of a house; here that floor area goes to rooms you actually use.',
      rooms: ['entry', 'kitchen', 'great', 'office'],
    },
    {
      title: 'Long, unbroken walls',
      body: 'The great room is 32\' long with windows only on the outside wall, so the long core wall stays blank. That gives you room for a full bookcase wall, a big TV, art or a workbench, which chopped-up plans rarely leave.',
      rooms: ['great'],
    },
    {
      title: 'Zone with furniture, not walls',
      body: 'Open plans feel best when furniture marks each zone. A rug and sofa group defines the living end and a table defines the dining end. The open office corner reads as its own space because it turns the corner around the core.',
      rooms: ['great', 'office'],
    },
    {
      title: 'The tradeoff: noise and smells',
      body: 'With no doors between kitchen, living and office, cooking smells and sound travel everywhere. A strong range hood and soft surfaces (rugs, curtains, a fabric sofa) matter more here than in a closed plan. The bedroom is the one quiet room with a real door.',
      rooms: ['kitchen', 'bed'],
    },
  ],
  floors: [
    {
      id: 'main',
      name: 'Main floor',
      rooms: [
        { id: 'great', name: 'Great room', type: 'great', rect: [0, 0, 32, 11], note: 'Living at one end, dining at the other: one rug and one table are all it takes to zone it.' },
        { id: 'kitchen', name: 'Kitchen', type: 'kitchen', rect: [0, 11, 11, 12] },
        { id: 'bath', name: 'Bath', type: 'bath', rect: [11, 11, 10, 6] },
        { id: 'laundry', name: 'Laundry', type: 'laundry', rect: [11, 17, 5, 6] },
        { id: 'walkin', name: 'Walk-in', type: 'walkin', rect: [16, 17, 5, 6] },
        { id: 'office', name: 'Work corner', type: 'office', rect: [21, 11, 11, 12], note: 'Open to the great room but around a corner, so a desk here is out of the TV sightline.' },
        { id: 'entry', name: 'Entry & drop zone', type: 'entry', rect: [0, 23, 11, 11] },
        { id: 'bed', name: 'Bedroom', type: 'primary', rect: [11, 23, 21, 11], note: 'Long enough for a bed at one end and a reading chair or desk at the other.' },
      ],
      doors: [
        { between: ['entry', 'outside'], side: 'S', at: 6, main: true },
        { between: ['entry', 'kitchen'], kind: 'open' },
        { between: ['kitchen', 'great'], kind: 'open' },
        { between: ['great', 'office'], kind: 'open' },
        { between: ['great', 'bath'], at: 0.5 },
        { between: ['kitchen', 'laundry'], kind: 'pocket', at: 1.5 },
        { between: ['entry', 'bed'], at: 1 },
        { between: ['bed', 'walkin'], kind: 'pocket', at: 1 },
      ],
      windows: [
        { room: 'great', side: 'N', width: 5, at: 3 },
        { room: 'great', side: 'N', width: 5, at: 13.5 },
        { room: 'great', side: 'N', width: 5, at: 24 },
        { room: 'great', side: 'W', width: 4 },
        { room: 'great', side: 'E', width: 4 },
        { room: 'kitchen', side: 'W', width: 3, at: 5.2 },
        { room: 'office', side: 'E', width: 4 },
        { room: 'entry', side: 'W', width: 3 },
        { room: 'bed', side: 'S', width: 4, at: 4 },
        { room: 'bed', side: 'S', width: 4, at: 14 },
        { room: 'bed', side: 'E', width: 3 },
      ],
      fixtures: [
        { item: 'fridge-36', room: 'kitchen', wall: 'W', at: 0 },
        { item: 'counter', room: 'kitchen', wall: 'W', at: 3, w: 24 },
        { item: 'sink-kitchen', room: 'kitchen', wall: 'W', at: 5 },
        { item: 'dishwasher', room: 'kitchen', wall: 'W', at: 8 },
        { item: 'counter', room: 'kitchen', wall: 'W', at: 10, w: 18 },
        { item: 'range-30', room: 'kitchen', wall: 'E', at: 2.5 },
        { item: 'vanity-30', room: 'bath', wall: 'N', at: 4.5 },
        { item: 'toilet', room: 'bath', wall: 'S', at: 2.5 },
        { item: 'tub', room: 'bath', wall: 'E', at: 0.3 },
        { item: 'washer', room: 'laundry', wall: 'E', at: 0.2 },
        { item: 'dryer', room: 'laundry', wall: 'E', at: 2.5 },
      ],
    },
  ],
};

export default layout;
