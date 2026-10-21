import WebSocket from 'ws';
import assert from 'node:assert/strict';
const sockets=[];
async function connect(){const s=new WebSocket('ws://127.0.0.1:2567');s.messages=[];s.on('message',m=>s.messages.push(JSON.parse(m)));await new Promise((res,rej)=>{s.on('open',res);s.on('error',rej)});sockets.push(s);return s;}
function send(s,m){s.send(JSON.stringify(m));}
async function next(s,type,filter=()=>true){const start=Date.now();while(Date.now()-start<5000){const i=s.messages.findIndex(m=>m.type===type&&filter(m));if(i>=0)return s.messages.splice(i,1)[0];await new Promise(r=>setTimeout(r,20));}throw new Error(`Timeout for ${type}`);}
try{
 const a=await connect();send(a,{type:'create'});const room=await next(a,'lobby');assert.match(room.code,/^[A-Z]{6}$/);
 const b=await connect();send(b,{type:'join',code:room.code});const br=await next(b,'lobby');assert.equal(br.slot,1);
 const c=await connect();send(c,{type:'join',code:room.code});assert.match((await next(c,'error')).message,/two prisoners/);
 send(a,{type:'ready',value:true});send(b,{type:'ready',value:true});await next(a,'start');await next(b,'start');
 send(a,{type:'input',value:{right:true}});const moved=await next(b,'state',m=>m.state.players[0].x>95);assert.equal(moved.state.players.length,2);
 a.terminate();await next(b,'lobby',m=>!m.connected[0]);
 const re=await connect();send(re,{type:'reconnect',code:room.code,token:room.token});assert.equal((await next(re,'lobby')).slot,0);await next(re,'start');
 const duplicate=await connect();send(duplicate,{type:'reconnect',code:room.code,token:room.token});assert.match((await next(duplicate,'error')).message,/already connected/);
 const recovered=await next(re,'state');assert.ok(recovered.state.tick>moved.state.tick);assert.ok(recovered.state.players[0].x>=moved.state.players[0].x);
 send(re,{type:'input',value:{right:false,x:10000,hp:999}});const tampered=await next(re,'state');assert.ok(tampered.state.players[0].x<300);assert.ok(tampered.state.players[0].hp<=3);
 console.log('PASS room capacity, two ready slots, authoritative movement, disconnect freeze, token reconnect, duplicate rejection, state tamper rejection');
}finally{sockets.forEach(s=>s.close());}
