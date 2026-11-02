// End-to-end checks of the 3D walk view in headless Chrome (software WebGL).
// Usage: npm run e2e [-- scenario...]   (needs the dev server on :5340 and Google Chrome installed;
// set CHROME to its path if it isn't in the default Windows location). Screenshots go to e2e-out/.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const OUT = new URL('../e2e-out/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5340';
const F = 2.25 / 12;
const DESK = [
  { uid: 'desk', item: 'desk-l-large', floor: 'main', x: 3.2, y: F + 66 / 24, rot: 0 },
  { uid: 'riser', item: 'monitor-riser', floor: 'main', x: 2.6, y: F + 0.5, rot: 0 },
  { uid: 'mon', item: 'monitor-34uw', floor: 'main', x: 2.6, y: F + 0.5, rot: 0 },
  { uid: 'vmon', item: 'monitor-27-vertical', floor: 'main', x: 4.6, y: F + 0.6, rot: -20 },
  { uid: 'mat', item: 'desk-mat', floor: 'main', x: 2.6, y: F + 1.75, rot: 0 },
  { uid: 'kb', item: 'keyboard-tkl', floor: 'main', x: 2.3, y: F + 1.75, rot: 0 },
  { uid: 'mouse', item: 'mouse', floor: 'main', x: 3.4, y: F + 1.75, rot: 0 },
  { uid: 'pc', item: 'pc-full', floor: 'main', x: 5.6, y: F + 1.0, rot: 0 },
  { uid: 'chair', item: 'gaming-chair', floor: 'main', x: 2.6, y: F + 3.1, rot: 180 },
  { uid: 'shelf', item: 'shelf-36', floor: 'main', x: 2.6, y: F + 4 / 12, rot: 0, elev: 60 },
  { uid: 'poster', item: 'poster-24x36', floor: 'main', x: F + 1 / 24, y: 5.2, rot: 270 },
  { uid: 'bed', item: 'bed-queen', floor: 'main', x: 12.6, y: 9, rot: 180 },
  { uid: 'ns', item: 'nightstand', floor: 'main', x: 10.4, y: 13.0, rot: 180 },
  { uid: 'desksm', item: 'desk-small', floor: 'main', x: 9, y: 6, rot: 0 },
];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader', '--window-size=1400,900'],
  defaultViewport: { width: 1400, height: 900 },
});
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));

async function open(layout, items, extra = '') {
  await page.goto(BASE + '/?layout=studio-loft');
  await page.evaluate(
    (layout, items) => {
      localStorage.clear();
      if (items) localStorage.setItem(`floorwise:v1:items:${layout}`, JSON.stringify(items));
    },
    layout,
    items,
  );
  await page.goto(`${BASE}/?layout=${layout}&mode=walk&lowfx=1${extra}`);
  await page.waitForSelector('.walk-go', { timeout: 20000 });
  await page.click('.walk-go');
  await page.waitForFunction(() => !!document.querySelector('.walk-free-hint') || !!document.pointerLockElement, { timeout: 5000 });
  await sleep(600);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const canvasBox = async () => (await page.$('.walk canvas')).boundingBox();
async function centerClick() {
  const b = await canvasBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await sleep(300);
}
const walk = (fn, ...a) => page.evaluate((fn, a) => window.__walk[fn](...a), fn, a);
const items = (layout = 'studio-loft') => page.evaluate((l) => JSON.parse(localStorage.getItem(`floorwise:v1:items:${l}`) ?? '[]'), layout);
const aim = () => page.evaluate(() => document.querySelector('.walk-aim')?.textContent ?? '');
async function shot(name) {
  await page.screenshot({ path: OUT + name + '.png' });
}
async function key(code, ms = 500) {
  await page.evaluate((code) => window.dispatchEvent(new KeyboardEvent('keydown', { code })), code);
  await sleep(ms);
  await page.evaluate((code) => window.dispatchEvent(new KeyboardEvent('keyup', { code })), code);
  await sleep(150);
}
const results = [];
const check = (name, ok, info = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`);
};

const scenarios = {
  // a held floor piece stays under the crosshair as you look around
  async grabFloor() {
    await open('studio-loft', DESK);
    await walk('setPos', 9, 9.5);
    await walk('setLook', 0, -50); // look north and down at the compact desk at (9, 6)
    await sleep(400);
    check('aims at compact desk', (await aim()).includes('Compact desk'), await aim());
    await centerClick();
    check('holding', (await walk('held')) === 'desksm');
    const before = (await items()).find((i) => i.uid === 'desksm');
    await walk('setLook', 25, -50); // turn right 25 degrees
    await sleep(500);
    const after = (await items()).find((i) => i.uid === 'desksm');
    // expected: rotated about the camera by ~25deg at the same distance
    const d0 = Math.hypot(before.x - 9, before.y - 9.5),
      d1 = Math.hypot(after.x - 9, after.y - 9.5);
    check('held desk keeps its distance', Math.abs(d0 - d1) < 0.35, `d0=${d0.toFixed(2)} d1=${d1.toFixed(2)}`);
    check('held desk follows the turn', after.x > before.x + 0.8, `x ${before.x.toFixed(2)} -> ${after.x.toFixed(2)}`);
    await shot('grab-floor');
    await centerClick();
    check('put down', (await walk('held')) === null);
  },
  // wall pieces move up/down with your aim
  async wallHeight() {
    await open('studio-loft', DESK);
    await walk('setPos', 2.6, 6);
    let a = '';
    let pitch = -3;
    for (; pitch >= -14 && !a.includes('shelf'); pitch -= 1) {
      await walk('setLook', 0, pitch); // north, at the shelf (60-70" up, 5.6' away)
      await sleep(250);
      a = await aim();
    }
    check('aims at shelf', a.includes('shelf'), a);
    await centerClick();
    check('holding shelf', (await walk('held')) === 'shelf');
    await walk('setLook', 0, 8);
    await sleep(500);
    const up = (await items()).find((i) => i.uid === 'shelf');
    check('shelf moved up', up.elev > 66, `elev ${up.elev}`);
    await walk('setLook', 12, -12);
    await sleep(500);
    const down = (await items()).find((i) => i.uid === 'shelf');
    check('shelf moved down and sideways', down.elev < up.elev - 10 && down.x > up.x + 0.5, `elev ${down.elev} x ${down.x.toFixed(2)}`);
    await shot('wall-height');
    await centerClick();
  },
  // click a door to close it; a closed door blocks walking
  async doors() {
    await open('studio-loft', []);
    // the bath door: stand in the entry, face east toward the bath
    await walk('setPos', 10, 19.6);
    await walk('setLook', 90, -5);
    await sleep(500);
    await shot('door-before');
    const a = await aim();
    check('aims at a door', a.startsWith('Door'), a);
    await centerClick();
    await sleep(900);
    await shot('door-after');
    const a2 = await aim();
    check('door toggled', a2.includes(a.includes('close') ? 'open' : 'close'), a2);
    // a closed door blocks walking into the bath
    if (a2.includes('open')) {
      await walk('setLook', 90, 0);
      await key('KeyW', 1500);
      const c = await walk('cam');
      check('closed door blocks you', c.x < 12, `x=${c.x.toFixed(2)}`);
      await centerClick();
      await sleep(800);
      await key('KeyW', 1500);
      const c2 = await walk('cam');
      check('open door lets you through', c2.x > 12.3, `x=${c2.x.toFixed(2)}`);
    }
  },
  // grabbing a tall piece above eye level keeps it close instead of flinging it away
  async grabHigh() {
    await open('studio-loft', [{ uid: 'ward', item: 'armoire', floor: 'main', x: 9, y: 4, rot: 0 }]);
    await walk('setPos', 9, 7.5);
    let a = '';
    for (let pitch = 18; pitch >= 6 && !a.includes('Armoire'); pitch -= 2) {
      await walk('setLook', 0, pitch);
      await sleep(250);
      a = await aim();
    }
    check('aims high at the armoire', a.includes('Armoire'), a);
    await centerClick();
    await walk('setLook', 15, 14);
    await sleep(500);
    const it = (await items()).find((i) => i.uid === 'ward');
    const dist = Math.hypot(it.x - 9, it.y - 7.5);
    check('high-grabbed armoire stays near', dist < 6, `dist ${dist.toFixed(2)} at ${it.x.toFixed(2)},${it.y.toFixed(2)}`);
    await centerClick();
  },
  // you can't close a door on yourself
  async doorTrap() {
    await open('studio-loft', []);
    // stand right in the bath doorway (x 12 wall, opening near y 18.3..21)
    await walk('setPos', 12.0, 19.6);
    await walk('setLook', 90, -10);
    await sleep(400);
    const a = await aim();
    await centerClick();
    await sleep(400);
    const flash = await page.evaluate(() => document.querySelector('.walk-flash')?.textContent ?? '');
    const pk = await walk('pick');
    const doors = await page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.includes('doors')));
    const anyClosed = doors.some(([, v]) => Object.values(JSON.parse(v)).some(Boolean));
    check('a door never closes on you', flash.includes('doorway') || !anyClosed, `${JSON.stringify(pk)} | ${flash} | ${doors}`);
    // and you can still walk out
    await walk('setLook', 270, 0);
    await key('KeyW', 800);
    const c = await walk('cam');
    check('can walk out of the doorway', c.x < 11.6, `x=${c.x.toFixed(2)}`);
  },
  // picking up a rug used to blank the whole app (the side view had nothing to draw for a flat piece)
  async rug() {
    await open('studio-loft', [{ uid: 'rug', item: 'rug-5x8', floor: 'main', x: 9, y: 6, rot: 0 }]);
    // park the mouse at the center first: in pointer lock, moving it would turn the view
    const b = await canvasBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await sleep(200);
    const press = async () => {
      await page.mouse.down();
      await page.mouse.up();
      await sleep(300);
    };
    await walk('setPos', 9, 9.5);
    await walk('setLook', 0, -45);
    await sleep(400);
    check('aims at the rug', (await aim()).includes('Rug'), await aim());
    await press();
    await sleep(400);
    check('holding the rug', (await walk('held')) === 'rug');
    const alive = await page.evaluate(() => !!document.querySelector('.walk canvas') && !!document.querySelector('.insp h2'));
    check('app still on screen with the rug selected', alive);
    const r0 = (await items()).find((i) => i.uid === 'rug');
    await walk('setLook', 20, -45);
    await sleep(600);
    await press();
    const r = (await items()).find((i) => i.uid === 'rug');
    check('rug follows a turn to the right', r.x > r0.x + 0.8, `x ${r0.x.toFixed(2)} -> ${r.x.toFixed(2)}`);
  },
  async stairs() {
    await open('family-two-story', []);
    // stair rect [20.5, 14, 3.5, 11], climbing north; stand in the foyer south of it
    await walk('setPos', 22.25, 27);
    await walk('setLook', 0, -25);
    await sleep(500);
    const a = await aim();
    check('aims at stairs', a.startsWith('Stairs') && a.includes('up'), a);
    await shot('stairs-bottom');
    await centerClick();
    await sleep(2500);
    check('still walking after the stairs (no re-click)', !(await page.$('.walk-go')));
    const c = await walk('cam');
    const chip = await page.evaluate(() => document.querySelector('.walk-chip')?.textContent);
    check('arrived upstairs at the top of the stairs', c.y < 14 && c.y > 9, `pos ${c.x.toFixed(1)},${c.y.toFixed(1)} ${chip}`);
    const tab = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]')?.textContent);
    check('upper floor selected', /upper|second|2/i.test(tab ?? ''), tab);
    await walk('setLook', 180, -50);
    await sleep(500);
    await shot('stairs-top');
    const a2 = await aim();
    check('stairs lead back down', a2.includes('down'), a2);
  },
  async look() {
    await open('studio-loft', DESK, '&cam=7.2,7.4,-28,-8');
    await shot('look-desk');
    await walk('setLook', 150, -5);
    await sleep(300);
    await shot('look-bed');
    await walk('setLook', 200, 2);
    await sleep(300);
    await shot('look-window');
  },
};

const want = process.argv.slice(2);
for (const [name, fn] of Object.entries(scenarios)) {
  if (want.length && !want.includes(name)) continue;
  try {
    await fn();
  } catch (e) {
    check(name, false, e.message);
  }
}
console.log(results.join('\n'));
if (logs.length) console.log('--- console ---\n' + [...new Set(logs)].slice(0, 15).join('\n'));
await browser.close();
