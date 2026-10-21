/** Fixed-step, renderer-independent authoritative simulation. Units are world pixels. */
export const TILE = 16, COLS = 80, ROWS = 22, WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE;
export type Input = { left: boolean; right: boolean; jump: boolean; interact: boolean; special: boolean };
export const idleInput = (): Input => ({ left: false, right: false, jump: false, interact: false, special: false });
export type Player = { id: number; x: number; y: number; vx: number; vy: number; facing: number; grounded: boolean; hp: number; ghost: boolean; coyote: number; buffer: number; cooldown: number; action: number; hurt: number; shield: number; wasJump: boolean; wasSpecial: boolean; wall: number; airDash: boolean; revive: number; landed: number; reviving: number };
export type GameEvent = { id: number; type: 'blast' | 'jump' | 'land' | 'hurt' | 'death' | 'revive' | 'gate' | 'win' | 'spark' | 'checkpoint'; x: number; y: number; power?: number };
export type Barrel = { x: number; y: number; alive: boolean };
export type Guard = { x: number; y: number; hp: number; direction: number; cooldown: number; min: number; max: number };
export type Bolt = { x: number; y: number; vx: number; owner: number; life: number };
export type Snapshot = { tick: number; players: Player[]; terrain: number[]; barrels: Barrel[]; guards: Guard[]; bolts: Bolt[]; gate: boolean; plate: boolean; hack: number; checkpoint: boolean; won: boolean; deaths: number; events: GameEvent[]; collapse: number; elapsed: number };
export function makeTerrain(): number[] {
 const t = new Array(COLS * ROWS).fill(-1);
 for (let y = 18; y < ROWS; y++) for (let x = 0; x < COLS; x++) t[y * COLS + x] = y === 18 ? 9 : y === 21 ? 11 : 3 + (x * 13 + y) % 3;
 // Cracked cell-block partition. Everything except foundations can be destroyed.
 for (let y = 12; y < 18; y++) for (let x = 15; x < 18; x++) t[y * COLS + x] = 8;
 for (let x = 26; x < 33; x++) t[14 * COLS + x] = x >= 29 && x <= 31 ? 6 : 7;
 // Bolted machinery footings preserve the mandatory puzzle after arbitrary blasts.
 for (let x = 21; x < 25; x++) t[18 * COLS + x] = 6;
 for (let x = 25; x < 27; x++) t[16 * COLS + x] = 6;
 for (let x = 43; x < 48; x++) t[14 * COLS + x] = 7;
 for (let x = 51; x < 57; x++) { t[17 * COLS + x] = 7; t[18 * COLS + x] = -1; t[19 * COLS + x] = -1; }
 for (let x = 59; x < 64; x++) t[15 * COLS + x] = 7;
 return t;
}
function player(id: number): Player { return { id, x: 90 + id * 48, y: 288, vx: 0, vy: 0, facing: 1, grounded: true, hp: 3, ghost: false, coyote: .1, buffer: 0, cooldown: 0, action: 0, hurt: 0, shield: 0, wasJump: false, wasSpecial: false, wall: 0, airDash: false, revive: 0, landed: 0, reviving: 0 }; }
export class Simulation {
 tick = 0; elapsed = 0; players = [player(0), player(1)]; terrain = makeTerrain();
 barrels: Barrel[] = [{ x: 230, y: 288, alive: true }, { x: 754, y: 288, alive: true }, { x: 1000, y: 288, alive: true }];
 guards: Guard[] = [{ x: 730, y: 288, hp: 2, direction: -1, cooldown: 1.5, min: 666, max: 790 }, { x: 1030, y: 288, hp: 2, direction: -1, cooldown: 2, min: 930, max: 1100 }];
 bolts: Bolt[] = []; events: GameEvent[] = []; eventId = 0;
 gate = false; plate = false; hack = 0; checkpoint = false; won = false; deaths = 0; collapse = -1; resetTimer = 0;
 emit(type: GameEvent['type'], x: number, y: number, power = 1) { this.events.push({ id: ++this.eventId, type, x, y, power }); if (this.events.length > 64) this.events.shift(); }
 solid(x: number, y: number) {
  if (x < 0 || x >= WORLD_W) return true;
  if (y < 0 || y >= WORLD_H) return false;
  if (!this.gate && x >= 608 && x < 624 && y > 160 && y < 288) return true;
  return this.terrain[Math.floor(y / TILE) * COLS + Math.floor(x / TILE)] >= 0;
 }
 hits(x: number, y: number) { return this.solid(x - 7, y - 1) || this.solid(x + 6, y - 1) || this.solid(x - 7, y - 25) || this.solid(x + 6, y - 25) || this.solid(x - 7, y - 13) || this.solid(x + 6, y - 13); }
 destroy(cx: number, cy: number, radius: number) {
  for (let y = Math.max(0, Math.floor((cy - radius) / TILE)); y <= Math.min(20, Math.floor((cy + radius) / TILE)); y++)
   for (let x = Math.max(0, Math.floor((cx - radius) / TILE)); x <= Math.min(COLS - 1, Math.floor((cx + radius) / TILE)); x++)
    if (this.terrain[y * COLS + x] !== 6 && this.terrain[y * COLS + x] !== 11 && Math.hypot(x * TILE + 8 - cx, y * TILE + 8 - cy) < radius) this.terrain[y * COLS + x] = -1;
 }
 explode(x: number, y: number, radius = 51) {
  this.destroy(x, y, radius); this.emit('blast', x, y, radius / 50);
  for (const g of this.guards) if (g.hp > 0 && Math.hypot(g.x - x, g.y - 14 - y) < radius + 14) { g.hp = 0; this.emit('death', g.x, g.y - 15); }
  // Explosive chain reactions are deterministic; mark first to prevent recursion.
  for (const b of this.barrels) if (b.alive && Math.hypot(b.x - x, b.y - 15 - y) < radius + 15) { b.alive = false; this.explode(b.x, b.y - 16, 58); }
 }
 damage(p: Player) {
  if (p.ghost || p.hurt > 0 || p.shield > 0) return;
  p.hp--; p.hurt = 1.1; p.vy = -140; this.emit('hurt', p.x, p.y - 16);
  if (p.hp <= 0) { p.ghost = true; p.vx = 0; p.vy = 0; this.deaths++; this.emit('death', p.x, p.y - 16); }
 }
 step(inputs: Input[], dt = 1 / 60) {
  if (this.won) return;
  this.tick++; this.elapsed += dt;
  for (const p of this.players) {
   const input = inputs[p.id] ?? idleInput();
   for (const k of ['cooldown', 'action', 'hurt', 'shield', 'landed', 'reviving'] as const) p[k] = Math.max(0, p[k] - dt);
   if (p.ghost) continue;
   p.coyote = p.grounded ? .11 : Math.max(0, p.coyote - dt);
   p.buffer = input.jump && !p.wasJump ? .12 : Math.max(0, p.buffer - dt);
   const axis = Number(input.right) - Number(input.left), speed = p.id === 0 ? 148 : 115;
   if (axis) p.facing = axis;
   const acceleration = p.grounded ? 1150 : 760;
   const target = axis * speed;
   p.vx += Math.max(-acceleration * dt, Math.min(acceleration * dt, target - p.vx));
   if (p.buffer > 0 && (p.coyote > 0 || (p.id === 0 && p.wall !== 0))) {
    p.vy = p.id === 0 ? -320 : -305;
    if (!p.grounded && p.wall) p.vx = -p.wall * 210;
    p.grounded = false; p.coyote = 0; p.buffer = 0; this.emit('jump', p.x, p.y);
   }
   if (!input.jump && p.wasJump && p.vy < -100) p.vy *= .48;
   if (input.special && !p.wasSpecial && p.cooldown === 0) {
    p.action = .32;
    if (p.id === 1) { p.cooldown = .65; p.shield = .4; this.explode(p.x + p.facing * 29, p.y - 16, 39); }
    else {
     p.cooldown = .55;
     this.bolts.push({ x: p.x + p.facing * 12, y: p.y - 16, vx: p.facing * 350, owner: 0, life: 1.5 });
     if (!p.grounded && !p.airDash) { p.vx = p.facing * 430; p.vy = -30; p.airDash = true; }
     this.emit('spark', p.x, p.y - 14);
    }
   }
   p.wasJump = input.jump; p.wasSpecial = input.special;
   p.vy = Math.min(450, p.vy + 860 * dt);
   // Sub-pixel axis sweep avoids tunnelling at dash speeds.
   p.wall = 0;
   const partner = this.players[1 - p.id];
   if (!partner.ghost && Math.abs(p.x - partner.x) > 510 && Math.sign(p.vx) === Math.sign(p.x - partner.x)) p.vx = 0;
   let dx = p.vx * dt;
   while (Math.abs(dx) > .001) { const s = Math.sign(dx) * Math.min(1, Math.abs(dx)); if (this.hits(p.x + s, p.y)) { p.wall = Math.sign(s); p.vx = 0; break; } p.x += s; dx -= s; }
   let dy = p.vy * dt; const wasGrounded = p.grounded; p.grounded = false;
   while (Math.abs(dy) > .001) { const s = Math.sign(dy) * Math.min(1, Math.abs(dy)); if (this.hits(p.x, p.y + s)) { if (s > 0) { p.grounded = true; p.airDash = false; if (!wasGrounded && p.vy > 120) { this.emit('land', p.x, p.y); p.landed = .1; } } p.vy = 0; break; } p.y += s; dy -= s; }
   if (p.y > WORLD_H + 24) { p.hurt = 0; p.hp = 1; this.damage(p); p.y = 312; }
   if (input.interact) {
    const other = this.players[1 - p.id];
    if (other.ghost && Math.hypot(other.x - p.x, other.y - p.y) < 50) {
     other.revive += dt;
     if (other.revive > .8) { other.ghost = false; other.hp = 3; other.hurt = 1.4; other.x = p.x + (p.id ? -20 : 20); other.y = p.y; other.revive = 0; other.reviving = .45; this.emit('revive', other.x, other.y - 16); }
    }
   }
   if (p.x > 818 && p.x < 910 && p.y <= 273 && p.y > 260 && this.collapse < 0) this.collapse = .8;
  }
  this.plate = !this.players[1].ghost && Math.abs(this.players[1].x - 369) < 22 && Math.abs(this.players[1].y - 288) < 6;
  const zip = this.players[0];
  if (!this.gate) {
   if (this.plate && !zip.ghost && Math.abs(zip.x - 487) < 32 && Math.abs(zip.y - 224) < 8 && inputs[0]?.interact) {
    this.hack = Math.min(1, this.hack + dt / 1.5); zip.action = .1;
    if (this.hack === 1) { this.gate = true; this.emit('gate', 616, 225); }
   } else this.hack = Math.max(0, this.hack - dt * .12);
  }
  if (this.gate && !this.checkpoint && this.players.every(p => !p.ghost && p.x > 640)) { this.checkpoint = true; this.emit('checkpoint', 665, 250); }
  if (this.collapse > 0) {
   this.collapse -= dt;
   if (this.collapse <= 0) { this.destroy(864, 275, 48); this.emit('blast', 864, 275, .7); this.collapse = -2; }
  }
  for (const g of this.guards) {
   if (g.hp <= 0) continue;
   g.x += g.direction * 24 * dt;
   if (g.x < g.min || g.x > g.max || this.solid(g.x + g.direction * 10, g.y - 12) || !this.solid(g.x + g.direction * 10, g.y + 2)) g.direction *= -1;
   if (!this.solid(g.x, g.y + 1)) g.y = Math.min(336, g.y + 150 * dt);
   g.cooldown -= dt;
   const target = this.players.find(p => !p.ghost && Math.abs(p.x - g.x) < 190 && Math.abs(p.y - g.y) < 45 && (this.gate || p.x > 624));
   if (target && g.cooldown <= 0) { g.direction = Math.sign(target.x - g.x); g.cooldown = 1.4; this.bolts.push({ x: g.x + g.direction * 12, y: g.y - 15, vx: g.direction * 170, life: 2, owner: 2 }); this.emit('spark', g.x, g.y - 15); }
  }
  for (const b of this.bolts) {
   b.x += b.vx * dt; b.life -= dt;
   if (this.solid(b.x, b.y)) { b.life = 0; this.emit('spark', b.x, b.y); }
   if (b.owner === 0) {
    for (const g of this.guards) if (g.hp > 0 && Math.abs(b.x - g.x) < 12 && Math.abs(b.y - g.y + 14) < 16) { g.hp--; b.life = 0; this.emit(g.hp ? 'hurt' : 'death', g.x, g.y - 15); break; }
    for (const barrel of this.barrels) if (barrel.alive && Math.abs(b.x - barrel.x) < 14 && Math.abs(b.y - barrel.y + 15) < 18) { barrel.alive = false; this.explode(barrel.x, barrel.y - 16, 58); b.life = 0; break; }
   } else for (const p of this.players) if (!p.ghost && Math.abs(b.x - p.x) < 9 && Math.abs(b.y - p.y + 14) < 14) { this.damage(p); b.life = 0; break; }
  }
  this.bolts = this.bolts.filter(b => b.life > 0);
  if (this.players.every(p => p.ghost)) {
   this.resetTimer += dt;
   if (this.resetTimer > 1.1) this.respawn();
  } else this.resetTimer = 0;
  // Elevator requires two living prisoners inside. No solo exit.
  if (this.players.every(p => !p.ghost && p.x > 1160 && p.y > 270) && inputs.some(i => i.interact)) { this.won = true; this.emit('win', 1200, 250); }
 }
 respawn() {
  this.players = [player(0), player(1)]; this.terrain = makeTerrain(); this.bolts = []; this.collapse = -1; this.resetTimer = 0;
  if (this.checkpoint) { this.players[0].x = 658; this.players[1].x = 688; }
  this.barrels.forEach(b => b.alive = true); this.guards.forEach(g => { g.hp = 2; g.y = 288; g.cooldown = 2; });
  this.emit('revive', this.players[0].x, 270);
 }
 snapshot(): Snapshot { return { tick: this.tick, players: this.players, terrain: this.terrain, barrels: this.barrels, guards: this.guards, bolts: this.bolts, gate: this.gate, plate: this.plate, hack: this.hack, checkpoint: this.checkpoint, won: this.won, deaths: this.deaths, events: this.events.slice(-24), collapse: this.collapse, elapsed: this.elapsed }; }
 apply(s: Snapshot) { Object.assign(this, s); }
}
