import { describe, it, expect } from 'vitest';
import { Simulation, idleInput, COLS, makeTerrain, type Input } from '../src/game/simulation';
const input=(i: Partial<Input>={})=>({...idleInput(),...i});
function steps(s: Simulation, count: number, a: Partial<Input>={}, b: Partial<Input>={}) { for(let i=0;i<count;i++)s.step([input(a),input(b)]); }
describe('Cell Block Zero authoritative gameplay',()=>{
 it('settles both players on the floor, then moves with different speeds',()=>{
  const s=new Simulation();steps(s,5);expect(s.players.every(p=>p.grounded)).toBe(true);
  steps(s,20,{right:true},{right:true});expect(s.players[0].x-90).toBeGreaterThan(s.players[1].x-138);expect(s.players[0].y).toBeLessThan(290);
 });
 it('supports short and full jumps',()=>{
  const full=new Simulation(),short=new Simulation();steps(full,1,{jump:true});steps(short,1,{jump:true});
  steps(full,12,{jump:true});steps(short,12);expect(full.players[0].y).toBeLessThan(short.players[0].y-10);
 });
 it('buffers a jump just before landing',()=>{
  const s=new Simulation();s.players[0].y=285;s.players[0].vy=120;s.players[0].grounded=false;s.players[0].coyote=0;
  steps(s,1,{jump:true});steps(s,4,{jump:true});expect(s.players[0].vy).toBeLessThan(-200);
 });
 it('blasts actual masonry and floors; foundations survive',()=>{
  const s=new Simulation();const count=s.terrain.filter(t=>t>=0).length;s.explode(250,280,58);
  expect(s.terrain.filter(t=>t>=0).length).toBeLessThan(count-10);expect(s.terrain[18*COLS+15]).toBe(-1);expect(s.terrain[21*COLS+15]).toBe(11);
  expect(s.barrels[0].fuse).toBeGreaterThan(0);steps(s,30);expect(s.barrels[0].alive).toBe(false);
 });
 it('preserves bolted puzzle machinery when nearby terrain is destroyed',()=>{
  const s=new Simulation();s.explode(369,280,80);s.explode(487,218,90);s.explode(410,250,70);
  expect(s.solid(369,288)).toBe(true);expect(s.solid(487,224)).toBe(true);expect(s.solid(408,256)).toBe(true);
 });
 it('cannot open the gate with only ZIP or without interacting',()=>{
  const s=new Simulation();Object.assign(s.players[0],{x:487,y:224});steps(s,120,{interact:true});expect(s.gate).toBe(false);
  Object.assign(s.players[1],{x:369,y:288});steps(s,120);expect(s.gate).toBe(false);
 });
 it('opens the gate only when BRICK powers the link and ZIP completes the hack',()=>{
  const s=new Simulation();Object.assign(s.players[0],{x:487,y:224});Object.assign(s.players[1],{x:369,y:288});steps(s,95,{interact:true});expect(s.gate).toBe(true);expect(s.events.some(e=>e.type==='gate')).toBe(true);
 });
 it('keeps a closed gate solid and opens its collision after the puzzle',()=>{
  const s=new Simulation();expect(s.solid(615,260)).toBe(true);s.gate=true;expect(s.solid(615,260)).toBe(false);
 });
 it('allows a living partner to revive a ghost; total death restores terrain',()=>{
  const s=new Simulation();s.players[0].hp=1;s.damage(s.players[0]);expect(s.players[0].ghost).toBe(true);
  s.players[1].x=s.players[0].x+20;steps(s,55,{}, {interact:true});expect(s.players[0].ghost).toBe(false);
  s.explode(250,280);s.players.forEach(p=>{p.hurt=0;p.shield=0;p.hp=1;s.damage(p);});steps(s,75);
  expect(s.players.every(p=>p.hp===3&&!p.ghost)).toBe(true);expect(s.terrain).toEqual(makeTerrain());
 });
 it('requires both players inside the elevator',()=>{
  const s=new Simulation();s.players[0].x=1180;steps(s,2,{interact:true});expect(s.won).toBe(false);
  s.players[1].x=1205;steps(s,2,{interact:true});expect(s.won).toBe(true);
 });
 it('is deterministic across independent authoritative instances',()=>{
  const a=new Simulation(),b=new Simulation();
  for(let i=0;i<1000;i++){const inputs=[input({right:i%180<100,jump:i%50<18,special:i%63===0}),input({right:i%190<130,jump:i%65<20,special:i%48===0})];a.step(inputs);b.step(inputs);}
  expect(a.snapshot()).toEqual(b.snapshot());
 });
});
