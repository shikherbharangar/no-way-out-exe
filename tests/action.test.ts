import {it,expect} from 'vitest';
import {Simulation,idleInput,COLS,type Input} from '../src/game/simulation';
const input=(p:Partial<Input>={})=>({...idleInput(),...p});
function advance(s:Simulation,n:number,a:Partial<Input>={},b:Partial<Input>={}){for(let i=0;i<n;i++)s.step([input(a),input(b)]);}
it('telegraphs a punch before it damages terrain',()=>{
 const s=new Simulation();s.players[1].x=210;
 const tiles=s.terrain.slice();advance(s,1,{}, {special:true});
 expect(s.players[1].windup).toBeGreaterThan(0);expect(s.terrain).toEqual(tiles);
 advance(s,10);expect(s.terrain).not.toEqual(tiles);expect(s.events.some(e=>e.type==='blast')).toBe(true);
});
it('charges the braced partner through a real ZIP projectile, then consumes charge on impact',()=>{
 const s=new Simulation();s.players[0].x=120;s.players[1].x=165;
 advance(s,1,{special:true},{interact:true});advance(s,12,{}, {interact:true});
 expect(s.players[1].charge).toBeGreaterThan(2);expect(s.events.some(e=>e.type==='charge')).toBe(true);
 advance(s,1,{}, {special:true});advance(s,10);
 expect(s.players[1].charge).toBe(0);expect(s.events.some(e=>e.type==='blast'&&e.material==='steel'&&e.power!>1.3)).toBe(true);
});
it('reflects an incoming guard shot only when shield faces it',()=>{
 const s=new Simulation();s.players[1].x=150;
 s.bolts.push({x:179,y:272,vx:-190,owner:2,life:2});advance(s,6,{}, {interact:true});
 expect(s.events.some(e=>e.type==='deflect')).toBe(true);expect(s.bolts.some(b=>b.owner===0&&b.charged&&b.vx>0)).toBe(true);expect(s.players[1].hp).toBe(3);
});
it('staggers the four-barrel chain and removes a combat platform',()=>{
 const s=new Simulation();s.explode(754,272,39);expect(s.barrels[1].alive).toBe(true);
 const counts:number[]=[];for(let i=0;i<90;i++){advance(s,1);counts.push(s.barrels.filter(b=>!b.alive).length);}
 expect(new Set(counts).size).toBeGreaterThan(3);
 expect(s.barrels.slice(1,5).every(b=>!b.alive)).toBe(true);
 expect(s.terrain[17*COLS+53]).toBe(-1);
});
it('a guard falls when its platform is removed and physical recoil moves a defeated guard',()=>{
 const s=new Simulation(),g=s.guards[1];
 s.destroy(g.x,g.y+8,24);advance(s,10);expect(g.y).toBeGreaterThan(230);
 const x=g.x;s.hitGuard(g,2,1,240);advance(s,10);expect(g.x).toBeGreaterThan(x+10);expect(g.hp).toBe(0);
});
it('guards aim visibly before shooting, respect occlusion, and take arc damage',()=>{
 const s=new Simulation(),g=s.guards[0];s.gate=true;s.players[0].x=660;s.players[1].x=650;g.cooldown=0;
 advance(s,12);expect(g.aim).toBeGreaterThan(.15);expect(s.bolts.some(b=>b.owner===2)).toBe(false);
 advance(s,18);expect(s.events.some(e=>e.type==='shot')).toBe(true);
 s.bolts.push({x:g.x-16,y:g.y-16,vx:350,owner:0,life:1});advance(s,2);expect(g.hp).toBe(1);expect(g.stun).toBeGreaterThan(0);
 const blocked=new Simulation();blocked.guards[0].x=640;blocked.guards[0].cooldown=0;blocked.players[0].x=580;advance(blocked,90);expect(blocked.events.some(e=>e.type==='shot')).toBe(false);
});
it('a snapshot carries charge, aim, fuse, recoil, and projectile authority to another simulation',()=>{
 const a=new Simulation();a.players[1].charge=2;a.players[1].windup=.1;a.guards[0].aim=.2;a.guards[0].vx=110;a.barrels[2].fuse=.12;
 const b=new Simulation();b.apply(structuredClone(a.snapshot()));b.eventId=a.eventId;
 advance(a,90);advance(b,90);expect(b.snapshot()).toEqual(a.snapshot());
});
