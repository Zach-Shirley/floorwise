import type { LayoutDef } from '../../engine/types';

const layout: LayoutDef = {
  id: 'porch-cottage-one-bed',
  name: 'Porch Cottage',
  kind: 'cottage',
  styles: ['cottage', 'open-concept'],
  beds: 1,
  baths: 1,
  summary: 'A one-bedroom cottage with a full-width front porch and one big open room for living, cooking and dining.',
  notes: [
    {
      title: 'One great room instead of three small ones',
      body: 'Living, kitchen and dining share a single space with no walls between them. In a small house that makes every room feel bigger, and the cook stays part of the conversation.',
      rooms: ['living', 'kitchen', 'dining'],
    },
    {
      title: 'The porch is a room too',
      body: 'A 7\' deep porch is deep enough for chairs and a small table, not just a doorstep. It roughly doubles the living space in good weather and shades the south windows in summer.',
      rooms: ['porch'],
    },
    {
      title: 'Back wall does the plumbing',
      body: 'The bath, the laundry closet and the kitchen sink all sit on one shared wall line. That single "wet wall" carries supply and drain pipes for the whole house.',
      rooms: ['bath', 'laundry', 'kitchen'],
    },
    {
      title: 'Bedroom behind a hall, not off the living room',
      body: 'The bedroom door opens off a short hall rather than straight into the great room. Two doors and a few feet of hall cut down noise and light from the living area.',
      rooms: ['hall', 'bedroom'],
    },
    {
      title: 'A tight work triangle',
      body: 'Fridge, sink and stove form a triangle of about 21\' total. Under 26\' means fewer steps while cooking; the island-free layout keeps the walkway clear.',
      rooms: ['kitchen'],
    },
  ],
  floors: [
    {
      id: 'main',
      name: 'Main floor',
      rooms: [
        { id: 'bedroom', name: 'Bedroom', type: 'bedroom', rect: [0, 0, 13, 12], note: 'Two windows on two walls give cross-ventilation.' },
        { id: 'closet', name: 'Walk-in Closet', type: 'walkin', rect: [13, 0, 4, 7] },
        { id: 'hall', name: 'Hall', type: 'hall', rect: [13, 7, 4, 5] },
        { id: 'bath', name: 'Bath', type: 'bath', rect: [17, 3, 8, 9] },
        { id: 'laundry', name: 'Laundry', type: 'laundry', rect: [25, 7.5, 5, 4.5] },
        { id: 'living', name: 'Living Room', type: 'living', rect: [0, 12, 17, 16] },
        { id: 'kitchen', name: 'Kitchen', type: 'kitchen', rect: [17, 12, 13, 8] },
        { id: 'dining', name: 'Dining', type: 'dining', rect: [17, 20, 13, 8] },
        { id: 'porch', name: 'Front Porch', type: 'porch', rect: [0, 28, 30, 7] },
      ],
      doors: [
        { between: ['living', 'outside'], side: 'S', at: 7, main: true },
        { between: ['hall', 'living'], kind: 'open' },
        { between: ['kitchen', 'living'], kind: 'open' },
        { between: ['dining', 'living'], kind: 'open' },
        { between: ['kitchen', 'dining'], kind: 'open' },
        { between: ['hall', 'bedroom'] },
        { between: ['bedroom', 'closet'] },
        { between: ['hall', 'bath'], width: 2.5 },
        { between: ['kitchen', 'laundry'], kind: 'bifold', width: 4 },
      ],
      windows: [
        { room: 'living', side: 'S', width: 4, at: 1.5 },
        { room: 'living', side: 'S', width: 4, at: 11.5 },
        { room: 'living', side: 'W', width: 4 },
        { room: 'dining', side: 'S', width: 5 },
        { room: 'dining', side: 'E', width: 4 },
        { room: 'bedroom', side: 'N', width: 4, at: 4.5 },
        { room: 'bedroom', side: 'W', width: 3 },
        { room: 'bath', side: 'N', width: 2 },
      ],
      fixtures: [
        { item: 'fridge-36', room: 'kitchen', wall: 'N', at: 0 },
        { item: 'dishwasher', room: 'kitchen', wall: 'N', at: 3 },
        { item: 'sink-kitchen', room: 'kitchen', wall: 'N', at: 5 },
        { item: 'range-30', room: 'kitchen', wall: 'E', at: 2 },
        { item: 'counter', room: 'kitchen', wall: 'E', at: 4.5, w: 36 },
        { item: 'tub', room: 'bath', wall: 'N', at: 0.5 },
        { item: 'toilet', room: 'bath', wall: 'E', at: 3.5 },
        { item: 'vanity-36', room: 'bath', wall: 'S', at: 4 },
        { item: 'washer', room: 'laundry', wall: 'N', at: 0 },
        { item: 'dryer', room: 'laundry', wall: 'N', at: 2.25 },
      ],
    },
  ],
};

export default layout;
