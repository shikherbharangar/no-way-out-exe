import WebSocket from 'ws';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output=process.env.CAPTURE_DIR||'artifacts/premium';
const clients=[];
async function connect(){
 const socket=new WebSocket('ws://127.0.0.1:2567'),client={socket,messages:[],states:new Map(),state:null};
 socket.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='state'){client.state=m.state;client.states.set(m.state.tick,m.state);if(client.states.size>100)client.states.delete(client.states.keys().next().value);}else client.messages.push(m);});
 clients.push(client);await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});return client;
}
const send=(c,m)=>c.socket.send(JSON.stringify(m));
const neutral=()=>({left:false,right:false,jump:false,special:false,interact:false});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function message(c,type,filter=()=>true){for(let i=0;i<200;i++){const n=c.messages.findIndex(m=>m.type===type&&filter(m));if(n>=0)return c.messages.splice(n,1)[0];await pause(25);}throw Error(`Timeout: ${type}`);}
try{
 let a=await connect();send(a,{type:'create'});const room=await message(a,'lobby');
 const b=await connect();send(b,{type:'join',code:room.code});await message(b,'lobby');
 send(a,{type:'ready',value:true});send(b,{type:'ready',value:true});await message(a,'start');await message(b,'start');
 async function until(label,done,inputs=()=>[neutral(),neutral()],timeout=35000,release=true){
  const start=Date.now();while(Date.now()-start<timeout){
   const s=a.state;if(s&&done(s)){if(release){send(a,{type:'input',value:neutral()});send(b,{type:'input',value:neutral()});}console.log('PASS',label);return s;}
   if(s){const values=inputs(s);send(a,{type:'input',value:values[0]});send(b,{type:'input',value:values[1]});}
   await pause(40);
  }
  throw Error(`Timeout ${label}: ${JSON.stringify(a.state?.players)}`);
 }
 function solid(s,x,y){return x<0||x>=1280||(!s.gate&&x>=608&&x<624&&y>160&&y<288)||(s.terrain[Math.floor(y/16)*80+Math.floor(x/16)]??-1)>=0;}
 function approach(s,id,target){const p=s.players[id],dir=Math.sign(target-p.x),gap=Math.abs(target-p.x),t=s.tick;return {...neutral(),left:gap>3&&dir<0,right:gap>3&&dir>0,jump:t%48<30&&(solid(s,p.x+dir*12,p.y-8)||p.y>290||(p.x>390&&p.x<475)),special:id===1&&p.x>195&&p.x<300&&t%42<6,interact:id===1&&target>624};}
 const at=(s,id,x,y)=>Math.abs(s.players[id].x-x)<6&&Math.abs(s.players[id].y-y)<5&&s.players[id].grounded;
 await until('BRICK breaches and reaches plate',s=>at(s,1,369,288),s=>[neutral(),approach(s,1,369)]);
 await until('ZIP reaches terminal',s=>at(s,0,487,224),s=>[approach(s,0,487),neutral()]);
 await until('authoritative co-op gate opens',s=>s.gate,()=>[{...neutral(),interact:true},neutral()]);
 await until('both prisoners enter action encounter',s=>at(s,0,597,288)&&at(s,1,638,288),s=>[approach(s,0,597),approach(s,1,638)]);
 await until('authoritative cage hold begins',s=>s.rescueProgress>.2&&s.rescueProgress<1,()=>[neutral(),{...neutral(),interact:true}],35000,false);
 a.socket.terminate();await message(b,'lobby',m=>!m.connected[0]);await pause(100);const frozenRescue=b.state.rescueProgress,frozenRescueTick=b.state.tick;assert(frozenRescue>0&&frozenRescue<1);await pause(300);assert.equal(b.state.tick,frozenRescueTick);assert.equal(b.state.rescueProgress,frozenRescue);
 a=await connect();send(a,{type:'reconnect',code:room.code,token:room.token});await message(a,'lobby');await message(a,'start');
 await until('cage rescue resumes after reconnect',s=>s.rescued,()=>[neutral(),{...neutral(),interact:true}]);
 await until('ZIP projectile charges BRICK over websocket',s=>s.players[1].charge>2,s=>[{...neutral(),right:true,special:s.tick%40<6},{...neutral(),interact:true}]);
 await until('charged BRICK closes distance',s=>at(s,1,690,288),s=>[neutral(),approach(s,1,690)]);
 const attackStart=a.state.tick;
 await until('charged punch detonates on host',s=>s.tick>attackStart&&s.events.some(e=>e.type==='blast'&&e.material==='steel'),()=>[neutral(),{...neutral(),special:true,interact:true}]);
 const final=await until('host resolves chain reaction and enemy defeat',s=>s.barrels.slice(1,5).every(b=>!b.alive)&&s.guards.some(g=>g.hp===0));
 await pause(120);
 const common=[...a.states.keys()].filter(t=>b.states.has(t)).sort((x,y)=>y-x)[0];assert(common);
 assert.deepEqual(a.states.get(common),b.states.get(common));
 const before=a.state; a.socket.terminate();await message(b,'lobby',m=>!m.connected[0]);
 const frozenTick=b.state.tick;await pause(300);assert.equal(b.state.tick,frozenTick);
 const re=await connect();send(re,{type:'reconnect',code:room.code,token:room.token});await message(re,'lobby');await message(re,'start');
 for(let i=0;i<250&&!re.state;i++)await pause(20);assert(re.state,'Reconnect snapshot missing');
 assert.deepEqual(re.state.terrain,before.terrain);assert.deepEqual(re.state.barrels,before.barrels);
 assert.equal(re.state.gate,true);assert.equal(re.state.rescued,true);assert.equal(re.state.rescueProgress,1);assert(re.state.players.every(p=>!p.ghost));
 const evidence={verifiedAt:new Date().toISOString(),method:'Two websocket clients; only input messages; no game-state writes',sameSnapshotTick:common,reconnectPreservedTerrain:true,reconnectPreservedRescue:true,midRescueDisconnectFrozen:true,frozenRescueProgress:frozenRescue,rescued:final.rescued,gate:final.gate,barrelsDestroyed:final.barrels.filter(b=>!b.alive).length,guardsDefeated:final.guards.filter(g=>g.hp===0).length,events:final.events};
 await mkdir(output,{recursive:true});await writeFile(`${output}/network-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
 console.log('PASS identical combat snapshots and reconnect preserves destroyed terrain, barrels and gate');
}finally{clients.forEach(c=>c.socket.close());}
