import { it, expect } from 'vitest';
import { Simulation, idleInput, type Input } from '../src/game/simulation';
it('escapes from spawn using only player inputs, with no teleporting or gate overrides',()=>{
const s=new Simulation();const neutral=idleInput();
function approach(id:number,target:number,t:number):Input {
 const p=s.players[id],dir=Math.sign(target-p.x),gap=Math.abs(target-p.x);
 return {...neutral,left:gap>3&&dir<0,right:gap>3&&dir>0,jump:t%48<30&&(s.solid(p.x+dir*12,p.y-8)||p.y>290|| (p.x>390&&p.x<475)),special:id===1&&p.x>195&&p.x<300&&t%42===0};
}
for(let i=0;i<900;i++) {s.step([idleInput(),approach(1,369,i)]);}
for(let i=0;i<1200;i++) {s.step([approach(0,487,i),idleInput()]);}
for(let i=0;i<100;i++)s.step([{...neutral,interact:true},neutral]);
expect(s.plate).toBe(true);expect(s.gate).toBe(true);
for(let i=0;i<2100&&!s.won;i++){
 const a=approach(0,1190,i),b=approach(1,1215,i);
 a.special=i%40===0;a.interact=true;b.interact=true;
 // Keep destructive punch away from the upper walkway until necessary.
 b.special=i%60===0&&s.guards.some(g=>g.hp>0&&Math.abs(g.x-s.players[1].x)<60);
 s.step([a,b]);
}
expect(s.won).toBe(true);expect(s.checkpoint).toBe(true);expect(s.players.every(p=>!p.ghost)).toBe(true);expect(s.elapsed).toBeLessThan(70);
});
