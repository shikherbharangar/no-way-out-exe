import Phaser from 'phaser';
import { Simulation, COLS, ROWS, TILE, WORLD_W, idleInput, type Input, type GameEvent } from './simulation';
import { Sound } from './audio';
export type Binding = { left: string; right: string; jump: string; interact: string; special: string };
export const defaults: Binding[] = [
 { left: 'KeyA', right: 'KeyD', jump: 'Space', interact: 'KeyF', special: 'KeyG' },
 { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ShiftRight', interact: 'Enter', special: 'ControlRight' },
];
export class PrisonScene extends Phaser.Scene {
 sim = new Simulation(); sfx = new Sound(); activeRun = false; pausedRun = false; online = false; localSlot = 0;
 networkStep?: (input: Input) => void; onWin?: () => void; onPause?: () => void;
 keys = new Set<string>(); pressed = new Set<string>(); bindings: Binding[] = structuredClone(defaults);
 sprites!: Phaser.GameObjects.Sprite[]; guardSprites!: Phaser.GameObjects.Sprite[]; barrelSprites!: Phaser.GameObjects.Image[];
 terrainLayer!: Phaser.Tilemaps.TilemapLayer; previousTerrain: number[] = []; fx!: Phaser.GameObjects.Graphics; link!: Phaser.GameObjects.Graphics;
 gateGraphics!: Phaser.GameObjects.Graphics; hud!: Phaser.GameObjects.Graphics;
 flashes: { x: number; y: number; life: number; radius: number }[] = [];
 particles: { x: number; y: number; vx: number; vy: number; life: number; max: number; color: number; size: number; gravity: number }[] = [];
 fans: Phaser.GameObjects.Image[] = []; lamps: Phaser.GameObjects.Graphics[] = []; glowFx!: Phaser.GameObjects.Graphics;
 labels: Phaser.GameObjects.Text[] = []; names!: Phaser.GameObjects.Text[]; objective!: Phaser.GameObjects.Text; dialog!: Phaser.GameObjects.Text; hackLabel!: Phaser.GameObjects.Text;
 lastEvent = 0; accumulator = 0; freeze = 0; elapsedVisual = 0; lastHint = ''; winSent = false;
 constructor() { super('prison'); }
 preload() {
  for (const key of ['far', 'mid', 'fan']) this.load.image(key, `/assets/${key}.png`);
  for (const key of ['zip', 'brick', 'guard']) this.load.spritesheet(key, `/assets/${key}.png`, { frameWidth: 32, frameHeight: 40 });
  this.load.spritesheet('props', '/assets/props.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('explosion', '/assets/explosion.png', { frameWidth: 96, frameHeight: 96 });
  this.load.image('tiles', '/assets/tiles.png');
 }
 create() {
  this.cameras.main.setBackgroundColor('#101c27').setRoundPixels(true).setBounds(0, 0, WORLD_W, 360);
  this.add.image(0, 0, 'far').setOrigin(0).setScrollFactor(.16).setDepth(-20);
  this.add.image(0, 0, 'mid').setOrigin(0).setScrollFactor(.6).setDepth(-15).setAlpha(.85);
  this.buildArchitecture();
  const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: COLS, height: ROWS });
  const tiles = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
  this.terrainLayer = map.createBlankLayer('destructible', tiles, 0, 0)!.setDepth(2);
  this.syncTerrain();
  this.barrelSprites = this.sim.barrels.map(b => this.add.image(b.x, b.y, 'props', 0).setOrigin(.5, 1).setDepth(4));
  this.add.image(487, 224, 'props', 1).setOrigin(.5, 1).setDepth(3);
  this.add.image(110, 288, 'props', 8).setOrigin(.5, 1).setDepth(0);
  this.add.image(548, 191, 'props', 9).setOrigin(.5, 1).setDepth(0);
  this.add.image(645, 273, 'props', 7).setOrigin(.5, 1).setDepth(0);
  for (const x of [287, 790, 945]) this.add.image(x, 211, 'props', 4).setDepth(0);
  for (const x of [590, 1159]) this.add.image(x, 163, 'props', 5).setDepth(0);
  this.link = this.add.graphics().setDepth(6); this.gateGraphics = this.add.graphics().setDepth(5);
  this.sprites = ['zip', 'brick'].map(key => this.add.sprite(0, 0, key).setOrigin(.5, 1).setDepth(7));
  this.guardSprites = this.sim.guards.map(() => this.add.sprite(0, 0, 'guard').setOrigin(.5, 1).setDepth(6));
  this.fx = this.add.graphics().setDepth(9); this.glowFx = this.add.graphics().setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
  this.anims.create({ key: 'boom', frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 11 }), frameRate: 25, repeat: 0, hideOnComplete: true });
  this.names = this.sprites.map((_, i) => this.text(0, 0, i ? '02 BRICK' : '01 ZIP', i ? '#ffd18c' : '#95e8d5', 6).setDepth(12).setOrigin(.5));
  this.hackLabel = this.text(487, 157, 'LINK TERMINAL', '#8cc8b7', 6).setOrigin(.5);
  this.text(366, 304, 'WEIGHT > 90kg', '#b6b18b', 6).setOrigin(.5);
  this.text(248, 187, 'WEAK MASONRY', '#ca9d6e', 6).setOrigin(.5);
  this.text(864, 249, 'LOAD LIMIT: ONE IDIOT', '#d1a669', 6).setOrigin(.5);
  this.text(1193, 200, 'FREIGHT 04', '#bbbea3', 7).setOrigin(.5);
  this.hud = this.add.graphics().setScrollFactor(0).setDepth(29);
  this.objective = this.text(320, 17, '', '#d8d5b8', 7).setOrigin(.5).setScrollFactor(0).setDepth(30);
  this.dialog = this.text(320, 335, '', '#d2c9a7', 7).setOrigin(.5).setScrollFactor(0).setDepth(30);
  window.addEventListener('keydown', (e: KeyboardEvent) => {
   if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
   if (!this.keys.has(e.code)) this.pressed.add(e.code);
   this.keys.add(e.code);
   if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'ShiftRight', 'ControlRight'].includes(e.code)) e.preventDefault();
   if (e.code === 'Escape' && !e.repeat && this.activeRun) this.onPause?.();
  });
  window.addEventListener('keyup', (e: KeyboardEvent) => this.keys.delete(e.code));
  window.addEventListener('blur', () => { this.keys.clear(); this.pressed.clear(); if (this.activeRun && !this.online && !this.pausedRun) this.onPause?.(); });
  try { const stored = localStorage.getItem('nwo-bindings'); if (stored) this.bindings = JSON.parse(stored); } catch { /* use defaults */ }
  this.game.events.emit('prison-ready', this);
 }
 text(x: number, y: number, text: string, color: string, size = 8) { return this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: `${size}px`, color, stroke: '#102028', strokeThickness: 2, padding: { x: 2, y: 2 } }).setDepth(3); }
 buildArchitecture() {
  const g = this.add.graphics().setDepth(-2);
  // Near structural steel, detailed cross-bracing and rivets.
  for (const x of [16, 190, 580, 652, 932, 1125, 1255]) {
   g.fillStyle(0x0b1922).fillRect(x, 25, 16, 264); g.fillStyle(0x53655b).fillRect(x + 2, 25, 3, 264);
   g.fillStyle(0x2d4244).fillRect(x + 7, 25, 6, 264);
   for (let y = 42; y < 280; y += 31) { g.fillStyle(0x172c34).fillRect(x - 2, y, 20, 7); g.fillStyle(0x8b967c).fillRect(x + 1, y + 1, 2, 2).fillRect(x + 13, y + 1, 2, 2); }
  }
  // Cell bars, warm backlit sockets, catwalk rails, and industrial pipework.
  for (let x = 36; x < 184; x += 12) { g.fillStyle(0x0a1a23).fillRect(x, 88, 3, 145); g.fillStyle(0x5e7365).fillRect(x, 88, 1, 145); }
  for (const y of [90, 150, 229]) { g.fillStyle(0x20383d).fillRect(34, y, 148, 4); g.fillStyle(0x819178).fillRect(34, y, 148, 1); }
  const roof = this.add.graphics().setDepth(16);
  roof.fillStyle(0x09151e).fillRect(0, 0, WORLD_W, 43); roof.fillStyle(0x344b4d).fillRect(0, 41, WORLD_W, 4);
  for (let x = 0; x < WORLD_W; x += 32) {
   roof.lineStyle(2, 0x59685a).lineBetween(x, 7, x + 26, 36); roof.lineStyle(2, 0x20353c).lineBetween(x, 36, x + 26, 7);
   roof.fillStyle(0x98a087).fillRect(x + 3, 40, 2, 2); roof.fillStyle(0x1e333a).fillRect(x, 4, 3, 37);
  }
  roof.fillStyle(0x70806b).fillRect(0, 4, WORLD_W, 2);
  for (const x of [80, 350, 720, 1055]) {
   this.add.image(x, 49, 'props', 6).setOrigin(.5, 0).setDepth(17);
   const glow = this.add.graphics().setDepth(-1).setBlendMode(Phaser.BlendModes.ADD);
   for (let i = 0; i < 5; i++) { glow.fillStyle(0xd38b42, .022 + i * .012); glow.fillTriangle(x - 12, 84, x + 12, 84, x + 50 - i * 6, 286); glow.fillTriangle(x - 12, 84, x - 50 + i * 6, 286, x + 50 - i * 6, 286); }
   this.lamps.push(glow);
  }
  for (const x of [300, 775, 1070]) {
   this.add.image(x, 135, 'props', 3).setDepth(-1);
   this.fans.push(this.add.image(x, 135, 'fan').setDepth(0).setAlpha(.7));
  }
  // Cable tray and chained service walkway in the near background.
  for (let x = 212; x < 1120; x += 32) {
   g.lineStyle(1, 0x708170).strokeRect(x, 109, 30, 28); g.lineStyle(1, 0x283f42).lineBetween(x, 137, x + 28, 110);
   g.fillStyle(0x152b33).fillRect(x, 138, 32, 7); g.fillStyle(0x6c7c66).fillRect(x, 138, 32, 2);
  }
  for (const x of [565, 1095]) {
   g.fillStyle(0x132a33).fillRect(x, 154, 9, 131); g.fillStyle(0x637565).fillRect(x + 2, 156, 3, 128);
   for (let y = 160; y < 285; y += 23) { g.fillStyle(0x9b9d76).fillRect(x - 2, y, 12, 3); }
  }
  // Elevator alcove. The gate is drawn separately so it can retract.
  g.fillStyle(0x091b25).fillRect(1141, 206, 113, 82);
  for (let x = 1148; x < 1254; x += 8) { g.fillStyle(x % 16 ? 0x304d4d : 0x1c363d).fillRect(x, 209, 3, 77); }
  g.fillStyle(0x84947a).fillRect(1140, 286, 114, 2);
  for (let x = 1140; x < 1254; x += 10) { g.fillStyle(0xc5a05a).fillRect(x, 284, 5, 2); }
  // Broken pipes and rubble below the playable floor.
  const fg = this.add.graphics().setDepth(3);
  for (let x = 0; x < WORLD_W; x += 53) {
   fg.fillStyle(0x101f28).fillRect(x, 341, 47, 10); fg.fillStyle(0x65725c).fillRect(x, 342, 47, 2);
   fg.fillStyle(0x364943).fillRect(x + 7, 338, 5, 14);
  }
 }
 start(online = false, slot = 0) { this.sim = new Simulation(); this.previousTerrain = []; this.lastEvent = 0; this.activeRun = true; this.pausedRun = false; this.online = online; this.localSlot = slot; this.winSent = false; this.accumulator = 0; this.particles = []; this.keys.clear(); this.pressed.clear(); this.sfx.unlock(); this.cameras.main.fadeIn(400, 8, 15, 22); }
 readInputs(): Input[] {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  return this.bindings.map((b, i) => {
   const pad = pads[i]; const axis = pad?.axes[0] ?? 0; const down = (n: number) => !!pad?.buttons[n]?.pressed;
   return { left: this.keys.has(b.left) || axis < -.25 || down(14), right: this.keys.has(b.right) || axis > .25 || down(15), jump: this.keys.has(b.jump) || this.pressed.has(b.jump) || this.keys.has(i ? 'ArrowUp' : 'KeyW') || down(0), interact: this.keys.has(b.interact) || down(2), special: this.keys.has(b.special) || this.pressed.has(b.special) || down(1) };
  });
 }
 syncTerrain() {
  this.sim.terrain.forEach((t, i) => { if (this.previousTerrain[i] !== t) { const x = i % COLS, y = Math.floor(i / COLS); if (t < 0) this.terrainLayer.removeTileAt(x, y); else this.terrainLayer.putTileAt(t, x, y); } });
  this.previousTerrain = this.sim.terrain.slice();
 }
 burst(x: number, y: number, count: number, power = 1, dust = false) {
  const colors = dust ? [0x6b7566, 0x82947b, 0x374e4c] : [0xffdb85, 0xf39b45, 0x9b7857, 0x647568, 0x344b4c];
  for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, v = (25 + Math.random() * 150) * power; const life = .3 + Math.random() * .9; this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 55, life, max: life, color: colors[i % colors.length], size: dust ? 2 : 1 + Math.floor(Math.random() * 4), gravity: dust ? -15 : 270 }); }
 }
 event(e: GameEvent) {
  this.sfx.play(e.type);
  if (e.type === 'blast') {
   const boom = this.add.sprite(e.x, e.y, 'explosion').setDepth(13).setScale(e.power ?? 1).play('boom'); boom.once('animationcomplete', () => boom.destroy());
   this.burst(e.x, e.y, 55, e.power); this.cameras.main.shake(180, .006 * (e.power ?? 1)); this.freeze = .045;
   this.flashes.push({x:e.x,y:e.y,life:.18,radius:82*(e.power??1)});
  } else if (e.type === 'death') { this.burst(e.x, e.y, 25, .8); this.cameras.main.shake(100, .003); }
  else if (e.type === 'land' || e.type === 'jump') this.burst(e.x, e.y, 7, .3, true);
  else if (e.type === 'spark') this.burst(e.x, e.y, 7, .4);
  else if (e.type === 'gate' || e.type === 'checkpoint' || e.type === 'revive') { this.burst(e.x, e.y, 24, .7, true); if (e.type === 'gate') this.cameras.main.shake(350, .003); }
 }
 update(_time: number, ms: number) {
  if (!this.sprites) return;
  const dt = Math.min(ms / 1000, .05); this.elapsedVisual += dt;
  if (this.activeRun && this.online && this.pausedRun) this.networkStep?.(idleInput());
  if (this.activeRun && !this.pausedRun) {
   const inputs = this.readInputs();
   if (this.online) this.networkStep?.(inputs[0]);
   else if (this.freeze <= 0) {
    this.accumulator += dt;
    while (this.accumulator >= 1 / 60) { this.sim.step(inputs); this.accumulator -= 1 / 60; }
   }
  }
  if (this.online || (this.freeze <= 0 && this.accumulator < dt)) this.pressed.clear();
  this.freeze -= dt;
  this.syncTerrain();
  for (const e of this.sim.events) if (e.id > this.lastEvent) { this.event(e); this.lastEvent = e.id; }
  if (this.sim.won && !this.winSent) { this.winSent = true; this.time.delayedCall(700, () => this.onWin?.()); }
  this.drawWorld(dt);
 }
 drawWorld(dt: number) {
  const t = this.elapsedVisual, sim = this.sim;
  const target = this.activeRun ? (sim.players[0].x + sim.players[1].x) / 2 - 320 : 60;
  this.cameras.main.scrollX = Math.round(Phaser.Math.Linear(this.cameras.main.scrollX, Phaser.Math.Clamp(target, 0, WORLD_W - 640), Math.min(1, dt * 5)));
  this.fans.forEach((fan, i) => fan.setRotation(t * (i % 2 ? -1 : 1) * 2));
  this.lamps.forEach((l, i) => l.setAlpha(.8 + Math.sin(t * 3 + i * 8) * .08));
  this.barrelSprites.forEach((s, i) => s.setVisible(sim.barrels[i].alive));
  this.sprites.forEach((s, i) => {
   const p = sim.players[i], running = Math.abs(p.vx) > 15;
   let frame = Math.floor(t * 5) % 4;
   if (running) frame = 4 + Math.floor(t * (i ? 12 : 16)) % 8;
   if (!p.grounded) frame = p.vy < 0 ? 12 : 13;
   if (p.landed > 0) frame = 14;
   if (p.action > 0) frame = i === 0 && sim.plate && Math.abs(p.x - 487) < 32 ? 15 + Math.floor(t * 12) % 4 : 19 + Math.min(3, Math.floor((.32 - p.action) * 12));
   if (p.hurt > .9) frame = 23;
   if (p.reviving > 0) frame = 28 + Math.floor(t * 10) % 2;
   if (sim.won) frame = 30 + Math.floor(t * 8) % 2;
   if (p.ghost) frame = p.hurt > .55 ? 24 + Math.min(3, Math.floor((1.1 - p.hurt) * 8)) : 13;
   const x = this.activeRun ? this.online ? Phaser.Math.Linear(s.x, p.x, Math.min(1, dt * 24)) : p.x : 430 + i * 45;
   const y = this.activeRun ? this.online ? Phaser.Math.Linear(s.y - 4, p.y, Math.min(1, dt * 24)) : p.y : 288;
   s.setPosition(Math.round(x), Math.round(y) + 4 + (p.ghost ? -12 + Math.round(Math.sin(t * 6) * 3) : 0)).setFrame(frame).setFlipX(p.facing < 0);
   s.setAlpha(p.ghost ? .45 + Math.sin(t * 15) * .12 : p.hurt > 0 && Math.floor(t * 18) % 2 ? .4 : 1);
   if (p.ghost) s.setTint(0x79e8dd); else s.clearTint();
   this.names[i].setPosition(x, y - 43).setVisible(this.activeRun).setText(p.ghost ? 'HOLD INTERACT TO REVIVE' : i ? '02 BRICK' : '01 ZIP');
  });
  this.guardSprites.forEach((s, i) => { const g = sim.guards[i]; s.setPosition(Math.round(g.x), Math.round(g.y) + 1).setFrame(g.hp > 0 ? 4 + Math.floor(t * 8) % 8 : 27).setFlipX(g.direction < 0).setAlpha(g.hp > 0 ? 1 : .6); });
  this.link.clear();
  const a = this.sprites[0], b = this.sprites[1];
  if (Math.hypot(a.x - b.x, a.y - b.y) < 540) {
   this.link.lineStyle(1, sim.plate ? 0xa9fff0 : 0x65c4ba, sim.plate ? .9 : .34);
   const points = Array.from({ length: 17 }, (_, i) => ({ x: a.x + (b.x - a.x) * i / 16, y: a.y - 15 + (b.y - a.y) * i / 16 + Math.sin(i * 2 + t * 12) * (sim.plate ? 3 : 1) + Math.sin(i / 16 * Math.PI) * 5 }));
   this.link.strokePoints(points);
  }
  this.drawGate(t);
  this.fx.clear();
  for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.gravity > 0 && p.vy > 0 && sim.solid(p.x, p.y)) { p.y -= p.vy * dt; p.vy *= -.3; p.vx *= .65; } p.vy += p.gravity * dt; this.fx.fillStyle(p.color, Math.min(1, p.life * 3)).fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
  this.particles = this.particles.filter(p => p.life > 0);
  // Slow particulate drift and steam: quantized pixels, no soft circles.
  for (let i = 0; i < 40; i++) { const x = (i * 77 + t * (2 + i % 3)) % WORLD_W, y = 70 + (i * 47 - t * 7) % 230; this.fx.fillStyle(i % 3 ? 0x97a78d : 0xd6b579, .15 + (i % 4) * .06).fillRect(Math.round(x), Math.round(y), i % 3 ? 1 : 2, 1); }
  for (const bolt of sim.bolts) { this.fx.fillStyle(bolt.owner === 0 ? 0x96ffe3 : 0xffb265).fillRect(Math.round(bolt.x), Math.round(bolt.y), bolt.owner === 0 ? 8 : 5, 2); }
  for (const p of sim.players) if (p.shield > 0) { this.fx.lineStyle(2, 0xffc881, .8).strokeRect(p.x - 14, p.y - 34, 28, 36); }
  this.glowFx.clear();
  for (const f of this.flashes) { f.life -= dt; const r=f.radius, c=this.glowFx; c.fillStyle(0xffb85c, Math.max(0,f.life)); c.fillPoints([{x:f.x-r,y:f.y-r/2},{x:f.x-r/2,y:f.y-r},{x:f.x+r/2,y:f.y-r},{x:f.x+r,y:f.y-r/2},{x:f.x+r,y:f.y+r/2},{x:f.x+r/2,y:f.y+r},{x:f.x-r/2,y:f.y+r},{x:f.x-r,y:f.y+r/2}],true); }
  this.flashes=this.flashes.filter(f=>f.life>0);
  for (const [i, x] of [608, 1140].entries()) { const color = sim.gate ? 0x66d3b6 : 0xea6a3c; this.glowFx.fillStyle(color, .1 + Math.sin(t * 5 + i) * .04).fillRect(x - 12, 156, 32, 22); this.glowFx.fillStyle(color, .6).fillRect(x, 162, 5, 3); }
  this.renderHud();
 }
 drawGate(t: number) {
  const g = this.gateGraphics.clear();
  const bottom = this.sim.gate ? 176 : 288;
  g.fillStyle(0x0c2029).fillRect(602, 154, 27, bottom - 154);
  for (let y = 163; y < bottom; y += 12) {
   g.fillStyle(0x687b68).fillRect(606, y, 18, 3); g.fillStyle(0x304a4a).fillRect(606, y + 3, 18, 8);
   g.fillStyle(0xc6a45f).fillRect(608, y + 4, 3, 5); g.fillStyle(0x111e25).fillRect(615, y + 4, 3, 5);
  }
  g.fillStyle(0x142c32).fillRect(344, 284, 50, 4); g.fillStyle(this.sim.plate ? 0x9ce7be : 0xd0a464).fillRect(346, this.sim.plate ? 286 : 283, 46, 2);
  for (let x = 349; x < 391; x += 8) g.fillStyle(0x364b41).fillRect(x, 284, 3, 2);
  g.fillStyle(0x152a31).fillRect(464, 183, 46, 4); g.fillStyle(0x8fe0bf).fillRect(465, 184, 44 * this.sim.hack, 2);
  this.hackLabel.setText(this.sim.gate ? 'ACCESS GRANTED' : this.sim.plate ? 'ZIP: HOLD INTERACT' : 'NO LINK POWER').setColor(this.sim.plate || this.sim.gate ? '#a4edcc' : '#d5b17b');
  // Security camera sweep warns about live patrols.
  g.fillStyle(0x6c7f6e).fillRect(690, 154, 13, 7); g.fillStyle(0xef8853).fillRect(690 + (Math.sin(t) > 0 ? 1 : 10), 157, 2, 2);
 }
 renderHud() {
  this.hud.clear(); this.objective.setVisible(this.activeRun); this.dialog.setVisible(this.activeRun);
  if (!this.activeRun) return;
  const g = this.hud;
  g.fillStyle(0x0b1821, .94).fillRect(8, 7, 128, 28).fillRect(504, 7, 128, 28);
  g.lineStyle(1, 0x4c6c62, .8).strokeRect(8, 7, 128, 28).strokeRect(504, 7, 128, 28);
  for (const p of this.sim.players) {
   const x = p.id ? 515 : 19; g.fillStyle(p.id ? 0xe6a263 : 0x90ddc9).fillRect(x, 14, 10, 10);
   for (let i = 0; i < 3; i++) g.fillStyle(p.hp > i ? p.id ? 0xdba06b : 0x85cdbb : 0x293f44).fillRect(x + 20 + i * 25, 15, 21, 5);
   g.fillStyle(0x728b7c).fillRect(x + 20, 24, 71 * Math.max(0, 1 - p.cooldown / .65), 2);
  }
  let objective = !this.sim.gate ? (this.sim.plate ? '02 / ZIP: HACK THE TERMINAL' : '01 / BREAK OUT. POWER THE LINK.') : '03 / REACH THE FREIGHT ELEVATOR';
  if (this.sim.won) objective = 'PRISONER COUNT: 2 / BOTH STILL ALIVE';
  this.objective.setText(objective);
  const ghost = this.sim.players.some(p => p.ghost);
  let hint = !this.sim.gate ? 'BRICK: "Does your plan involve explosions?"   ZIP: "Eventually."' : this.sim.checkpoint ? 'WARDEN.exe: "The exit is real. The freedom is a clerical error."' : 'CHECKPOINT AHEAD  /  Bring both prisoners through the bulkhead.';
  if (this.sim.players[1].x > 280 && !this.sim.gate) hint = 'BRICK: stand on the brass plate. ZIP: climb the steps + hold F at the terminal.';
  if (ghost) hint = 'HOLOGRAM FAILURE  /  Stand beside your partner and hold INTERACT to revive.';
  if (this.sim.players.every(p => p.x > 1110)) hint = 'BOTH PRISONERS IN THE LIFT  /  Press either INTERACT to escape.';
  if (Math.abs(this.sim.players[0].x - this.sim.players[1].x) > 490) hint = 'LINK AT MAXIMUM RANGE  /  Bring your partner with you.';
  this.dialog.setText(hint);
  g.fillStyle(0x0b1821, .9).fillRect(20, 326, 600, 19);
 }
}
