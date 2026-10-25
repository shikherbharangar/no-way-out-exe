import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomClient, endpointError } from '../src/net/client';

class Socket {
 static OPEN = 1; static instances: Socket[] = [];
 readyState = 0; sent: any[] = []; onopen?: () => void; onmessage?: (e: {data:string}) => void; onerror?: () => void; onclose?: () => void;
 constructor(public url: string) { Socket.instances.push(this); }
 send(data: string) { this.sent.push(JSON.parse(data)); }
 open() { this.readyState = 1; this.onopen?.(); }
 message(data: unknown) { this.onmessage?.({data:JSON.stringify(data)}); }
 close() { this.readyState = 3; this.onclose?.(); }
}
let clients: RoomClient[];
const newest = () => Socket.instances.at(-1)!;
const make = () => { const c = new RoomClient('wss://backend.example'); clients.push(c); return c; };
beforeEach(() => { vi.useFakeTimers(); Socket.instances = []; clients = []; vi.stubGlobal('WebSocket', Socket); });
afterEach(() => { clients.forEach(c=>c.close()); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('free-service connection lifecycle', () => {
 it('retries a cold initial service and retains the intended join code', () => {
  const c=make(),status=vi.fn(),error=vi.fn();c.onStatus=status;c.onError=error;c.open('ABCDEF');
  newest().onerror?.();expect(status).toHaveBeenLastCalledWith(expect.stringContaining('waking up'));
  vi.advanceTimersByTime(1000);newest().open();
  expect(newest().sent[0]).toMatchObject({type:'join',code:'ABCDEF'});
  newest().message({type:'lobby',code:'ABCDEF',token:'private-token'});
  vi.advanceTimersByTime(180000);expect(Socket.instances).toHaveLength(2);expect(error).not.toHaveBeenCalled();
 });
 it('bounds stalled initial handshakes to two minutes', () => {
  const c=make(),error=vi.fn();c.onError=error;c.open('');vi.advanceTimersByTime(120001);
  expect(error).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('two minutes'));
  const count=Socket.instances.length;vi.advanceTimersByTime(180000);expect(Socket.instances).toHaveLength(count);
 });
 it('does not reset the reconnect budget when sockets open but no lobby arrives', () => {
  const c=make(),error=vi.fn();c.onError=error;c.open('');newest().open();newest().message({type:'lobby',code:'ABCDEF',token:'private-token'});newest().close();
  for(let i=0;i<26;i++){vi.advanceTimersByTime(1000);if(newest().readyState===0)newest().open();}
  expect(error).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('25 seconds'));
  expect(Socket.instances.slice(1).some(s=>s.sent.some(m=>m.type==='reconnect'&&m.token==='private-token'))).toBe(true);
 });
 it('cancels retries immediately when leaving for local play', () => {
  const c=make();c.open('');newest().close();c.close();vi.advanceTimersByTime(180000);expect(Socket.instances).toHaveLength(1);
 });
 it('stops on a server rejection and ignores old socket messages', () => {
  const c=make(),error=vi.fn(),lobby=vi.fn();c.onError=error;c.onLobby=lobby;c.open('BADBAD');const old=newest();old.open();old.message({type:'error',message:'Room not found. Check the code.'});
  old.message({type:'lobby',code:'BADBAD',token:'stale'});vi.advanceTimersByTime(180000);
  expect(error).toHaveBeenCalledExactlyOnceWith('Room not found. Check the code.');expect(lobby).not.toHaveBeenCalled();expect(Socket.instances).toHaveLength(1);
 });
 it('rejects insecure HTTPS-page endpoints without opening a socket', () => {
  expect(endpointError('ws://host.example','https:')).toContain('wss://');
  expect(endpointError('wss://host.example','https:')).toBeUndefined();
  expect(endpointError('https://host.example','https:')).toContain('ws://');
  expect(endpointError('wss://user:secret@host.example','https:')).toContain('credentials');
  expect(endpointError('ws://127.0.0.1:2567','http:')).toBeUndefined();
 });
});
