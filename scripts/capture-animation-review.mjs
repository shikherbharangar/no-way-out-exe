import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const out='artifacts/animation-review'; await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],captures=[];
page.on('pageerror',e=>errors.push(e.message));
async function capture(label,scales){
 const result=await page.evaluate(async({scales})=>{
  const s=window.__prison,g=s.game;
  // Pause only rendering comparisons, after actual keyboard-driven movement.
  await new Promise(r=>g.events.once('postrender',r));s.scene.pause();
  const original=JSON.stringify(s.sim.snapshot());
  const tints=s.backdropLayers.map(o=>o.tintTopLeft),frames=[];
  const box=s.add.graphics().setDepth(28).setVisible(false);
  for(const p of s.sim.players)box.lineStyle(1,0xffff76,1).strokeRect(p.x-7,p.y-25,14,25);
  const shot=async(name)=>{
   await new Promise(r=>g.events.once('postrender',r));
   const native=g.canvas.toDataURL('image/png').split(',')[1];
   const large=document.createElement('canvas');large.width=1280;large.height=720;
   const c=large.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(g.canvas,0,0,1280,720);
   frames.push({name,native,large:large.toDataURL('image/png').split(',')[1]});
  };
  try{
   await shot('current');
   s.backdropLayers.forEach(o=>o.clearTint());await shot('previous-background');
   s.backdropLayers.forEach((o,i)=>o.setTint(tints[i]));await shot('restored');
   for(const scale of scales){
    s.sprites.forEach(o=>o.setScale(scale));
    const name=scale===.5?'half-diagnostic':scale===1/3?'third-diagnostic':`${scale}x`;
    await shot('scale-'+name);
    box.setVisible(true);await shot('scale-'+name+'-colliders');box.setVisible(false);
   }
   s.sprites.forEach(o=>o.setScale(s.supplied.meta.scale));
   await shot('final-restored');
   return {frames,state:JSON.parse(original),unchangedState:JSON.stringify(s.sim.snapshot())===original,
    heroFrames:s.sprites.map(o=>o.frame.name),tints};
  }finally{box.destroy();s.sprites.forEach(o=>o.setScale(s.supplied.meta.scale));s.backdropLayers.forEach((o,i)=>o.setTint(tints[i]));s.scene.resume();}
 },{scales});
 assert(result.unchangedState,'Cosmetic review changed authoritative state');
 const before=result.frames.find(f=>f.name==='current').native;
 assert.equal(before,result.frames.find(f=>f.name==='restored').native,'Tint restoration changed screenshot');
 assert.equal(before,result.frames.find(f=>f.name==='final-restored').native,'Scale restoration changed screenshot');
 for(const f of result.frames){
  for(const [suffix,data]of [['',f.native],['-2x',f.large]])await writeFile(`${out}/${label}-${f.name}${suffix}.png`,Buffer.from(data,'base64'));
  f.sha256=createHash('sha256').update(Buffer.from(f.native,'base64')).digest('hex');delete f.native;delete f.large;
 }
 captures.push({label,...result}); console.log('Captured '+label+' with unchanged simulation state');
}
try{
 await page.goto('http://127.0.0.1:5173');await page.click('#play');await page.click('#start');
 await page.waitForFunction(()=>window.__prison.sim.tick>75);
 // Keep both heroes away from viewport edges during the enlargement audit.
 await page.keyboard.down('KeyD');await page.waitForFunction(()=>window.__prison.sim.players[0].x>125);await page.keyboard.up('KeyD');
 await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__prison.sim.players[1].x>190);await page.keyboard.up('ArrowRight');
 await page.waitForFunction(()=>window.__prison.sim.players.every(p=>p.grounded&&Math.abs(p.vx)<1));
 await capture('idle',[1,2,3,.5,1/3]);
 await page.keyboard.down('KeyA');await page.keyboard.down('ArrowLeft');
 await page.waitForFunction(()=>window.__prison.sprites.every(o=>o.frame.name==='run'));
 await capture('running',[1,.5]);
 await page.keyboard.up('KeyA');await page.keyboard.up('ArrowLeft');
 await page.keyboard.down('KeyG');await page.keyboard.down('ControlRight');
 await page.waitForFunction(()=>window.__prison.sim.players.every(p=>p.action>0));
 await capture('combat',[1]);
 await page.keyboard.up('KeyG');await page.keyboard.up('ControlRight');
 assert.deepEqual(errors,[]);
 await writeFile(`${out}/scale-capture-evidence.json`,JSON.stringify({capturedAt:new Date().toISOString(),baseCommit:'fed52c9',
  method:'Actual Phaser gameplay via keyboard. Pause only for same-tick render-scale, collider-overlay and backdrop comparisons. No simulation writes. 2x files are nearest-neighbor enlargements.',
  liveScale:1,integerScaleCandidates:[1,2,3],diagnosticReductions:[.5,1/3],browserErrors:errors,captures},null,2)+'\n');
}finally{await browser.close();}
