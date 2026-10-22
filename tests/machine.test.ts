import {describe,it,expect} from 'vitest';
import {Simulation,idleInput} from '../src/game/simulation';
import {generateMachine,validateLayout} from '../src/game/machine';
import {MachinePilot} from './helpers/machine-pilot';
describe('THE MACHINE authored generation and playable route',()=>{
 it('selects deterministic connected rooms with satisfied ability constraints',()=>{
  const variants=new Set();for(let seed=0;seed<512;seed++){
   const layout=generateMachine(seed);expect(layout).toEqual(generateMachine(seed));expect(()=>validateLayout(layout)).not.toThrow();variants.add(layout.rooms.join('/'));
  }expect(variants.size).toBe(4);
  const bad=generateMachine(4);bad.rooms[1]='magnetic-heart';expect(()=>validateLayout(bad)).toThrow();
 });
 it('plays every selected layout from its entrance to the shared exit using controls only',()=>{
  for(const seed of [0,1,2,3,4,17,99,2026,65535]){
   const s=new Simulation(seed);s.enterMachine();const pilot=new MachinePilot();
   for(let tick=0;tick<9000&&!s.won;tick++)s.step(pilot.controls(s.snapshot()));
   expect({seed,stage:pilot.stage,p:s.players.map(p=>[Math.round(p.x),Math.round(p.y),p.hp]),m:s.machine}).toMatchObject({m:{bossHp:0,chaseDone:true,relay:true,liftSolved:true}});
   expect(s.won).toBe(true);
  }
 });
});
