import { createServer } from 'node:http';
import { randomBytes, randomInt } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { Simulation, idleInput, type Input } from '../src/game/simulation';

type Slot = { token: string; socket?: WebSocket; ready: boolean; input: Input; lastInput: number; lastSeen: number; taps: { jump: boolean; special: boolean } };
type Room = { code: string; slots: [Slot, Slot?]; sim: Simulation; started: boolean; touched: number };
const rooms = new Map<string, Room>();
const clients = new Map<WebSocket, { room: Room; slot: number }>();
const allowed = process.env.ALLOWED_ORIGIN?.split(',');
const http = createServer((req, res) => { if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, rooms: rooms.size })); } else { res.writeHead(404); res.end(); } });
const wss = new WebSocketServer({ server: http, maxPayload: 1024, verifyClient: ({ origin }: { origin: string }) => !allowed || !origin || allowed.includes(origin) });
function send(socket: WebSocket | undefined, data: unknown) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); }
function error(socket: WebSocket, message: string) { send(socket, { type: 'error', message }); }
function newSlot(socket: WebSocket): Slot { return { token: randomBytes(24).toString('hex'), socket, ready: false, input: idleInput(), lastInput: Date.now(), lastSeen: Date.now(), taps: { jump: false, special: false } }; }
function lobby(room: Room) { room.slots.forEach((s, i) => send(s?.socket, { type: 'lobby', code: room.code, slot: i, token: s?.token, ready: room.slots.map(s => !!s?.ready), connected: [!!room.slots[0]?.socket, !!room.slots[1]?.socket], started: room.started })); }
function start(room: Room) { room.started = true; room.slots.forEach((s, i) => send(s?.socket, { type: 'start', slot: i })); }
function detach(ws: WebSocket, permanent = false) {
 const c = clients.get(ws); if (!c) return;
 const s = c.room.slots[c.slot]!; if (s.socket !== ws) return;
 s.socket = undefined; s.input = idleInput(); s.lastSeen = permanent ? 0 : Date.now(); clients.delete(ws);
 if (permanent && !c.room.started && c.slot === 1) c.room.slots[1] = undefined;
 // Active rooms freeze during reconnect so the absent player cannot be killed.
 lobby(c.room);
}
wss.on('connection', ws => {
 let count = 0, lastWindow = Date.now();
 ws.on('message', raw => {
  if (Date.now() - lastWindow > 1000) { count = 0; lastWindow = Date.now(); }
  if (++count > 90) { ws.close(1008, 'Rate limit'); return; }
  let m; try { m = JSON.parse(raw.toString()); } catch { error(ws, 'Invalid message'); return; }
  if (!m || typeof m.type !== 'string') return;
  const membership = clients.get(ws);
  if (['create', 'join', 'reconnect'].includes(m.type) && membership) { error(ws, 'Already in a room'); return; }
  if (m.type === 'create') {
   if (rooms.size >= 100) { error(ws, 'Server is full. Try later.'); return; }
   let code: string; do { code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[randomInt(24)]).join(''); } while (rooms.has(code));
   const room: Room = { code, slots: [newSlot(ws)], sim: new Simulation(randomInt(0x100000000)), started: false, touched: Date.now() };
   rooms.set(code, room); clients.set(ws, { room, slot: 0 }); lobby(room);
  } else if (m.type === 'join') {
   const room = rooms.get(String(m.code)); if (!room) { error(ws, 'Room not found. Check the code.'); return; }
   if (room.slots[1] || room.started) { error(ws, 'This room already has two prisoners.'); return; }
   room.slots[1] = newSlot(ws); clients.set(ws, { room, slot: 1 }); lobby(room);
  } else if (m.type === 'reconnect') {
   const room = rooms.get(String(m.code)); const slot = room?.slots.findIndex(s => s && s.token === m.token);
   if (!room || slot === undefined || slot < 0 || Date.now() - room.slots[slot]!.lastSeen > 30000) { error(ws, 'Reserved slot expired. Create a new room.'); return; }
   const s = room.slots[slot]!;
   if (s.socket) { error(ws, 'This player is already connected.'); return; }
   s.socket = ws; s.lastSeen = Date.now(); clients.set(ws, { room, slot }); lobby(room);
   if (room.started && room.slots.every(s => s?.socket)) start(room);
  } else if (membership) {
   const { room, slot } = membership; const s = room.slots[slot]!;
   if (m.type === 'ready' && !room.started) { s.ready = m.value === true; lobby(room); if (room.slots.length === 2 && room.slots.every(s => s?.ready && s.socket)) start(room); }
   if (m.type === 'input' && room.started && m.value && typeof m.value === 'object') { for (const k of ['left', 'right', 'jump', 'interact', 'special'] as const) s.input[k] = m.value[k] === true; s.taps.jump ||= m.value.jump === true; s.taps.special ||= m.value.special === true; s.lastInput = Date.now(); }
   if (m.type === 'leave') { detach(ws, true); ws.close(); }
  }
 });
 ws.on('close', () => detach(ws)); ws.on('error', () => detach(ws));
});
let ticks = 0;
setInterval(() => {
 const now = Date.now(); ticks++;
 for (const [code, room] of rooms) {
  const connected = room.slots.filter(s => s?.socket).length;
  if (!connected && now - Math.max(...room.slots.map(s => s?.lastSeen ?? 0)) > 30000) { rooms.delete(code); continue; }
  if (room.started && room.slots.some(s => !s?.socket && now - (s?.lastSeen ?? 0) > 30000)) {
   room.slots.forEach(s => { if (s?.socket) { error(s.socket, 'Your partner’s reconnect window expired. Please create a new room.'); s.socket.close(); } }); rooms.delete(code); continue;
  }
  if (room.started && connected === 2) {
   room.sim.step(room.slots.map(s => now - s!.lastInput > 250 ? idleInput() : { ...s!.input, jump:s!.input.jump || s!.taps.jump, special:s!.input.special || s!.taps.special }));
   room.slots.forEach(s => { s!.taps.jump = false; s!.taps.special = false; });
   if (ticks % 3 === 0) room.slots.forEach(s => send(s?.socket, { type: 'state', state: room.sim.snapshot() }));
  }
 }
}, 1000 / 60).unref();
http.listen(Number(process.env.PORT || 2567), '0.0.0.0', () => console.log('Authoritative prison server listening on port', process.env.PORT || 2567));
process.on('SIGTERM', () => { wss.clients.forEach(s => s.close(1001, 'Server shutting down')); wss.close(); http.close(); });
