import WebSocket from 'ws';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.NETWORK_SERVER_URL||'ws://127.0.0.1:2569';
const origin=process.env.NETWORK_ORIGIN||'https://127.0.0.1:4444';
const health=new URL('/health',url);health.protocol=health.protocol==='wss:'?'https:':'http:';
const response=await fetch(health);assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
assert.equal((await fetch(health,{method:'HEAD'})).status,200);
async function attempt(value){return new Promise((resolve,reject)=>{
 const socket=new WebSocket(url,value===undefined?{}:{origin:value});
 const timer=setTimeout(()=>{socket.terminate();reject(Error('Handshake timed out'));},8000);
 socket.on('open',()=>{clearTimeout(timer);socket.close();resolve(101);});
 socket.on('unexpected-response',(_req,res)=>{clearTimeout(timer);res.resume();socket.terminate();resolve(res.statusCode);});
 socket.on('error',e=>{clearTimeout(timer);if(!String(e).includes('closed before'))reject(e);});
});}
const results=[];
for(const value of [origin,undefined,'null','https://not-your-game.example',origin+'.evil.test']){
 // ws uses HTTP 401 for a false synchronous verifyClient result.
 const status=await attempt(value);assert.equal(status,value===origin?101:401);results.push({origin:value??'(absent)',status});
}
const output=process.env.CAPTURE_DIR||'artifacts/deployment';await mkdir(output,{recursive:true});
await writeFile(`${output}/server-security-evidence.json`,JSON.stringify({verifiedAt:new Date().toISOString(),backend:url,health:200,head:200,originChecks:results},null,2)+'\n');
console.log('PASS /health GET/HEAD and exact-origin WebSocket upgrade; absent, null and unauthorized origins rejected with 401');
