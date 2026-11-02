import { useState } from 'react';

/** Short, original beginner notes. Edit freely: it's just data. */
const TOPICS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'read',
    title: 'Reading a floor plan',
    body: (
      <>
        <p>You are looking straight down at the house with the roof removed, north at the top.</p>
        <ul className="legend">
          <li><span className="lg lg-wall" /> Solid bars are walls. Thick ones are exterior walls.</li>
          <li><span className="lg lg-door" /> A line with a quarter circle is a swinging door; the arc shows where it sweeps.</li>
          <li><span className="lg lg-win" /> Thin double lines inside a wall are windows.</li>
          <li><span className="lg lg-open" /> A faint dashed line means two rooms are open to each other, with no wall.</li>
        </ul>
        <p>Room sizes read width × depth: 12'0" × 14'0" means 12 feet across and 14 feet top to bottom, measured to the middle of the walls.</p>
      </>
    ),
  },
  {
    id: 'zones',
    title: 'Zones: public, private, service',
    body: (
      <>
        <p>Good plans group rooms by how private they are. Turn on <b>Zones</b> in the top bar to see it.</p>
        <ul>
          <li><b>Public</b>: living, dining, kitchen. Guests go here, so it sits near the entry.</li>
          <li><b>Private</b>: bedrooms and their baths, usually farthest from the front door or upstairs.</li>
          <li><b>Service</b>: laundry, mudroom, pantry, garage. These work best near the kitchen or a side door.</li>
        </ul>
        <p>Architects call the gradual shift from public to private an "intimacy gradient": each step deeper into the house gets quieter.</p>
      </>
    ),
  },
  {
    id: 'flow',
    title: 'Circulation: how you move through',
    body: (
      <>
        <p>Turn on <b>Flow</b> to trace the route from the front door to every room.</p>
        <ul>
          <li>Paths should run along the edges of rooms, not cut through the middle of a sitting area or a bed zone.</li>
          <li>No one should walk through a bedroom to reach another room.</li>
          <li>Halls are useful but cost floor area. Many good plans keep hallways to roughly a tenth of the house or less.</li>
          <li>Short trips matter most: garage to kitchen (groceries), bedrooms to bath, kitchen to dining.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'wet',
    title: 'Wet walls and plumbing',
    body: (
      <>
        <p>Kitchens, bathrooms and laundry all need water supply and drains. Putting them back-to-back, or stacking them on two floors, means shorter pipe runs, less cost and fewer places to leak.</p>
        <p>That's why you often see a bathroom right behind the kitchen wall, or an upstairs bath directly above a downstairs one.</p>
        <p>One rule you'll see in every plan here: a bathroom door never opens straight into the kitchen or dining room.</p>
      </>
    ),
  },
  {
    id: 'kitchen',
    title: 'Kitchen work triangle',
    body: (
      <>
        <p>Draw a line between the sink, the stove and the fridge. Kitchen planning guidance suggests each leg be about 4–9 feet, with the total around 13–26 feet. Too small feels cramped; too big means lots of walking.</p>
        <p>Common kitchen shapes: <b>one-wall</b> (studios), <b>galley</b> (two parallel runs), <b>L-shape</b>, <b>U-shape</b>, and any of those plus an <b>island</b>. Keep 42" between counters for one cook, 48" for two.</p>
      </>
    ),
  },
  {
    id: 'light',
    title: 'Light and orientation',
    body: (
      <>
        <p>In the northern hemisphere:</p>
        <ul>
          <li><b>South</b> windows get the most sun all year: good for living rooms.</li>
          <li><b>East</b> gets morning light: nice for bedrooms and breakfast spots.</li>
          <li><b>West</b> gets hot late-afternoon sun: shade it or put garages and closets there.</li>
          <li><b>North</b> gives soft, even light: great for offices and studios.</li>
        </ul>
        <p>Rooms with windows on two sides feel brighter and get a cross-breeze.</p>
      </>
    ),
  },
  {
    id: 'clear',
    title: 'Clearances cheat sheet',
    body: (
      <table className="cheat">
        <tbody>
          <tr><td>Main walkway</td><td>36" min, 42"+ better</td></tr>
          <tr><td>Beside a bed</td><td>24"–30"</td></tr>
          <tr><td>In front of a dresser</td><td>36"</td></tr>
          <tr><td>Sofa to coffee table</td><td>14"–18"</td></tr>
          <tr><td>Behind a dining chair</td><td>36" to sit, 44" to walk past</td></tr>
          <tr><td>Kitchen aisle</td><td>42" one cook, 48" two</td></tr>
          <tr><td>Toilet centerline to wall</td><td>15" min (18" nicer)</td></tr>
          <tr><td>In front of a toilet</td><td>21" min, 30" nicer</td></tr>
          <tr><td>Interior door</td><td>30"–32" (36" accessible)</td></tr>
          <tr><td>Bedroom (code)</td><td>70 sq ft, 7' min side</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'heights',
    title: 'Heights: the third dimension',
    body: (
      <>
        <p>
          A plan is flat, but rooms aren't. Every piece here has a height, and two pieces only collide when they overlap on the plan <i>and</i> in
          height. That is why a PC tower can go under a desk and a shelf can hang over a dresser. Select a piece to see its side view.
        </p>
        <ul>
          <li><b>Desks and dining tables</b>: 29-30" high, with about 26" of knee room under them.</li>
          <li><b>Kitchen counters</b>: 36". Bar tops: 42". Standing desks for a tall person: about 44-46".</li>
          <li><b>Nightstands</b>: within a couple of inches of the mattress top.</li>
          <li><b>Art and posters</b>: center about 57-60" off the floor, the height galleries use.</li>
          <li><b>Shelves over a dresser or desk</b>: 18-24" above the top so things fit underneath.</li>
          <li><b>Wall TVs</b>: center near seated eye level, around 42". Higher than that strains your neck.</li>
          <li><b>Ceiling fans</b>: blades at least 7' up. Older homes usually have 8' ceilings; newer ones are often 9' (Floorwise uses 9').</li>
        </ul>
        <p>
          On the plan, pieces above about 4' (wall shelves, wall TVs, fans) are drawn dashed. That is a real drafting convention: the plan is a
          slice through the house about 4' up, and anything above the slice is shown dashed.
        </p>
      </>
    ),
  },
  {
    id: 'mistakes',
    title: 'Common beginner mistakes',
    body: (
      <ul>
        <li>Doors that hit each other, or swing into a toilet or a fridge.</li>
        <li>A living room that is really a hallway, with every path crossing the seating.</li>
        <li>Bedrooms sharing a thin wall with the TV room or the garage door.</li>
        <li>No place to drop coats, shoes and bags at the door you actually use most.</li>
        <li>A king bed in a room that only fits a queen: always check the 24" walkways.</li>
        <li>Forgetting where furniture goes: windows and doors on every wall leave nowhere for a bed or sofa.</li>
      </ul>
    ),
  },
  {
    id: 'more',
    title: 'Where to learn more',
    body: (
      <>
        <p>Search for these by name:</p>
        <ul className="res">
          <li><b>30X40 Design Workshop</b> (YouTube): an architect walks through how he lays out real houses, step by step.</li>
          <li><b>A Pattern Language</b> by Christopher Alexander and others (book, 1977): short "patterns" for how rooms relate, including the intimacy gradient.</li>
          <li><b>The Not So Big House</b> by Sarah Susanka (book): why smaller, well-arranged homes often live better than big ones.</li>
          <li><b>NKBA Kitchen & Bath Planning Guidelines</b>: the industry source for kitchen and bath clearances and the work triangle.</li>
          <li><b>Interior Design Illustrated</b> by Francis D.K. Ching (book): clear drawings of space planning and furniture clearances.</li>
          <li><b>Stewart Hicks</b> (YouTube): architecture ideas explained visually, good for building intuition.</li>
        </ul>
      </>
    ),
  },
];

export function LearnPanel() {
  const [open, setOpen] = useState<string>('read');
  return (
    <div className="learn">
      <p className="hint">Quick primers on how houses are put together. Each layout also has its own notes on the right.</p>
      {TOPICS.map((t) => (
        <section key={t.id} className={`topic ${open === t.id ? 'open' : ''}`}>
          <button className="topic-head" onClick={() => setOpen(open === t.id ? '' : t.id)} aria-expanded={open === t.id}>
            {t.title}
            <svg className={`chev ${open === t.id ? 'open' : ''}`} viewBox="0 0 12 12" width="12" height="12">
              <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          {open === t.id && <div className="topic-body">{t.body}</div>}
        </section>
      ))}
    </div>
  );
}
