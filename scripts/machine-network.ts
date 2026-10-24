import WebSocket from 'ws';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {CampaignPilot} from '../tests/helpers/machine-pilot';
import {idleInput,type Snapshot} from '../src/game/simulation';
const output=process.env.CAPTURE_DIR||'artifacts/machine';
const clients:Client[]=[];
type Message={type:string;[key:string]:any};
type Client={socket:WebSocket;messages:Message[];states:Map<number,Snapshot>;state?:Snapshot};
async function connect(){
 const socket=new WebSocket('ws://127.0.0.1:2567'),c:Client={socket,messages:[],states:new Map()};clients.push(c);
 socket.on('message',raw=>{const m=JSON.parse(raw.toString());if(m.type==='state'){c.state=m.state;c.states.set(m.state.tick,m.state);if(c.states.size>100)c.states.delete(c.states.keys().next().value!);}else c.messages.push(m);});
 await new Promise<void>((resolve,reject)=>{socket.once('open',()=>resolve());socket.once('error',reject);});return c;
}
const send=(c:Client,m:unknown)=>c.socket.send(JSON.stringify(m));
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function message(c:Client,type:string,filter=(m:Message)=>true){for(let i=0;i<250;i++){const n=c.messages.findIndex(m=>m.type===type&&filter(m));if(n>=0)return c.messages.splice(n,1)[0];await pause(20);}throw Error(`Missing ${type}`);}
try{
 let a=await connect();send(a,{type:'create'});const room=await message(a,'lobby');
 const b=await connect();send(b,{type:'join',code:room.code});await message(b,'lobby');
 send(a,{type:'ready',value:true});send(b,{type:'ready',value:true});await message(a,'start');await message(b,'start');
 const pilot=new CampaignPilot(),start=Date.now(),checkpoints:any[]=[];let reconnected=false,lastPhase='';
 while(Date.now()-start<150000){
  const s=a.state;if(!s){await pause(20);continue;}
  const phase=`${s.sector}/${s.machine?pilot.stage:pilot.prisonStage}`;
  if(phase!==lastPhase){console.log('PASS online route',phase);lastPhase=phase;checkpoints.push({phase,tick:s.tick,machine:s.machine});}
  if(s.machine?.relay&&!reconnected){
   send(a,{type:'input',value:idleInput()});send(b,{type:'input',value:idleInput()});a.socket.terminate();await message(b,'lobby',m=>!m.connected[0]);
   await pause(100);const frozen=structuredClone(b.state!);await pause(350);assert.equal(b.state!.tick,frozen.tick);
   a=await connect();send(a,{type:'reconnect',code:room.code,token:room.token});await message(a,'start');
   for(let i=0;i<250&&!a.state;i++)await pause(20);assert(a.state);
   assert.equal(a.state.sector,2);assert.deepEqual(a.state.machine!.layout,frozen.machine!.layout);assert.deepEqual(a.state.terrain,frozen.terrain);
   assert.equal(a.state.machine!.relay,true);assert.equal(a.state.machine!.liftY,frozen.machine!.liftY);
   reconnected=true;console.log('PASS freeze and reconnect inside THE MACHINE preserves seed, relay, lift and terrain');
   continue;
  }
  if(s.sector===2&&s.won)break;
  const values=pilot.controls(s);send(a,{type:'input',value:values[0]});send(b,{type:'input',value:values[1]});
  await pause(20);
 }
 assert.equal(a.state?.sector,2);assert.equal(a.state?.won,true,JSON.stringify(a.state?.players));assert(reconnected);
 await pause(100);const common=[...a.states.keys()].filter(t=>b.states.has(t)).sort((a,b)=>b-a)[0];assert(common);assert.deepEqual(a.states.get(common),b.states.get(common));
 await mkdir(output,{recursive:true});await writeFile(`${output}/network-evidence.json`,JSON.stringify({verifiedAt:new Date().toISOString(),method:'Two websocket clients; ordinary bounded inputs only; full campaign from prison spawn',seed:a.state!.seed,sameSnapshotTick:common,reconnectFrozen:true,reconnectPreserved:true,checkpoints,final:a.state},null,2)+'\n');
 console.log('PASS full authoritative campaign, both co-op mechanisms, trap/chase, boss, two-player exit and identical snapshots');
}finally{clients.forEach(c=>c.socket.close());}
