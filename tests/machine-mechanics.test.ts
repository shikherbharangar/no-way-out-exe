import {describe,it,expect} from 'vitest';
import {Simulation,idleInput} from '../src/game/simulation';
import {generateMachine,machineTerrain} from '../src/game/machine';
import {MachinePilot,CampaignPilot} from './helpers/machine-pilot';
const hold=()=>({...idleInput(),interact:true});
const run=(s:Simulation,n:number,inputs=[idleInput(),idleInput()])=>{for(let t=0;t<n;t++)s.step(inputs);};
const machine=()=>{const s=new Simulation();s.enterMachine();return s;};
describe('authoritative machinery rules and recovery',()=>{
 it('the normal-input campaign pilot wall-jumps back after missing the terminal platform',()=>{
  const s=new Simulation();s.players[0].x=487;s.players[1].x=369;
  const pilot=new CampaignPilot();let roundedOverhang=false;
  for(let t=0;t<900&&!s.gate;t++){
   s.step(pilot.controls(s.snapshot()));roundedOverhang ||= s.players[0].x>540;
  }
  expect(roundedOverhang).toBe(true);expect(s.gate).toBe(true);
 });
 it('the normal-input test pilot can reboard a partially raised cage after an online overshoot',()=>{
  for(const [height,x] of [[545,263],[558.9,263],[559.9,263],[476,316]]){
  const s=machine();s.machine!.liftY=height;
  Object.assign(s.players[0],{x,y:560,grounded:true});
  Object.assign(s.players[1],{x:200,y:height,grounded:true});
  const pilot=new MachinePilot();let jumped=false;
  for(let t=0;t<900&&!s.machine!.liftSolved;t++){
   const inputs=pilot.controls(s.snapshot());jumped ||= inputs[0].jump;s.step(inputs);
  }
  expect(jumped).toBe(true);expect(s.machine!.liftSolved).toBe(true);
  expect(s.players.every(p=>!p.ghost&&p.hp===3)).toBe(true);
  }
 });
 it('transitions only after both living players have escaped and jointly hold interact',()=>{
  const s=new Simulation();run(s,100,[hold(),hold()]);expect(s.sector).toBe(1);
  s.players.forEach((p,i)=>{p.x=1190+i*25;});s.step([hold(),idleInput()]);expect(s.won).toBe(true);
  run(s,100,[hold(),idleInput()]);expect(s.sector).toBe(1);run(s,74,[hold(),hold()]);expect(s.sector).toBe(2);expect(s.won).toBe(false);
 });
 it('the cage requires both roles in different positions and carries riders without jitter',()=>{
  const s=machine();s.players[0].x=236;s.players[1].x=196;
  run(s,120,[hold(),idleInput()]);expect(s.machine!.liftY).toBe(560);
  run(s,30,[hold()]);expect(s.machine!.liftY).toBe(560);
  run(s,90,[hold(),hold()]);expect(s.machine!.liftY).toBeCloseTo(464);
  for(const p of s.players)expect(Math.abs(p.y-s.machine!.liftY)).toBeLessThan(2);
  run(s,100,[hold(),hold()]);expect(s.machine!.liftSolved).toBe(true);
  // A missed cage can be called back, including after its first ascent.
  s.players.forEach((p,i)=>{p.x=196+i*40;p.y=560;});run(s,150,[hold(),idleInput()]);expect(s.machine!.liftY).toBe(560);
  run(s,30,[{...idleInput(),right:true},{...idleInput(),left:true}]);expect(s.players[0].x).toBeGreaterThan(220);expect(s.players[1].x).toBeLessThan(220);
 });
 it('receiver cannot be latched by ZIP alone or by hostile fire',()=>{
  const s=machine();const shoot=(owner=0)=>{s.bolts.push({x:450,y:352,vx:350,owner,life:1});run(s,10);};
  shoot();expect(s.machine!.relayCharge).toBe(0);
  s.players[1].x=326;s.players[1].y=368;s.players[1].grounded=true;run(s,6,[idleInput(),hold()]);
  s.bolts.push({x:450,y:352,vx:350,owner:0,life:1});run(s,10,[idleInput(),hold()]);expect(s.machine!.relayCharge).toBe(1);
  shoot(2);expect(s.machine!.relayCharge).toBe(1);expect(s.machine!.relay).toBe(false);
 });
 it('the ram core stays armoured until BRICK catches it and closes if he lets go',()=>{
  const s=machine(),m=s.machine!;m.chaseDone=true;m.checkpoint=3;
  s.players.forEach((p,i)=>{p.x=i?984:1044;p.y=432;p.grounded=true;});
  s.bolts.push({x:1080,y:416,vx:350,owner:0,life:1});run(s,5);expect(m.bossHp).toBe(6);
  run(s,135,[idleInput(),hold()]);expect(m.bossPhase).toBe('caught');
  s.bolts.push({x:1080,y:416,vx:350,owner:0,life:1});run(s,5,[idleInput(),hold()]);expect(m.bossHp).toBe(5);
  run(s,1);expect(m.bossPhase).toBe('windup');
 });
 it('trap gives a warning, begins pursuit and resets to a reachable shared checkpoint',()=>{
  const s=machine(),m=s.machine!;m.relay=true;m.checkpoint=2;s.players.forEach((p,i)=>{p.x=646+i*30;p.y=432;});
  run(s,60);expect(m.trap).toBeGreaterThan(0);expect(m.chaseX).toBe(550);
  run(s,45);expect(m.chaseX).toBeGreaterThan(550);
  s.players.forEach(p=>{p.ghost=true;});run(s,70);expect(s.players.every(p=>!p.ghost)).toBe(true);expect(s.machine!.trap).toBe(-1);expect(s.machine!.relay).toBe(true);
 });
 it('arbitrary demolition preserves required footholds, recovery ladders and the co-op route',()=>{
  const s=machine();for(let x=0;x<1280;x+=48)for(let y=256;y<600;y+=48)s.destroy(x,y,80);
  const before=machineTerrain(generateMachine(s.seed));before.forEach((tile,i)=>{if(tile===6||tile===11)expect(s.terrain[i]).toBe(tile);});
  const pilot=new MachinePilot();for(let t=0;t<9000&&!s.won;t++)s.step(pilot.controls(s.snapshot()));expect(s.won).toBe(true);
 });
 it('serialized snapshots resume the same moving machinery, hazards, enemies and boss state',()=>{
  const a=machine(),pilot=new MachinePilot();for(let t=0;t<650;t++)a.step(pilot.controls(a.snapshot()));
  const b=new Simulation();b.apply(JSON.parse(JSON.stringify(a.snapshot())));
  for(let t=0;t<500;t++){const input=pilot.controls(a.snapshot());a.step(input);b.step(input);expect(b.snapshot()).toEqual(a.snapshot());}
 });
 it('completes both sectors without state writes, including the freight-lift transition',()=>{
  const s=new Simulation(),pilot=new CampaignPilot();for(let t=0;t<12000&&!(s.sector===2&&s.won);t++)s.step(pilot.controls(s.snapshot()));expect(s.sector).toBe(2);expect(s.won).toBe(true);
 });
});
it('closed machinery cannot be bypassed over the top, and a fallen player can climb out',()=>{
 const s=machine();expect(s.solid(505,60)).toBe(true);expect(s.solid(1158,60)).toBe(true);
 const m=s.machine!;m.relay=true;m.liftSolved=true;m.checkpoint=2;
 s.players.forEach((p,i)=>{p.x=872;p.y=560;p.vx=0;p.vy=0;});
 run(s,100,[hold(),hold()]);expect(s.players.every(p=>p.y<435)).toBe(true);
});
it('both partners can recall an unreachable hologram in authoritative co-op',()=>{
 const s=machine();s.machine!.checkpoint=2;s.machine!.relay=true;
 s.players[0].ghost=true;s.players[0].y=100;s.players[1].x=700;s.players[1].y=560;
 run(s,120,[hold(),idleInput()]);expect(s.players[0].ghost).toBe(true);
 run(s,181,[hold(),hold()]);expect(s.players.every(p=>!p.ghost)).toBe(true);expect(s.machine!.checkpoint).toBe(2);expect(s.machine!.relay).toBe(true);
});
