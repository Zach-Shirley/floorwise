import type { LayoutDef } from '../../engine/types';

const layout: LayoutDef = {
  id: 'garden-cottage',
  name: 'Garden Cottage',
  kind: 'cottage',
  styles: ['cottage'],
  beds: 1,
  baths: 1,
  summary: 'A compact one-bedroom cottage: front porch, living room and galley kitchen up front, a quiet bedroom wing at the back.',
  notes: [
    {
      title: 'Front is public, back is private',
      body: 'The porch door lands you in the living room, the most social space. The bedroom sits behind a short hall, so guests never see it on the way in.',
      rooms: ['living', 'hall', 'bedroom'],
    },
    {
      title: 'One wet core',
      body: 'Kitchen, bath and laundry are stacked along the east side and touch each other. One short run of pipe serves all three, which keeps cost down and leaks easier to find.',
      rooms: ['kitchen', 'bath', 'laundry'],
    },
    {
      title: 'A hall that earns its keep',
      body: 'The hall is only 3\' x 8\', but every door opens off it: bedroom, bath and laundry. Small homes waste little space when one short hall serves many rooms.',
      rooms: ['hall'],
    },
    {
      title: 'One-wall kitchen',
      body: 'Fridge, stove and sink line up on a single wall. It is the most space-efficient kitchen shape and leaves the living room open to it.',
      rooms: ['kitchen'],
    },
  ],
  floors: [
    {
      id: 'main',
      name: 'Main floor',
      rooms: [
        { id: 'bedroom', name: 'Bedroom', type: 'bedroom', rect: [0, 0, 11, 12], note: 'Fits a queen bed with walkways on both sides.' },
        { id: 'closet', name: 'Closet', type: 'closet', rect: [11, 0, 3, 4] },
        { id: 'hall', name: 'Hall', type: 'hall', rect: [11, 4, 3, 8] },
        { id: 'bath', name: 'Bath', type: 'bath', rect: [14, 0, 6, 8] },
        { id: 'laundry', name: 'Laundry', type: 'laundry', rect: [14, 8, 6, 4] },
        { id: 'living', name: 'Living Room', type: 'living', rect: [0, 12, 14, 14] },
        { id: 'kitchen', name: 'Kitchen', type: 'kitchen', rect: [14, 12, 6, 14] },
        { id: 'porch', name: 'Porch', type: 'porch', rect: [2, 26, 10, 6] },
      ],
      doors: [
        { between: ['living', 'outside'], side: 'S', at: 4.5, main: true },
        { between: ['hall', 'living'], kind: 'open' },
        { between: ['kitchen', 'living'], kind: 'open' },
        { between: ['hall', 'bedroom'], at: 'start' },
        { between: ['bedroom', 'closet'], kind: 'bifold', width: 3 },
        { between: ['hall', 'bath'], width: 2.33 },
        { between: ['hall', 'laundry'], kind: 'bifold', width: 3 },
      ],
      windows: [
        { room: 'living', side: 'W', width: 4 },
        { room: 'living', side: 'S', width: 3, at: 9.5 },
        { room: 'bedroom', side: 'N', width: 4, at: 3.5 },
        { room: 'bedroom', side: 'W', width: 3 },
        { room: 'kitchen', side: 'S', width: 2.5 },
        { room: 'bath', side: 'E', width: 2, at: 4.5 },
      ],
      fixtures: [
        { item: 'fridge-30', room: 'kitchen', wall: 'E', at: 0 },
        { item: 'counter', room: 'kitchen', wall: 'E', at: 2.5, w: 18 },
        { item: 'range-30', room: 'kitchen', wall: 'E', at: 4 },
        { item: 'counter', room: 'kitchen', wall: 'E', at: 6.5, w: 24 },
        { item: 'sink-kitchen', room: 'kitchen', wall: 'E', at: 8.5 },
        { item: 'dishwasher', room: 'kitchen', wall: 'E', at: 11.5 },
        { item: 'tub', room: 'bath', wall: 'N', at: 0 },
        { item: 'toilet', room: 'bath', wall: 'E', at: 3 },
        { item: 'vanity-30', room: 'bath', wall: 'S', at: 2.5 },
        { item: 'stack-wd', room: 'laundry', wall: 'N', at: 3 },
      ],
    },
  ],
};

export default layout;
