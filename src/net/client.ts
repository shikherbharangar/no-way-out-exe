import type { Input, Snapshot } from '../game/simulation';
export type Lobby = { code: string; slot: number; ready: boolean[]; connected: boolean[]; started: boolean };
export const CONNECTION_POLICY = { initialMs: 120000, reconnectMs: 25000, initialAttemptMs: 20000, reconnectAttemptMs: 6000, maxBackoffMs: 8000 };

export function endpointError(value: string, pageProtocol = globalThis.location?.protocol): string | undefined {
 let url: URL;
 try { url = new URL(value); } catch { return 'The multiplayer server address is invalid. Local co-op is still available.'; }
 if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) return 'The multiplayer address must be a ws:// or wss:// endpoint without credentials or a fragment.';
 if (pageProtocol === 'https:' && url.protocol !== 'wss:') return 'This secure page needs a secure wss:// multiplayer server. Local co-op is still available.';
}

export class RoomClient {
 ws?: WebSocket; token = ''; code = ''; stopped = true; attempts = 0; lastInput = 0; lastValue = '';
 private deadline = 0; private retryTimer?: ReturnType<typeof setTimeout>; private attemptTimer?: ReturnType<typeof setTimeout>;
 onLobby?: (state: Lobby) => void; onStart?: (slot: number) => void; onState?: (state: Snapshot) => void;
 onError?: (message: string) => void; onStatus?: (message: string) => void;
 constructor(public url: string) {}
 open(code: string) {
  this.close(); this.code = code; this.token = ''; this.attempts = 0; this.lastInput = 0; this.lastValue = '';
  const error = endpointError(this.url);
  if (error) { this.onError?.(error); return; }
  this.stopped = false; this.deadline = Date.now() + CONNECTION_POLICY.initialMs;
  this.onStatus?.('Connecting… The free multiplayer server may need a moment to wake up.');
  this.dial();
 }
 private clearTimers() { clearTimeout(this.retryTimer); clearTimeout(this.attemptTimer); }
 private finish(message: string) {
  this.stopped = true; this.clearTimers(); const ws = this.ws; this.ws = undefined; ws?.close(); this.onError?.(message);
 }
 private expired() {
  this.finish(this.token ? 'Could not restore your reserved slot within 25 seconds. Return to the lobby to create a new room.' : 'The multiplayer server did not become ready within two minutes. Please try again shortly, or play local co-op.');
 }
 private dial() {
  if (this.stopped) return;
  if (Date.now() >= this.deadline) { this.expired(); return; }
  this.attempts++;
  let ws: WebSocket;
  try { ws = new WebSocket(this.url); } catch { this.finish('The browser could not open the configured multiplayer address. Local co-op is still available.'); return; }
  this.ws = ws;
  const current = () => !this.stopped && this.ws === ws;
  const failed = () => {
   if (!current()) return;
   clearTimeout(this.attemptTimer); this.ws = undefined; ws.close();
   // Only a successful lobby ends a retry sequence, never the TCP handshake.
   if (!this.deadline) { this.deadline = Date.now() + CONNECTION_POLICY.reconnectMs; this.attempts = 0; }
   const remaining = this.deadline - Date.now();
   if (remaining <= 0) { this.expired(); return; }
   this.onStatus?.(this.token ? 'Connection interrupted. Reconnecting to your reserved slot…' : 'Multiplayer server is waking up. Retrying automatically for up to two minutes. You can return to local co-op at any time.');
   const delay = Math.min(this.token ? 1000 : Math.min(1000 * 2 ** Math.min(this.attempts - 1, 3), CONNECTION_POLICY.maxBackoffMs), remaining);
   this.retryTimer = setTimeout(() => this.dial(), delay);
  };
  this.attemptTimer = setTimeout(failed, Math.min(this.token ? CONNECTION_POLICY.reconnectAttemptMs : CONNECTION_POLICY.initialAttemptMs, this.deadline - Date.now()));
  ws.onopen = () => { if (current()) this.send({ type: this.token ? 'reconnect' : this.code ? 'join' : 'create', code: this.code, token: this.token }); };
  ws.onmessage = e => {
   if (!current()) return;
   let m; try { m = JSON.parse(String(e.data)); } catch { return; }
   if (m.type === 'lobby') { clearTimeout(this.attemptTimer); this.deadline = 0; this.attempts = 0; this.code = m.code; this.token = m.token; this.onLobby?.(m); }
   if (m.type === 'start') this.onStart?.(m.slot);
   if (m.type === 'state') this.onState?.(m.state);
   if (m.type === 'error') this.finish(String(m.message));
  };
  // Browsers hide error details. The failed handler owns bounded retries.
  ws.onerror = () => { if (current()) failed(); };
  ws.onclose = failed;
 }
 send(data: unknown) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data)); }
 ready(value: boolean) { this.send({ type: 'ready', value }); }
 input(value: Input) { const now = performance.now(), encoded = JSON.stringify(value); if (now - this.lastInput < 30 && encoded === this.lastValue) return; this.lastInput = now; this.lastValue = encoded; this.send({ type: 'input', value }); }
 close() { this.stopped = true; this.clearTimers(); this.send({ type: 'leave' }); const ws = this.ws; this.ws = undefined; ws?.close(); }
}
