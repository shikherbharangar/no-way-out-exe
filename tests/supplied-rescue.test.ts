import {describe,it,expect} from 'vitest';
import {Simulation, idleInput, RESCUE_CAGE} from '../src/game/simulation';
import {heroPose} from '../src/game/supplied-art';
const hold=()=>({...idleInput(),interact:true});
function staged(){const s=new Simulation();s.gate=true;s.guards=[];s.barrels=[];s.players.forEach((p,i)=>{p.x=RESCUE_CAGE.x-10+i*20;p.y=288;p.hp=1;});return s;}
describe('optional supplied cage integration',()=>{
 it('requires gate, proximity, living participant and a continuous hold; rewards once',()=>{
  const s=staged();s.gate=false;for(let i=0;i<60;i++)s.step([hold(),idleInput()]);expect(s.rescued).toBe(false);
  s.gate=true;s.players[0].x=520;for(let i=0;i<60;i++)s.step([hold(),idleInput()]);expect(s.rescueProgress).toBe(0);
  s.players[0].x=640;for(let i=0;i<20;i++)s.step([hold(),idleInput()]);expect(s.rescueProgress).toBeGreaterThan(0);
  s.step([idleInput(),idleInput()]);expect(s.rescueProgress).toBe(0);
  for(let i=0;i<50;i++)s.step([hold(),idleInput()]);expect(s.rescued).toBe(true);expect(s.players.map(p=>p.hp)).toEqual([2,2]);
  for(let i=0;i<100;i++)s.step([hold(),hold()]);expect(s.players.map(p=>p.hp)).toEqual([2,2]);expect(s.events.filter(e=>e.type==='rescue')).toHaveLength(1);
 });
 it('continues from snapshots, survives checkpoint respawn and never revives ghosts as a side effect',()=>{
  const a=staged();a.players[1].ghost=true;a.players[1].x=100;for(let i=0;i<15;i++)a.step([hold(),idleInput()]);
  const b=new Simulation();b.apply(JSON.parse(JSON.stringify(a.snapshot())));
  for(let i=0;i<35;i++){a.step([hold(),idleInput()]);b.step([hold(),idleInput()]);expect(b.snapshot()).toEqual(a.snapshot());}
  expect(a.rescued).toBe(true);expect(a.players[1].ghost).toBe(true);
  a.checkpoint=true;a.respawn();expect(a.rescued).toBe(true);expect(a.rescueProgress).toBe(1);
  const old={...a.snapshot()};delete old.rescued;delete old.rescueProgress;b.apply(old);expect(b.rescued).toBe(false);expect(b.rescueProgress).toBe(0);
 });
 it('selects supplied poses and explicitly reuses keys for missing animation phases',()=>{
  const s=new Simulation(),z=s.players[0],b=s.players[1];expect(heroPose(z,s)).toBe('idle');z.vx=80;expect(heroPose(z,s)).toBe('run');
  z.grounded=false;z.vx=400;expect(heroPose(z,s)).toBe('dash');b.action=.2;b.windup=.1;expect(heroPose(b,s)).toBe('charge');b.windup=0;expect(heroPose(b,s)).toBe('punch');
  z.reviving=.1;expect(heroPose(z,s)).toBe('hack');b.ghost=true;expect(heroPose(b,s)).toBe('death');
 });
});
