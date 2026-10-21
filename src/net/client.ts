import type { Input, Snapshot } from '../game/simulation';
export type Lobby = { code: string; slot: number; ready: boolean[]; connected: boolean[]; started: boolean };
export class RoomClient {
 ws?: WebSocket; token = ''; code = ''; stopped = false; attempts = 0; lastInput = 0; lastValue = ''; timer?: ReturnType<typeof setTimeout>;
 onLobby?: (state: Lobby) => void; onStart?: (slot: number) => void; onState?: (state: Snapshot) => void; onError?: (message: string) => void;
 constructor(public url: string) {}
 open(code: string) {
  this.code = code; this.stopped = false;
  try { this.ws = new WebSocket(this.url); } catch { this.onError?.('Invalid server URL. Configure a ws:// or wss:// endpoint.'); return; }
  this.ws.onopen = () => { this.attempts = 0; this.send({ type: this.token ? 'reconnect' : this.code ? 'join' : 'create', code: this.code, token: this.token }); };
  this.ws.onmessage = e => {
   let m; try { m = JSON.parse(String(e.data)); } catch { return; }
   if (m.type === 'lobby') { this.code = m.code; this.token = m.token; this.onLobby?.(m); }
   if (m.type === 'start') this.onStart?.(m.slot);
   if (m.type === 'state') this.onState?.(m.state);
   if (m.type === 'error') { this.stopped = true; this.onError?.(m.message); }
  };
  this.ws.onerror = () => this.onError?.('Could not reach the multiplayer server. Check its URL and start the backend.');
  this.ws.onclose = () => {
   if (this.stopped) return;
   if (this.token && this.attempts++ < 5) { this.onError?.('Reconnecting to your reserved slot…'); this.timer = setTimeout(() => this.open(this.code), 1200); }
   else this.onError?.('Disconnected. Return to the lobby to create or join a room.');
  };
 }
 send(data: unknown) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data)); }
 ready(value: boolean) { this.send({ type: 'ready', value }); }
 input(value: Input) { const now = performance.now(), encoded = JSON.stringify(value); if (now - this.lastInput < 30 && encoded === this.lastValue) return; this.lastInput = now; this.lastValue = encoded; this.send({ type: 'input', value }); }
 close() { this.stopped = true; clearTimeout(this.timer); this.send({ type: 'leave' }); this.ws?.close(); }
}
