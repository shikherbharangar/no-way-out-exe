import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=process.env.CAPTURE_DIR||'artifacts/supplied/acceptance';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],captures=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir(output,{recursive:true});
async function shot(name,condition='any'){
 const result=await page.evaluate(({condition})=>new Promise((resolve,reject)=>{
  const scene=window.__prison,game=scene.game;let phase=0,hidden=[],color='',tick=0;const frames={};
  const state=()=>({tick:scene.sim.tick,players:scene.sim.players.map((p,i)=>({x:p.x,y:p.y,vx:p.vx,grounded:p.grounded,action:p.action,frame:scene.sprites[i].frame.name})),gate:scene.sim.gate,hack:scene.sim.hack,rescued:scene.sim.rescued,rescueProgress:scene.sim.rescueProgress,checkpoint:scene.sim.checkpoint,remainingTiles:scene.sim.terrain.filter(t=>t>=0).length});
  const timer=setTimeout(()=>{game.events.off('postrender',render);reject(Error('Capture condition timed out: '+condition));},15000);
  function render(){
   if(!phase){
    const players=scene.sim.players,fire=scene.children.list.some(o=>o.texture?.key==='explosion'&&o.visible&&+o.frame.name>=4&&+o.frame.name<=8);
    if(condition==='run'&&!players.every((p,i)=>Math.abs(p.vx)>30&&p.grounded&&scene.sprites[i].frame.name==='run'))return;
    if(condition==='fire'&&!fire)return;
    if(condition==='attack'&&!players.some(p=>p.action>0))return;
    frames.state=state();tick=scene.sim.tick;frames.normal=game.canvas.toDataURL('image/png').split(',')[1];
    scene.scene.pause();color=scene.cameras.main.backgroundColor.rgba;
    hidden=scene.children.list.filter(o=>o.visible&&(o.depth<2||(o.texture?.key==='props'&&o.depth===17)));
    hidden.forEach(o=>o.setVisible(false));scene.cameras.main.setBackgroundColor('#242832');phase=1;
   }else if(phase===1){
    frames.neutral=game.canvas.toDataURL('image/png').split(',')[1];hidden.forEach(o=>o.setVisible(true));scene.cameras.main.setBackgroundColor(color);phase=2;
   }else{
    frames.restored=game.canvas.toDataURL('image/png').split(',')[1];frames.restoredState=state();
    game.events.off('postrender',render);clearTimeout(timer);scene.scene.resume();
    if(scene.sim.tick!==tick)reject(Error('Simulation advanced during readability pair'));else resolve(frames);
   }
  }game.events.on('postrender',render);
 }),{condition});
 for(const variant of ['normal','neutral','restored']){await writeFile(`${output}/${name}-${variant}.png`,Buffer.from(result[variant],'base64'));delete result[variant];}
 captures.push({name,...result});console.log('Captured '+name+' native/neutral/restored at tick '+result.state.tick);
}
async function drive(id,target,y=id?288:224){
 await page.evaluate(({id,target,y})=>new Promise((resolve,reject)=>{
  const scene=window.__prison,controls=id?{left:'ArrowLeft',right:'ArrowRight',jump:'ShiftRight',special:'ControlRight'}:{left:'KeyA',right:'KeyD',jump:'Space',special:'KeyG'},held=new Set(),start=performance.now(),first=scene.sim.tick;
  function key(code,down){if(held.has(code)===down)return;down?held.add(code):held.delete(code);window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true,cancelable:true}));}
  function release(){for(const code of [...held])key(code,false);}
  function frame(){const s=scene.sim,p=s.players[id],dir=Math.sign(target-p.x),gap=Math.abs(target-p.x),t=s.tick-first;
   if(gap<4&&p.grounded&&Math.abs(p.y-y)<3){release();resolve();return;}
   if(performance.now()-start>45000){release();reject(Error(`Route stalled ${id} at ${p.x},${p.y}`));return;}
   key(controls.left,gap>3&&dir<0);key(controls.right,gap>3&&dir>0);
   key(controls.jump,t%48<30&&(s.solid(p.x+dir*12,p.y-8)||p.y>290||(p.x>390&&p.x<475)));
   key(controls.special,id===1&&p.x>195&&p.x<300&&t%42<3);requestAnimationFrame(frame);
  }frame();
 }),{id,target,y});
}
try{
 await page.goto(process.env.GAME_CAPTURE_URL||'http://127.0.0.1:5173');await page.click('#play');await page.click('#start');
 await page.waitForFunction(()=>window.__prison.sim.tick>70);
 await shot('01-idle');
 await page.keyboard.down('KeyD');await page.keyboard.down('ArrowRight');await shot('02-running','run');
 await page.keyboard.up('KeyD');await page.keyboard.up('ArrowRight');
 await page.keyboard.down('KeyA');await page.waitForFunction(()=>window.__prison.sim.players[0].facing<0);await page.keyboard.up('KeyA');
 await page.keyboard.down('KeyG');await shot('03-electric-attack','attack');await page.keyboard.up('KeyG');
 await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__prison.sim.players[1].x>209);await page.keyboard.up('ArrowRight');
 await page.keyboard.down('ControlRight');await shot('04-explosion','fire');await page.keyboard.up('ControlRight');
 await page.waitForFunction(()=>!window.__prison.children.list.some(o=>o.texture?.key==='explosion'&&o.visible));
 await page.waitForTimeout(900);await shot('05-destroyed-wall');
 await drive(1,369);await drive(0,487);
 await page.keyboard.down('KeyF');await page.waitForFunction(()=>window.__prison.sim.hack>.25&&window.__prison.sim.hack<.8);
 await shot('06-cooperative-terminal');await page.waitForFunction(()=>window.__prison.sim.gate);await page.keyboard.up('KeyF');
 await drive(1,638,288);await drive(0,610,288);await shot('07-rescue-cage');
 await page.keyboard.down('Enter');await page.waitForFunction(()=>window.__prison.sim.rescueProgress>.25);await shot('08-rescue-interaction');await page.waitForFunction(()=>window.__prison.sim.rescued);await page.keyboard.up('Enter');
 await drive(1,688,288);await drive(0,658,288);await page.waitForFunction(()=>window.__prison.sim.checkpoint);await shot('09-checkpoint');
 assert.equal(errors.length,0);assert(captures[4].state.remainingTiles<captures[0].state.remainingTiles);
 await writeFile(`${output}/evidence.json`,JSON.stringify({capturedAt:new Date().toISOString(),method:'Real Phaser canvas; normal keyboard input. Paused scene only to hide/restore cosmetic background for same-tick readability pairs; no simulation writes.',resolution:[640,360],browserErrors:errors,captures},null,2)+'\n');
 console.log('PASS nine actual native scenes with neutral-background and restored pairs');
}finally{await browser.close();}
