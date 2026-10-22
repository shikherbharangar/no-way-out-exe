/** Authored sockets + seeded variants. Gameplay geometry is shared by browser and host. */
import type { Input, Simulation, Bolt } from './simulation';
export const MACHINE_ROWS = 40, MACHINE_HEIGHT = 640;
export type Surface = { x: number; y: number; w: number; tile: number };
export type RoomTemplate = {
 id: string; slot: number; entry: [number, number]; exit: [number, number];
 requires: string[]; grants: string[]; surfaces: Surface[];
};
const floor = (x: number, y: number, w: number, tile = 6): Surface => ({x,y,w,tile});
export const ROOM_TEMPLATES: RoomTemplate[][] = [
 [{id:'counterweight',slot:0,entry:[32,560],exit:[256,368],requires:['zip','brick'],grants:['lift'],surfaces:[floor(0,560,256),floor(64,464,64,7),floor(96,416,48,7),floor(16,368,128,7)]}],
 [
  {id:'split-dynamo',slot:1,entry:[256,368],exit:[576,368],requires:['lift','zip','brick'],grants:['relay'],surfaces:[floor(256,368,256),floor(400,320,80,7),floor(288,272,64,7)]},
  {id:'hanging-dynamo',slot:1,entry:[256,368],exit:[576,368],requires:['lift','zip','brick'],grants:['relay'],surfaces:[floor(256,368,256),floor(384,320,64,7),floor(448,272,48,7)]},
 ],
 [
  {id:'shear-line',slot:2,entry:[576,368],exit:[896,432],requires:['relay'],grants:['chase'],surfaces:[floor(576,368,48),floor(624,432,48),floor(672,432,64,7),floor(704,384,48,7),floor(800,432,96),floor(848,512,16),floor(864,464,16)]},
  {id:'broken-foundry',slot:2,entry:[576,368],exit:[896,432],requires:['relay'],grants:['chase'],surfaces:[floor(576,368,48),floor(624,432,48),floor(672,432,48,7),floor(672,384,48,7),floor(800,432,96),floor(848,512,16),floor(864,464,16)]},
 ],
 [{id:'magnetic-heart',slot:3,entry:[896,432],exit:[1248,432],requires:['chase','zip','brick'],grants:['escape'],surfaces:[floor(896,432,384),floor(912,368,48,7),floor(1120,336,64,7)]}],
];
export type Layout = { seed: number; rooms: string[]; surfaces: Surface[]; crusherX: number };
export function generateMachine(seed: number): Layout {
 let state=seed>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
 const rooms=ROOM_TEMPLATES.map(choices=>choices[(random()>>>16)%choices.length]);
 const layout={seed:seed>>>0,rooms:rooms.map(r=>r.id),surfaces:rooms.flatMap(r=>r.surfaces),crusherX:rooms[2].id==='shear-line'?682:658};
 validateLayout(layout);return layout;
}
export function validateLayout(layout: Layout) {
 const abilities=new Set(['zip','brick']);let previous:RoomTemplate|undefined;
 for(let slot=0;slot<4;slot++){
  const room=ROOM_TEMPLATES[slot].find(r=>r.id===layout.rooms[slot]);
  if(!room||room.slot!==slot)throw Error('Invalid machine room slot');
  if(room.requires.some(key=>!abilities.has(key)))throw Error('Unreachable ability requirement');
  if(previous&&(room.entry[0]!==previous.exit[0]||room.entry[1]!==previous.exit[1]))throw Error('Disconnected room socket');
  room.grants.forEach(key=>abilities.add(key));previous=room;
 }
 if(!abilities.has('escape'))throw Error('Missing co-op exit');
 if(layout.surfaces.some(s=>s.x%16||s.y%16||s.w%16||s.x<0||s.x+s.w>1280||s.y>=640))throw Error('Invalid room surface');
}
export function machineTerrain(layout:Layout) {
 const terrain=new Array(80*MACHINE_ROWS).fill(-1);
 // Recovery floor remains intact under every destructible route.
 for(let y=35;y<40;y++)for(let x=0;x<80;x++)terrain[y*80+x]=y===35||y===39?11:3+(x+y)%3;
 for(const s of layout.surfaces)for(let x=s.x/16;x<(s.x+s.w)/16;x++)terrain[s.y/16*80+x]=s.tile;
 // Breakable service-wall shortcut to the upper maintenance shelf.
 for(let y=19;y<23;y++)terrain[y*80+23]=8;
 return terrain;
}
export type MachineState = {
 layout:Layout; liftY:number; liftSolved:boolean; liftRecall:boolean; relay:boolean; relayCharge:number;
 trap:number; chaseX:number; chaseDone:boolean; checkpoint:number;
 bossHp:number; bossPhase:'sleep'|'windup'|'slam'|'caught'|'dead'; bossTimer:number; bossHit:number;
 platformX:number; age:number; dialogue:number; rescue:number;
};
export function newMachine(seed:number):MachineState{return {layout:generateMachine(seed),liftY:560,liftSolved:false,liftRecall:false,relay:false,relayCharge:0,trap:-1,chaseX:550,chaseDone:false,checkpoint:0,bossHp:6,bossPhase:'sleep',bossTimer:0,bossHit:0,platformX:736,age:0,dialogue:0,rescue:0};}
export function machineSolid(s:Simulation,x:number,y:number) {
 const m=s.machine!;
 if(x>=176&&x<256&&y>=m.liftY&&y<m.liftY+8)return true;
 if(m.relay&&x>=512&&x<576&&y>=368&&y<376)return true;
 if(!m.relay&&x>=500&&x<512&&y>=0&&y<560)return true;
 if(x>=m.platformX&&x<m.platformX+48&&y>=416&&y<424)return true;
 if(m.bossHp>0&&x>=1152&&x<1168&&y>=0&&y<560)return true;
 return false;
}
export function machineBolt(s:Simulation,b:Bolt) {
 const m=s.machine!;if(b.owner!==0)return false;
 const brick=s.players[1];
 if(!m.relay&&Math.abs(b.x-464)<12&&Math.abs(b.y-352)<18){
  b.life=0;s.emit('spark',464,352);
  if(!brick.ghost&&brick.shield>0&&brick.grounded&&Math.abs(brick.x-326)<24&&Math.abs(brick.y-368)<6){
   m.relayCharge++;s.emit('arc',464,352);
   if(m.relayCharge>=2){m.relay=true;m.checkpoint=1;s.emit('gate',512,352);m.dialogue=2;}
  }
  return true;
 }
 if(m.bossHp>0&&Math.abs(b.x-1092)<17&&Math.abs(b.y-416)<20){
  b.life=0;s.emit('spark',1092,416);
  if(m.bossPhase==='caught'&&m.bossHit<=0){
   m.bossHp--;m.bossHit=.45;s.emit('arc',1092,412,2);
   if(m.bossHp===0){m.bossPhase='dead';m.dialogue=5;s.explode(1092,400,85,'steel');s.explode(1130,365,58,'fuel');s.emit('gate',1160,400);}
  }
  return true;
 }
 return false;
}
/** Runs before character movement so riders inherit platform displacement exactly once. */
export function stepMachinery(s:Simulation,inputs:Input[],dt:number){
 const m=s.machine!;m.age+=dt;m.bossHit=Math.max(0,m.bossHit-dt);
 const [zip,brick]=s.players;
 // Both partners can recall a stranded hologram to the last safe checkpoint.
 m.rescue=s.players.some(p=>p.ghost)&&inputs.length===2&&inputs.every(i=>i.interact)?m.rescue+dt:0;
 if(m.rescue>=3){s.respawn();return;}
 const riding=(p:typeof zip)=>!p.ghost&&p.x>177&&p.x<255&&Math.abs(p.y-m.liftY)<3;
 const liftReady=riding(zip)&&riding(brick)&&zip.x>216&&brick.x<216&&inputs[0]?.interact&&inputs[1]?.interact;
 const old=m.liftY;
 if(liftReady&&m.liftY>368){m.liftRecall=false;m.liftY=Math.max(368,m.liftY-64*dt);}
 // Call the cage from below. This remains possible after arbitrary terrain destruction.
 else {
  if(s.players.some((p,i)=>!p.ghost&&p.y>m.liftY+30&&Math.abs(p.x-216)<60&&inputs[i]?.interact))m.liftRecall=true;
  if(m.liftRecall){m.liftY=Math.min(560,m.liftY+80*dt);if(m.liftY===560)m.liftRecall=false;}
 }
 if(old!==m.liftY)for(const p of s.players)if(p.x>177&&p.x<255&&Math.abs(p.y-old)<3){p.y=m.liftY;p.vy=0;p.grounded=true;}
 if(m.liftY===368&&!m.liftSolved){m.liftSolved=true;m.dialogue=1;s.emit('checkpoint',216,340);}
 const px=m.platformX;m.platformX=744+Math.sin(m.age*1.2)*24;
 for(const p of s.players)if(!p.ghost&&p.x>=px&&p.x<=px+48&&Math.abs(p.y-416)<3)p.x+=m.platformX-px;
 // Emergency ladders are independent of destructible tiles. Hold interact to climb.
 for(const p of s.players)if(!p.ghost&&inputs[p.id]?.interact){
  const ladder=[{x:488,top:368},{x:872,top:432}].find(l=>Math.abs(p.x-l.x)<12&&p.y>l.top+1&&p.y<=561);
  if(ladder){p.x=ladder.x;p.y=Math.max(ladder.top,p.y-100*dt);p.vy=-30;p.hurt=Math.max(p.hurt,.08);}
 }
 if(m.relay&&s.players.every(p=>!p.ghost&&p.x>576)&&m.checkpoint<2){m.checkpoint=2;s.emit('checkpoint',600,340);}
 if(m.trap<0&&m.relay&&s.players.some(p=>!p.ghost&&p.x>638)){m.trap=0;m.dialogue=3;s.emit('spark',m.layout.crusherX,344);}
 if(m.trap>=0&&!m.chaseDone){
  m.trap+=dt;
  if(m.trap>1.5){
   m.chaseX=Math.min(900,m.chaseX+60*dt);
   if(Math.floor((m.trap-dt)*3)!==Math.floor(m.trap*3)){s.destroy(m.chaseX,384,25);s.emit('blast',m.chaseX,400,.55);}
   for(const p of s.players)if(!p.ghost&&p.x<m.chaseX+14){p.shield=0;s.damage(p);}
  }
  if(s.players.every(p=>!p.ghost&&p.x>912)){m.chaseDone=true;m.checkpoint=3;m.dialogue=4;s.emit('checkpoint',940,410);s.players.forEach(p=>{p.hp=3;});}
 }
 const crusher=crusherBottom(m);
 if(m.trap>1.5&&crusher>407)for(const p of s.players)if(!p.ghost&&Math.abs(p.x-m.layout.crusherX)<22&&p.y>384&&p.y-25<crusher){p.shield=0;s.damage(p);}
 if(m.chaseDone&&m.bossPhase==='sleep'){m.bossPhase='windup';m.bossTimer=2.2;}
 const braced=!brick.ghost&&brick.grounded&&Math.abs(brick.x-984)<23&&Math.abs(brick.y-432)<6&&inputs[1]?.interact&&brick.facing===1;
 if(m.bossPhase==='caught'&&!braced){m.bossPhase='windup';m.bossTimer=1.2;}
 if(m.bossPhase!=='sleep'&&m.bossPhase!=='dead'){
  m.bossTimer-=dt;
  if(m.bossTimer<=0){
   if(m.bossPhase==='windup'){
    if(braced){m.bossPhase='caught';m.bossTimer=2.5;s.emit('charge',984,410);}
    else {m.bossPhase='slam';m.bossTimer=.6;s.explode(1010,422,45,'steel',-1);for(const p of s.players)if(p.x>944&&p.x<1100&&p.y>390){p.shield=0;s.damage(p);}}
   }else {m.bossPhase='windup';m.bossTimer=2.2;}
  }
 }
}
export function crusherBottom(m:MachineState){if(m.trap<1.5)return 344;const phase=(m.trap-1.5)%3.4;return phase<1.4?344:phase<1.65?344+(phase-1.4)*352:phase<2.1?432:432-Math.min(88,(phase-2.1)*88);}
