import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, chmod } from 'node:fs/promises';

// Capture the running game through its UI and keyboard controls. The development
// inspection hook is read only: no teleportation, altered terrain, or mocked art.
const output = process.env.CAPTURE_DIR || 'artifacts/premium';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const captures = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir(output, { recursive: true });

async function capture(name, description) {
  const state = await page.evaluate(() => {
    const s = window.__prison.sim;
    return {
      tick: s.tick,
      players: s.players.map(p => ({ id: p.id, x: p.x, y: p.y, grounded: p.grounded })),
      plate: s.plate, hack: s.hack, gate: s.gate,
      remainingTiles: s.terrain.filter(t => t >= 0).length,
      activeExplosions: window.__prison.children.list
        .filter(o => o.texture?.key === 'explosion' && o.visible)
        .map(o => ({ x: o.x, y: o.y, frame: o.frame.name })),
    };
  });
  const path = `${output}/${name}.png`;
  await page.screenshot({ path });
  await chmod(path, 0o644);
  captures.push({ path, description, stateBeforeScreenshot: state });
  console.log(`Captured ${path}: tick ${state.tick}, plate ${state.plate}, hack ${state.hack.toFixed(2)}`);
}

async function drive(id, target) {
  await page.evaluate(({ id, target }) => new Promise((resolve, reject) => {
    const scene = window.__prison;
    const controls = id ? { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ShiftRight', special: 'ControlRight' }
      : { left: 'KeyA', right: 'KeyD', jump: 'Space', special: 'KeyG' };
    const held = new Set();
    const start = performance.now(), firstTick = scene.sim.tick;
    function key(code, down) {
      if (held.has(code) === down) return;
      if (down) held.add(code); else held.delete(code);
      window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true, cancelable: true }));
    }
    function release() { for (const code of [...held]) key(code, false); }
    function frame() {
      const sim = scene.sim, p = sim.players[id], dir = Math.sign(target - p.x);
      const gap = Math.abs(target - p.x), t = sim.tick - firstTick;
      if (gap < 4 && p.grounded && (id === 1 || Math.abs(p.y - 224) < 3)) {
        release(); resolve(); return;
      }
      if (performance.now() - start > 45000) {
        release(); reject(new Error(`Route stalled: player ${id} at ${p.x},${p.y}`)); return;
      }
      key(controls.left, gap > 3 && dir < 0);
      key(controls.right, gap > 3 && dir > 0);
      key(controls.jump, t % 48 < 30 && (sim.solid(p.x + dir * 12, p.y - 8) || p.y > 290 || (p.x > 390 && p.x < 475)));
      key(controls.special, id === 1 && p.x > 195 && p.x < 300 && t % 42 < 3);
      requestAnimationFrame(frame);
    }
    frame();
  }), { id, target });
}

try {
  await page.goto(process.env.GAME_CAPTURE_URL || 'http://127.0.0.1:5173');
  await page.click('#play');
  await page.click('#start');
  await page.waitForFunction(() => window.__prison.sim.tick > 60);
  await capture('characters', 'ZIP and BRICK in the actual playable prison scene.');

  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => window.__prison.sim.players[1].x > 209);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ControlRight');
  // Pause immediately after an actual peak-fire frame has rendered. This keeps a
  // slow screenshot encoder from advancing into the smoke phase; no game state,
  // textures, positions, or pixels are changed to manufacture the image.
  await page.evaluate(() => new Promise(resolve => {
    const game = window.__prison.game;
    const afterRender = () => {
      if (!window.__prison.children.list.some(o => o.texture?.key === 'explosion'
          && o.visible && Number(o.frame.name) >= 4 && Number(o.frame.name) <= 7)) return;
      game.events.off('postrender', afterRender);
      game.loop.sleep();
      resolve();
    };
    game.events.on('postrender', afterRender);
  }));
  await capture('explosions', 'A live blast-punch/barrel explosion removing masonry and floor tiles.');
  await page.evaluate(() => window.__prison.game.loop.wake());
  await page.keyboard.up('ControlRight');
  await page.waitForFunction(() => !window.__prison.children.list.some(o => o.texture?.key === 'explosion' && o.visible));
  await capture('aftermath', 'Actual expanding smoke, falling material fragments, exposed fracture edges and scorch residue after the blast.');

  await drive(1, 369);
  await drive(0, 487);
  await page.waitForFunction(() => window.__prison.sim.plate && Math.abs(window.__prison.sim.players[0].y - 224) < 3);
  await capture('environment', 'The scrolled prison environment, machinery, damaged masonry, and puzzle platforms.');
  await page.keyboard.down('KeyF');
  await page.waitForFunction(() => window.__prison.sim.hack > .25 && window.__prison.sim.hack < .8);
  await capture('cooperative', 'BRICK holds the power plate while ZIP actively hacks the linked terminal.');
  await page.waitForFunction(() => window.__prison.sim.gate);
  await page.keyboard.up('KeyF');
  await capture('gameplay', 'Both prisoners in the rendered scene immediately after completing the cooperative gate puzzle.');

  expect(errors).toEqual([]);
  await writeFile(`${output}/capture-evidence.json`, JSON.stringify({
    capturedAt: new Date().toISOString(), renderer: 'Phaser in Chromium via Playwright',
    viewport: { width: 1280, height: 720 }, controls: 'Keyboard input; game state observed, never overwritten',
    browserErrors: errors, captures,
  }, null, 2) + '\n');
} finally {
  await browser.close();
}
